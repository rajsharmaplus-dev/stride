import express from 'express';
import db from '../db.js';
import { authorize } from '../middleware/auth.js';
import { sanitize, validateProject } from '../utils/validation.js';
import { createNotification } from '../utils/notifications.js';

const router = express.Router();

// Shared audit log INSERT (PostgreSQL only)
const AUDIT_SQL = 'INSERT INTO audit_log (project_id, date, "user", action, note) VALUES ($1, $2, $3, $4, $5)';

// GET /api/projects
router.get('/', authorize(), async (req, res) => {
    let { limit = 20, offset = 0 } = req.query;
    limit  = parseInt(limit);
    offset = parseInt(offset);

    try {
        const isAdmin = req.user.role === 'Admin';
        const userId  = req.user.id;

        let totalQuery    = 'SELECT COUNT(*) as count FROM projects';
        let projectsQuery = `
            SELECT p.*, u1.name as submitter_name, u2.name as manager_name 
            FROM projects p 
            LEFT JOIN users u1 ON p.submitter_id = u1.id 
            LEFT JOIN users u2 ON p.manager_id   = u2.id
        `;
        let logQuery    = 'SELECT * FROM audit_log';
        let queryParams = [];

        if (!isAdmin) {
            totalQuery    += ' WHERE submitter_id = $1 OR manager_id = $1';
            projectsQuery += ' WHERE p.submitter_id = $1 OR p.manager_id = $2';
            logQuery       = `
                SELECT al.* FROM audit_log al
                JOIN projects p ON al.project_id = p.id
                WHERE p.submitter_id = $1 OR p.manager_id = $1
            `;
            queryParams = [userId];
        }

        projectsQuery += ` ORDER BY created_at DESC LIMIT $${isAdmin ? 1 : 3} OFFSET $${isAdmin ? 2 : 4}`;
        const projectQueryParams = isAdmin ? [] : [userId, userId];

        const [totalResult, projectsResult, logsResult] = await Promise.all([
            db.query(totalQuery,    queryParams),
            db.query(projectsQuery, [...projectQueryParams, limit, offset]),
            db.query(logQuery,      queryParams),
        ]);

        const total   = parseInt(totalResult.rows[0].count);
        const projects = projectsResult.rows;
        const logs    = logsResult.rows;

        const projectsWithLogs = projects.map(p => ({
            ...p,
            estimatedBenefit: Number(p.estimated_benefit),
            actualInvestment: p.actual_investment ? Number(p.actual_investment) : null,
            actualRoi:        p.actual_roi        ? Number(p.actual_roi)        : null,
            submitterId:      p.submitter_id,
            submitterName:    p.submitter_name,
            managerId:        p.manager_id,
            managerName:      p.manager_name,
            targetDate:       p.target_date,
            createdAt:        p.created_at,
            docLink:          p.doc_link,
            history: logs
                .filter(l => l.project_id === p.id)
                .sort((a, b) => new Date(b.date) - new Date(a.date)),
        }));

        res.json({ items: projectsWithLogs, total });
    } catch (error) {
        console.error('Error fetching projects:', error);
        res.status(500).json({ error: 'Database error', message: error.message });
    }
});

// POST /api/projects
router.post('/', authorize(), async (req, res) => {
    const p          = req.body;
    const { history } = p;

    // SECURITY: force submitter to authenticated user; prevent status skipping
    p.submitterId = req.user.id;
    if (p.status !== 'Draft' && p.status !== 'Pending Approval') p.status = 'Draft';

    try {
        const sanitizedTitle   = sanitize(p.title);
        const sanitizedSummary = sanitize(p.summary);
        const validationErrors = validateProject(p);
        if (validationErrors.length > 0) {
            return res.status(400).json({ error: 'Validation failed', details: validationErrors });
        }

        await db.transaction(async (client) => {
            await client.query(`
                INSERT INTO projects (
                    id, title, submitter_id, manager_id, process, type, methodology, 
                    summary, target_date, estimated_benefit, status, doc_link, created_at
                ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
            `, [
                p.id, sanitizedTitle, p.submitterId, p.managerId, p.process, p.type, p.methodology,
                sanitizedSummary, p.targetDate, p.estimatedBenefit, p.status, p.docLink, p.createdAt,
            ]);

            if (history?.length > 0) {
                for (const h of history) {
                    await client.query(AUDIT_SQL, [p.id, h.date, h.user, h.action, h.note]);
                }
            }

            const isDraft      = p.status === 'Draft';
            const notifType    = isDraft ? 'idea_draft' : 'idea_submitted';
            const employeeMsg  = isDraft
                ? `Your idea "${sanitizedTitle}" has been saved as a draft.`
                : `Your idea "${sanitizedTitle}" has been submitted for review.`;
            const managerMsg   = isDraft
                ? `${req.user.name} saved a new draft idea: "${sanitizedTitle}".`
                : `${req.user.name} submitted a new idea for your review: "${sanitizedTitle}".`;

            await createNotification(client, p.submitterId, p.id, notifType, employeeMsg);
            if (p.managerId && p.managerId !== p.submitterId) {
                await createNotification(client, p.managerId, p.id, notifType, managerMsg);
            }
        });

        res.status(201).json({ message: 'Project created' });
    } catch (error) {
        console.error('Error creating project:', error);
        res.status(500).json({ error: 'Database error' });
    }
});

// PATCH /api/projects/:id — status change, field edits, financial closure
router.patch('/:id', authorize(), async (req, res) => {
    const { id } = req.params;
    const {
        status, note, user: userName, action,
        actualInvestment, actualRoi,
        title, summary, process, type, methodology, targetDate, docLink, estimatedBenefit,
    } = req.body;

    try {
        const projectResult = await db.query('SELECT * FROM projects WHERE id = $1', [id]);
        const project       = projectResult.rows[0];
        if (!project) return res.status(404).json({ error: 'Project not found' });

        const { role, id: userId } = req.user;
        const isAdmin   = role === 'Admin';
        const isOwner   = project.submitter_id === userId;
        const isManager = project.manager_id   === userId;

        // Permission gates
        if (status || action || note) {
            const isResubmitting = status === 'Pending Approval' && project.status === 'Pending Rework' && isOwner;
            if (!isManager && !isAdmin && !isResubmitting) {
                return res.status(403).json({ error: 'Permission denied: Only the assigned manager or an admin can review this project' });
            }
        }
        if (actualInvestment !== undefined || actualRoi !== undefined || title || summary || process || type || methodology || targetDate || docLink || estimatedBenefit !== undefined) {
            if (!isOwner && !isAdmin) {
                return res.status(403).json({ error: 'Permission denied: Only the project owner or an admin can modify project details or financials' });
            }
        }
        if (title || summary || process || type || methodology || targetDate || docLink || estimatedBenefit !== undefined) {
            if (!isAdmin && project.status !== 'Draft' && project.status !== 'Pending Rework') {
                return res.status(403).json({ error: 'Permission denied: Core project details are locked after submission.' });
            }
        }

        await db.transaction(async (client) => {
            const validationErrors = validateProject({ status, process, type, methodology, actualInvestment, actualRoi, estimatedBenefit });
            if (validationErrors.length > 0) throw new Error(validationErrors.join(', '));

            if (status) {
                await client.query('UPDATE projects SET status = $1 WHERE id = $2', [status, id]);
            }
            if (actualInvestment !== undefined) {
                await client.query(
                    'UPDATE projects SET actual_investment = $1, actual_roi = $2 WHERE id = $3',
                    [actualInvestment, actualRoi, id]
                );
            }
            if (title || estimatedBenefit !== undefined) {
                await client.query(`
                    UPDATE projects SET 
                        title              = COALESCE($1, title),
                        summary            = COALESCE($2, summary),
                        process            = COALESCE($3, process),
                        type               = COALESCE($4, type),
                        methodology        = COALESCE($5, methodology),
                        target_date        = COALESCE($6, target_date),
                        doc_link           = COALESCE($7, doc_link),
                        estimated_benefit  = COALESCE($8, estimated_benefit)
                    WHERE id = $9
                `, [
                    title ? sanitize(title) : undefined,
                    summary ? sanitize(summary) : undefined,
                    process, type, methodology, targetDate, docLink, estimatedBenefit, id,
                ]);
            }
            if (action) {
                await client.query(AUDIT_SQL, [id, new Date().toISOString().split('T')[0], userName, action, note || '']);
            }

            const STATUS_NOTIF_MAP = {
                'Active':         { type: 'idea_approved', msg: `Great news! Your idea "${project.title}" has been approved and is now Active.` },
                'Declined':       { type: 'idea_declined', msg: `Your idea "${project.title}" was not approved at this time.` },
                'Pending Rework': { type: 'idea_rework',   msg: `Your idea "${project.title}" needs rework before approval. Check the comments.` },
            };
            if (status && STATUS_NOTIF_MAP[status]) {
                const { type: notifType, msg } = STATUS_NOTIF_MAP[status];
                await createNotification(client, project.submitter_id, id, notifType, msg);
            }
        });

        res.json({ message: 'Project updated' });
    } catch (error) {
        console.error('Error updating project:', error);
        res.status(error.message?.includes('Permission denied') ? 403 : 500)
           .json({ error: error.message || 'Database error' });
    }
});

// DELETE /api/projects/:id — Admin only
router.delete('/:id', authorize(['Admin']), async (req, res) => {
    const { id } = req.params;
    try {
        await db.transaction(async (client) => {
            await client.query('DELETE FROM notifications WHERE project_id = $1', [id]);
            await client.query('DELETE FROM audit_log    WHERE project_id = $1', [id]);
            await client.query('DELETE FROM projects     WHERE id = $1',         [id]);
        });
        res.json({ message: 'Project deleted' });
    } catch (error) {
        console.error('Error deleting project:', error);
        res.status(500).json({ error: 'Database error' });
    }
});

// POST /api/projects/batch-delete
// NOTE: registered before /:id routes so Express doesn't match 'batch-delete' as :id
router.post('/batch-delete', authorize(), async (req, res) => {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ error: 'Invalid IDs' });
    }
    try {
        await db.transaction(async (client) => {
            for (const id of ids) {
                const projectResult = await client.query(
                    'SELECT submitter_id, status FROM projects WHERE id = $1', [id]
                );
                const project = projectResult.rows[0];
                if (!project) continue;

                const isAdmin     = req.user.role === 'Admin';
                const isOwner     = project.submitter_id === req.user.id;
                const isDeletable = ['Draft', 'Pending Approval', 'Pending Rework'].includes(project.status);

                if (!isAdmin && !(isOwner && isDeletable)) {
                    throw new Error(`Unauthorized to delete project ${id}`);
                }
                await client.query('DELETE FROM notifications WHERE project_id = $1', [id]);
                await client.query('DELETE FROM audit_log    WHERE project_id = $1', [id]);
                await client.query('DELETE FROM projects     WHERE id = $1',         [id]);
            }
        });
        res.json({ message: `${ids.length} projects deleted` });
    } catch (error) {
        console.error('Error in batch delete:', error);
        res.status(error.message?.includes('Unauthorized') ? 403 : 500)
           .json({ error: error.message || 'Database error' });
    }
});

// POST /api/projects/batch-update-status
router.post('/batch-update-status', authorize(['Manager', 'Admin']), async (req, res) => {
    const { ids, status, user, action, note } = req.body;
    if (!Array.isArray(ids) || ids.length === 0 || !status) {
        return res.status(400).json({ error: 'Invalid input' });
    }
    try {
        await db.transaction(async (client) => {
            const date = new Date().toISOString().split('T')[0];
            for (const id of ids) {
                const projectResult = await client.query(
                    'SELECT manager_id, submitter_id, title FROM projects WHERE id = $1', [id]
                );
                if (projectResult.rowCount === 0) continue;

                const p = projectResult.rows[0];
                if (req.user.role !== 'Admin' && req.user.id !== p.manager_id) {
                    throw new Error(`Unauthorized to update status of project ${id}`);
                }

                await client.query('UPDATE projects SET status = $1 WHERE id = $2', [status, id]);
                await client.query(AUDIT_SQL, [id, date, user, action || status, note || '']);

                const BATCH_NOTIF_MAP = {
                    'Active':   { type: 'idea_approved', msg: `Your idea "${p.title}" has been approved.` },
                    'Declined': { type: 'idea_declined', msg: `Your idea "${p.title}" was not approved at this time.` },
                };
                if (BATCH_NOTIF_MAP[status]) {
                    const { type: notifType, msg } = BATCH_NOTIF_MAP[status];
                    await createNotification(client, p.submitter_id, id, notifType, msg);
                }
            }
        });
        res.json({ message: `${ids.length} projects updated` });
    } catch (error) {
        console.error('Error in batch update status:', error);
        res.status(500).json({ error: 'Database error' });
    }
});

// POST /api/projects/batch-update
router.post('/batch-update', authorize(['Manager', 'Admin']), async (req, res) => {
    const { ids, updates, user, action, note } = req.body;
    if (!Array.isArray(ids) || ids.length === 0 || !updates) {
        return res.status(400).json({ error: 'Invalid input' });
    }
    try {
        await db.transaction(async (client) => {
            const date = new Date().toISOString().split('T')[0];
            for (const id of ids) {
                const projectResult = await client.query(
                    'SELECT manager_id FROM projects WHERE id = $1', [id]
                );
                if (projectResult.rowCount === 0) continue;

                const p = projectResult.rows[0];
                if (req.user.role !== 'Admin' && req.user.id !== p.manager_id) {
                    throw new Error(`Unauthorized to modify project ${id}`);
                }
                if (updates.manager_id) {
                    await client.query('UPDATE projects SET manager_id = $1 WHERE id = $2', [updates.manager_id, id]);
                }
                await client.query(AUDIT_SQL, [id, date, user, action || 'Updated', note || '']);
            }
        });
        res.json({ message: `${ids.length} projects updated` });
    } catch (error) {
        console.error('Error in batch update:', error);
        res.status(error.message?.includes('Unauthorized') ? 403 : 500)
           .json({ error: error.message || 'Database error' });
    }
});

export default router;
