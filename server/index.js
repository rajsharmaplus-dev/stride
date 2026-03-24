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

// --- Security & Validation Helpers ---
const VALID_STATUSES = ['Draft', 'Pending Approval', 'Pending Rework', 'Active', 'Declined', 'Closed'];
const VALID_PROCESSES = ['Sales', 'HR', 'Finance', 'Operations', 'IT', 'Supply Chain'];
const VALID_TYPES = ['Cost Reduction', 'Revenue Generation', 'Compliance', 'Quality Improvement', 'Process Efficiency'];
const VALID_METHODOLOGIES = ['Six Sigma', 'Lean', 'Agile', 'Waterfall', 'Quick Win'];

/**
 * Simple sanitization to prevent XSS by stripping basic HTML tags
 */
function sanitize(text) {
    if (typeof text !== 'string') return text;
    return text.replace(/<[^>]*>?/gm, '').trim();
}

/**
 * Validates if the project data is consistent and safe
 */
function validateProject(p) {
    const errors = [];
    if (p.status && !VALID_STATUSES.includes(p.status)) errors.push(`Invalid status: ${p.status}`);
    if (p.process && !VALID_PROCESSES.includes(p.process)) errors.push(`Invalid process: ${p.process}`);
    if (p.type && !VALID_TYPES.includes(p.type)) errors.push(`Invalid type: ${p.type}`);
    if (p.methodology && !VALID_METHODOLOGIES.includes(p.methodology)) errors.push(`Invalid methodology: ${p.methodology}`);
    return errors;
}

// ------------------------------------
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
        // Sanitization & Validation
        const sanitizedTitle = sanitize(p.title);
        const sanitizedSummary = sanitize(p.summary);
        const validationErrors = validateProject(p);
        
        if (validationErrors.length > 0) {
            return res.status(400).json({ error: 'Validation failed', details: validationErrors });
        }

        const insertProject = db.prepare(`
            INSERT INTO projects (
                id, title, submitter_id, manager_id, process, type, methodology, 
                summary, target_date, estimated_benefit, status, doc_link, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        insertProject.run(
            p.id, sanitizedTitle, p.submitterId, p.managerId, p.process, p.type, p.methodology,
            sanitizedSummary, p.targetDate, p.estimatedBenefit, p.status, p.docLink, p.createdAt
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
            // Sanitization & Validation for updates
            const validationErrors = validateProject({ status, process, type, methodology });
            if (validationErrors.length > 0) {
                throw new Error(validationErrors.join(', '));
            }

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
                const sanitizedTitle = sanitize(title);
                const sanitizedSummary = sanitize(summary);
                const updateFields = db.prepare(`
                    UPDATE projects SET 
                        title = ?, summary = ?, process = ?, type = ?, 
                        methodology = ?, target_date = ?, doc_link = ? 
                    WHERE id = ?
                `);
                updateFields.run(sanitizedTitle, sanitizedSummary, process, type, methodology, targetDate, docLink, id);
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

// POST generic batch update
app.post('/api/projects/batch-update', (req, res) => {
    const { ids, updates, user, action, note } = req.body;
    if (!Array.isArray(ids) || ids.length === 0 || !updates || typeof updates !== 'object') {
        return res.status(400).json({ error: 'Invalid input' });
    }

    try {
        db.transaction(() => {
            const fields = Object.keys(updates);
            if (fields.length === 0) return;

            // Security: Whitelist allowed fields for bulk update
            const allowedFields = ['status', 'manager_id', 'process', 'type', 'methodology'];
            const validFields = fields.filter(f => allowedFields.includes(f));
            
            if (validFields.length === 0) throw new Error('No valid fields provided for update');

            const setClause = validFields.map(field => `${field} = ?`).join(', ');
            const values = validFields.map(f => updates[f]);
            
            const updateStmt = db.prepare(`UPDATE projects SET ${setClause} WHERE id = ?`);
            const insertAudit = db.prepare('INSERT INTO audit_log (project_id, date, user, action, note) VALUES (?, ?, ?, ?, ?)');
            const date = new Date().toISOString().split('T')[0];

            for (const id of ids) {
                // Final validation check for this batch item
                const validationErrors = validateProject(updates);
                if (validationErrors.length > 0) throw new Error(`Batch validation failed: ${validationErrors.join(', ')}`);

                updateStmt.run(...values, id);
                insertAudit.run(id, date, user, action || 'Bulk Update', note || `Updated: ${validFields.join(', ')}`);
            }
        })();
        res.json({ message: `${ids.length} projects updated` });
    } catch (error) {
        console.error('Error in batch update:', error);
        res.status(500).json({ error: error.message || 'Database error' });
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

// --- Phase 4: Collaboration (Comments) ---

// GET comments for a project
app.get('/api/projects/:id/comments', (req, res) => {
    const { id } = req.params;
    try {
        const comments = db.prepare('SELECT * FROM comments WHERE project_id = ? ORDER BY timestamp ASC').all(id);
        res.json(comments);
    } catch (error) {
        console.error('Error fetching comments:', error);
        res.status(500).json({ error: 'Database error' });
    }
});

// POST a new comment
app.post('/api/comments', (req, res) => {
    const { projectId, userId, userName, text } = req.body;
    if (!projectId || !userId || !text) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        const sanitizedText = sanitize(text);
        const timestamp = new Date().toISOString();
        const insertComment = db.prepare('INSERT INTO comments (project_id, user_id, user_name, text, timestamp) VALUES (?, ?, ?, ?, ?)');
        insertComment.run(projectId, userId, userName, sanitizedText, timestamp);
        res.status(201).json({ message: 'Comment added' });
    } catch (error) {
        console.error('Error adding comment:', error);
        res.status(500).json({ error: 'Database error' });
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Backend server running at http://0.0.0.0:${PORT}`);
});
