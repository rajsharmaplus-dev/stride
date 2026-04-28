import express from 'express';
import db from '../db.js';
import { authorize } from '../middleware/auth.js';

const router = express.Router();

// IMPORTANT: read-all MUST be registered before /:id/read to avoid Express
// matching the literal string 'read-all' as a dynamic :id parameter.

// PATCH /api/notifications/read-all
router.patch('/read-all', authorize(), async (req, res) => {
    try {
        await db.query(
            'UPDATE notifications SET is_read = 1 WHERE user_id = $1',
            [req.user.id]
        );
        res.json({ success: true });
    } catch (error) {
        console.error('Error marking all notifications read:', error);
        res.status(500).json({ error: 'Database error' });
    }
});

// GET /api/notifications
router.get('/', authorize(), async (req, res) => {
    try {
        const result = await db.query(
            'SELECT * FROM notifications WHERE user_id = $1 ORDER BY is_read ASC, created_at DESC LIMIT 50',
            [req.user.id]
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({ error: 'Database error' });
    }
});

// PATCH /api/notifications/:id/read
// user_id guard prevents users marking other users' notifications as read (BOLA prevention)
router.patch('/:id/read', authorize(), async (req, res) => {
    const { id } = req.params;
    try {
        await db.query(
            'UPDATE notifications SET is_read = 1 WHERE id = $1 AND user_id = $2',
            [id, req.user.id]
        );
        res.json({ success: true });
    } catch (error) {
        console.error('Error marking notification read:', error);
        res.status(500).json({ error: 'Database error' });
    }
});

export default router;
