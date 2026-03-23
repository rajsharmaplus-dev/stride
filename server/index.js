import express from 'express';
import cors from 'cors';
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, '../stride.db');
const db = new Database(dbPath);

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 3001;

// GET all projects with their audit logs
app.get('/api/projects', (req, res) => {
    try {
        const projects = db.prepare('SELECT * FROM projects').all();
        const logs = db.prepare('SELECT * FROM audit_log').all();

        // Group logs by project_id
        const projectsWithLogs = projects.map(p => ({
            ...p,
            estimatedBenefit: Number(p.estimated_benefit),
            actualInvestment: p.actual_investment ? Number(p.actual_investment) : null,
            actualRoi: p.actual_roi ? Number(p.actual_roi) : null,
            submitterId: p.submitter_id,
            managerId: p.manager_id,
            targetDate: p.target_date,
            createdAt: p.created_at,
            docLink: p.doc_link,
            history: logs
                .filter(l => l.project_id === p.id)
                .sort((a, b) => new Date(b.date) - new Date(a.date))
        }));

        res.json(projectsWithLogs);
    } catch (error) {
        console.error('Error fetching projects:', error);
        res.status(500).json({ error: 'Database error' });
    }
});

// POST a new project
app.post('/api/projects', (req, res) => {
    const p = req.body;
    const { history, ...data } = p;

    try {
        const insertProject = db.prepare(`
            INSERT INTO projects (
                id, title, submitter_id, manager_id, process, type, methodology, 
                summary, target_date, estimated_benefit, status, doc_link, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        insertProject.run(
            p.id, p.title, p.submitterId, p.managerId, p.process, p.type, p.methodology,
            p.summary, p.targetDate, p.estimatedBenefit, p.status, p.docLink, p.createdAt
        );

        if (history && history.length > 0) {
            const insertAudit = db.prepare('INSERT INTO audit_log (project_id, date, user, action, note) VALUES (?, ?, ?, ?, ?)');
            history.forEach(h => insertAudit.run(p.id, h.date, h.user, h.action, h.note));
        }

        res.status(201).json({ message: 'Project created' });
    } catch (error) {
        console.error('Error creating project:', error);
        res.status(500).json({ error: 'Database error' });
    }
});

// PATCH / update project status or details
app.patch('/api/projects/:id', (req, res) => {
    const { id } = req.params;
    const { status, note, user, action, actualInvestment, actualRoi, title, summary, process, type, methodology, targetDate, docLink } = req.body;

    try {
        db.transaction(() => {
            if (status) {
                const updateStatus = db.prepare('UPDATE projects SET status = ? WHERE id = ?');
                updateStatus.run(status, id);
            }

            if (actualInvestment !== undefined) {
                const updateInvestment = db.prepare('UPDATE projects SET actual_investment = ?, actual_roi = ? WHERE id = ?');
                updateInvestment.run(actualInvestment, actualRoi, id);
            }

            // Support full updates for rework
            if (title) {
                const updateFields = db.prepare(`
                    UPDATE projects SET 
                        title = ?, summary = ?, process = ?, type = ?, 
                        methodology = ?, target_date = ?, doc_link = ? 
                    WHERE id = ?
                `);
                updateFields.run(title, summary, process, type, methodology, targetDate, docLink, id);
            }

            if (action) {
                const insertAudit = db.prepare('INSERT INTO audit_log (project_id, date, user, action, note) VALUES (?, ?, ?, ?, ?)');
                insertAudit.run(id, new Date().toISOString().split('T')[0], user, action, note || '');
            }
        })();

        res.json({ message: 'Project updated' });
    } catch (error) {
        console.error('Error updating project:', error);
        res.status(500).json({ error: 'Database error' });
    }
});

// DELETE a single project
app.delete('/api/projects/:id', (req, res) => {
    const { id } = req.params;
    try {
        db.transaction(() => {
            db.prepare('DELETE FROM audit_log WHERE project_id = ?').run(id);
            db.prepare('DELETE FROM projects WHERE id = ?').run(id);
        })();
        res.json({ message: 'Project deleted' });
    } catch (error) {
        console.error('Error deleting project:', error);
        res.status(500).json({ error: 'Database error' });
    }
});

// POST batch delete
app.post('/api/projects/batch-delete', (req, res) => {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ error: 'Invalid IDs' });
    }

    try {
        db.transaction(() => {
            const deleteLogs = db.prepare('DELETE FROM audit_log WHERE project_id = ?');
            const deleteProjects = db.prepare('DELETE FROM projects WHERE id = ?');
            for (const id of ids) {
                deleteLogs.run(id);
                deleteProjects.run(id);
            }
        })();
        res.json({ message: `${ids.length} projects deleted` });
    } catch (error) {
        console.error('Error in batch delete:', error);
        res.status(500).json({ error: 'Database error' });
    }
});

// POST batch update status
app.post('/api/projects/batch-update-status', (req, res) => {
    const { ids, status, user, action, note } = req.body;
    if (!Array.isArray(ids) || ids.length === 0 || !status) {
        return res.status(400).json({ error: 'Invalid input' });
    }

    try {
        db.transaction(() => {
            const updateStatus = db.prepare('UPDATE projects SET status = ? WHERE id = ?');
            const insertAudit = db.prepare('INSERT INTO audit_log (project_id, date, user, action, note) VALUES (?, ?, ?, ?, ?)');
            const date = new Date().toISOString().split('T')[0];

            for (const id of ids) {
                updateStatus.run(status, id);
                insertAudit.run(id, date, user, action || status, note || '');
            }
        })();
        res.json({ message: `${ids.length} projects updated` });
    } catch (error) {
        console.error('Error in batch update status:', error);
        res.status(500).json({ error: 'Database error' });
    }
});

// GET all users
app.get('/api/users', (req, res) => {
    try {
        const users = db.prepare('SELECT * FROM users').all();
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: 'Database error' });
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Backend server running at http://0.0.0.0:${PORT}`);
});
