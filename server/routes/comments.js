import express from 'express';
import db from '../db.js';
import { authorize } from '../middleware/auth.js';
import { sanitize } from '../utils/validation.js';

const router = express.Router();

// GET /api/projects/:id/comments
router.get('/projects/:id/comments', authorize(), async (req, res) => {
    const { id } = req.params;
    try {
        const projectResult = await db.query(
            'SELECT submitter_id, manager_id FROM projects WHERE id = $1', [id]
        );
        if (projectResult.rowCount === 0) return res.status(404).json({ error: 'Project not found' });

        const p = projectResult.rows[0];
        if (req.user.role !== 'Admin' && req.user.id !== p.submitter_id && req.user.id !== p.manager_id) {
            return res.status(403).json({ error: 'Permission denied: You do not have access to this project' });
        }
        const commentsResult = await db.query(
            'SELECT * FROM comments WHERE project_id = $1 ORDER BY timestamp ASC', [id]
        );
        res.json(commentsResult.rows);
    } catch (error) {
        console.error('Error fetching comments:', error);
        res.status(500).json({ error: 'Database error' });
    }
});

// POST /api/comments
router.post('/comments', authorize(), async (req, res) => {
    const { projectId, userId, userName, text } = req.body;
    if (!projectId || !userId || !text) {
        return res.status(400).json({ error: 'Missing required fields' });
    }
    try {
        const projectResult = await db.query(
            'SELECT submitter_id, manager_id FROM projects WHERE id = $1', [projectId]
        );
        if (projectResult.rowCount === 0) return res.status(404).json({ error: 'Project not found' });

        const p = projectResult.rows[0];
        if (req.user.role !== 'Admin' && req.user.id !== p.submitter_id && req.user.id !== p.manager_id) {
            return res.status(403).json({ error: 'Permission denied: You do not have access to this project' });
        }
        const sanitizedText = sanitize(text);
        const timestamp     = new Date().toISOString();
        await db.query(
            'INSERT INTO comments (project_id, user_id, user_name, text, timestamp) VALUES ($1, $2, $3, $4, $5)',
            [projectId, userId, userName, sanitizedText, timestamp]
        );
        res.status(201).json({ message: 'Comment added' });
    } catch (error) {
        console.error('Error adding comment:', error);
        res.status(500).json({ error: 'Database error' });
    }
});

export default router;
