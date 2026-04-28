import express from 'express';
import db from '../db.js';
import { authorize } from '../middleware/auth.js';

const router = express.Router();

// GET /api/users — Admin: full list
router.get('/', authorize(['Admin']), async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM users ORDER BY name ASC');
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Database error' });
    }
});

// GET /api/users/reviewers — any authenticated user: managers + admins for dropdowns
// IMPORTANT: registered before /:id routes to avoid Express matching 'reviewers' as :id
router.get('/reviewers', authorize(), async (req, res) => {
    try {
        const result = await db.query(
            "SELECT id, name, role FROM users WHERE role IN ('Manager', 'Admin') ORDER BY name ASC"
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching reviewers:', error);
        res.status(500).json({ error: 'Database error' });
    }
});

// PATCH /api/users/:id/role
router.patch('/:id/role', authorize(['Admin']), async (req, res) => {
    const { id }   = req.params;
    const { role } = req.body;

    if (!['Employee', 'Manager', 'Admin'].includes(role)) {
        return res.status(400).json({ error: 'Invalid role' });
    }
    try {
        await db.query('UPDATE users SET role = $1 WHERE id = $2', [role, id]);
        res.json({ success: true, message: `User role updated to ${role}` });
    } catch (error) {
        console.error('Error updating user role:', error);
        res.status(500).json({ error: 'Database error' });
    }
});

// PATCH /api/users/:id/status
router.patch('/:id/status', authorize(['Admin']), async (req, res) => {
    const { id }     = req.params;
    const { status } = req.body;

    if (!['Active', 'Suspended'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
    }
    if (id === req.user.id) {
        return res.status(400).json({ error: 'Cannot suspend your own account' });
    }
    try {
        await db.query('UPDATE users SET status = $1 WHERE id = $2', [status, id]);
        res.json({ success: true, message: `User status updated to ${status}` });
    } catch (error) {
        console.error('Error updating user status:', error);
        res.status(500).json({ error: 'Database error' });
    }
});

// DELETE /api/users/:id
router.delete('/:id', authorize(['Admin']), async (req, res) => {
    const { id } = req.params;
    if (id === req.user.id) {
        return res.status(400).json({ error: 'Cannot delete your own account' });
    }
    try {
        const projectsCheck = await db.query(
            'SELECT COUNT(*) as count FROM projects WHERE submitter_id = $1 OR manager_id = $1',
            [id]
        );
        const projectCount = parseInt(projectsCheck.rows[0].count);
        if (projectCount > 0) {
            return res.status(400).json({
                error: `User has ${projectCount} attached projects. Please delete those projects first or Suspend the user instead.`
            });
        }
        await db.transaction(async (client) => {
            await client.query('DELETE FROM comments WHERE user_id = $1', [id]);
            await client.query('DELETE FROM users WHERE id = $1', [id]);
        });
        res.json({ success: true, message: 'User permanently removed' });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ error: 'Database error' });
    }
});

export default router;
