import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import xss from 'xss';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import { OAuth2Client } from 'google-auth-library';
import db from './db.js';

const client = new OAuth2Client(process.env.VITE_GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID);

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// No manual pool instantiation here; handled by db.js

const app = express();

// --- 1. Security Headers (Must be at the top level) ---
app.use((req, res, next) => {
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
    next();
});

app.get('/api/auth/config', (req, res) => {
    res.json({ 
        clientId: process.env.VITE_GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID 
    });
});

// --- 2. Production Security Middleware ---
const allowedOrigins = [
    'http://localhost:8080', 
    'http://localhost:5173', 
    'http://localhost:5174', 
    'http://localhost:5175', 
    'http://localhost:5176'
];

app.use(cors({
    origin: (origin, callback) => {
        // Allow if no origin (like mobile apps or curl) or if it's in the whitelist
        // Or if it's a sub-domain of .run.app (Production)
        if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.run.app')) {
            callback(null, true);
        } else {
            console.error('Blocked by CORS:', origin);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));

const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests, please try again later.' }
});

app.use('/api/', apiLimiter);
app.use(express.json());
app.use(cookieParser(process.env.SESSION_SECRET || 'stride_default_development_secret_key_123!'));

const PORT = process.env.PORT || 3001;

// --- Security & Validation Helpers ---
const VALID_STATUSES = ['Draft', 'Pending Approval', 'Pending Rework', 'Active', 'Declined', 'Closed'];
const VALID_PROCESSES = ['Sales', 'HR', 'Finance', 'Operations', 'IT', 'Supply Chain'];
const VALID_TYPES = ['Cost Reduction', 'Revenue Generation', 'Compliance', 'Quality Improvement', 'Process Efficiency'];
const VALID_METHODOLOGIES = ['Six Sigma', 'Lean', 'Agile', 'Waterfall', 'Quick Win'];

function sanitize(text) {
    if (typeof text !== 'string') return text;
    return xss(text);
}

function validateProject(p) {
    const errors = [];
    if (p.status && !VALID_STATUSES.includes(p.status)) errors.push(`Invalid status: ${p.status}`);
    if (p.process && !VALID_PROCESSES.includes(p.process)) errors.push(`Invalid process: ${p.process}`);
    if (p.type && !VALID_TYPES.includes(p.type)) errors.push(`Invalid type: ${p.type}`);
    if (p.methodology && !VALID_METHODOLOGIES.includes(p.methodology)) errors.push(`Invalid methodology: ${p.methodology}`);
    
    if (p.estimatedBenefit !== undefined && (isNaN(p.estimatedBenefit) || parseFloat(p.estimatedBenefit) < 0)) {
        errors.push('Estimated benefit must be a non-negative number');
    }
    if (p.actualInvestment !== undefined && p.actualInvestment !== null && (isNaN(p.actualInvestment) || parseFloat(p.actualInvestment) < 0)) {
        errors.push('Actual investment must be a non-negative number');
    }
    if (p.actualRoi !== undefined && p.actualRoi !== null && (isNaN(p.actualRoi) || parseFloat(p.actualRoi) < 0)) {
        errors.push('Actual ROI must be a non-negative number');
    }
    
    return errors;
}

// --- RBAC Authorization Middleware ---
function authorize(allowedRoles = []) {
    return (req, res, next) => {
        // Use signedCookies to prevent client-side tampering
        const sessionStr = req.signedCookies.stride_session;
        const session = sessionStr ? JSON.parse(sessionStr) : null;
        
        if (!session || !session.id || !session.role) {
            return res.status(401).json({ error: 'Authentication required' });
        }
        
        if (allowedRoles.length > 0 && !allowedRoles.includes(session.role)) {
            return res.status(403).json({ error: 'Permission denied: Insufficient privileges' });
        }
        
        req.user = session;
        next();
    };
}

// --- Authentication Endpoints ---
app.post('/api/auth/google-login', async (req, res) => {
    const { credential } = req.body;
    if (!credential) return res.status(400).json({ error: 'Missing credential' });

    try {
        const ticket = await client.verifyIdToken({
            idToken: credential,
            audience: process.env.VITE_GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();

        const { email, name, sub: googleId } = payload;

        const emailLower = email.toLowerCase();
        const userResult = await db.query('SELECT * FROM users WHERE LOWER(email) = $1', [emailLower]);
        let user = userResult.rows[0];

        if (!user) {
            const userId = `u${Date.now()}`;
            // Auto-promote the owner to Admin on the live site
            const role = emailLower === 'rajsharmaplus@gmail.com' ? 'Admin' : 'Employee';
            
            await db.query('INSERT INTO users (id, name, email, role, google_id) VALUES ($1, $2, $3, $4, $5)', 
                [userId, name, emailLower, role, googleId]);
            user = { id: userId, name, email: emailLower, role: role, google_id: googleId };
        } else {
            // FORCE PROMOTE owner if they were already in the DB as an Employee
            if (emailLower === 'rajsharmaplus@gmail.com' && user.role !== 'Admin') {
                await db.query('UPDATE users SET role = $1 WHERE id = $2', ['Admin', user.id]);
                user.role = 'Admin';
            }
            
            if (!user.google_id) {
                await db.query('UPDATE users SET google_id = $1 WHERE id = $2', [googleId, user.id]);
                user.google_id = googleId;
            }
        }

        const sessionData = { id: user.id, name: user.name, role: user.role };
        
        res.cookie('stride_session', JSON.stringify(sessionData), {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000,
            signed: true
        });

        res.json({ success: true, user: sessionData });
    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

app.post('/api/auth/dev-login', async (req, res) => {
    const { userId } = req.body;
    try {
        const userResult = await db.query('SELECT * FROM users WHERE id = $1', [userId]);
        const user = userResult.rows[0];
        if (!user) return res.status(404).json({ error: 'User not found' });

        const sessionData = { id: user.id, name: user.name, role: user.role };
        res.cookie('stride_session', JSON.stringify(sessionData), {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000,
            signed: true
        });
        res.json({ success: true, user: sessionData });
    } catch (error) {
        res.status(500).json({ error: 'Dev login failed' });
    }
});

app.get('/api/auth/config', (req, res) => {
    res.json({ 
        clientId: process.env.VITE_GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID 
    });
});

app.get('/api/auth/me', (req, res) => {
    const sessionStr = req.signedCookies.stride_session;
    const session = sessionStr ? JSON.parse(sessionStr) : null;
    if (!session) return res.json({ user: null });
    res.json({ user: session });
});

app.post('/api/auth/logout', (req, res) => {
    res.clearCookie('stride_session');
    res.json({ success: true });
});

app.get('/api/projects', authorize(), async (req, res) => {
    let { limit = 20, offset = 0 } = req.query;
    limit = parseInt(limit);
    offset = parseInt(offset);

    try {
        const isAdmin = req.user.role === 'Admin';
        const userId = req.user.id;

        let totalQuery = 'SELECT COUNT(*) as count FROM projects';
        let projectsQuery = 'SELECT * FROM projects';
        let logQuery = 'SELECT * FROM audit_log';
        let queryParams = [];

        if (!isAdmin) {
            totalQuery += ' WHERE submitter_id = $1 OR manager_id = $1';
            projectsQuery += ' WHERE submitter_id = $1 OR manager_id = $2';
            // We only need logs for projects the user can see
            logQuery = `
                SELECT al.* FROM audit_log al
                JOIN projects p ON al.project_id = p.id
                WHERE p.submitter_id = $1 OR p.manager_id = $1
            `;
            queryParams = [userId, userId];
        }

        projectsQuery += ` ORDER BY created_at DESC LIMIT $${isAdmin ? 1 : 3} OFFSET $${isAdmin ? 2 : 4}`;

        const totalResult = await db.query(totalQuery, queryParams);
        const total = parseInt(totalResult.rows[0].count);
        
        const projectsResult = await db.query(projectsQuery, [...queryParams, limit, offset]);
        const projects = projectsResult.rows;
        
        const logsResult = await db.query(logQuery, queryParams);
        const logs = logsResult.rows;

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

        res.json({ items: projectsWithLogs, total });
    } catch (error) {
        console.error('Error fetching projects:', error);
        res.status(500).json({ error: 'Database error', message: error.message });
    }
});

app.post('/api/projects', authorize(), async (req, res) => {
    const p = req.body;
    const { history } = p;

    try {
        const sanitizedTitle = sanitize(p.title);
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
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
            `, [
                p.id, sanitizedTitle, p.submitterId, p.managerId, p.process, p.type, p.methodology,
                sanitizedSummary, p.targetDate, p.estimatedBenefit, p.status, p.docLink, p.createdAt
            ]);

            if (history && history.length > 0) {
                for (const h of history) {
                    await client.query(
                        db.isPostgres 
                            ? 'INSERT INTO audit_log (project_id, date, "user", action, note) VALUES ($1, $2, $3, $4, $5)'
                            : 'INSERT INTO audit_log (project_id, date, user, action, note) VALUES ($1, $2, $3, $4, $5)',
                        [p.id, h.date, h.user, h.action, h.note]
                    );
                }
            }
        });
        res.status(201).json({ message: 'Project created' });
    } catch (error) {
        console.error('Error creating project:', error);
        res.status(500).json({ error: 'Database error' });
    }
});

app.patch('/api/projects/:id', authorize(), async (req, res) => {
    const { id } = req.params;
    const { status, note, user: userName, action, actualInvestment, actualRoi, title, summary, process, type, methodology, targetDate, docLink, estimatedBenefit } = req.body;

    try {
        const projectResult = await db.query('SELECT * FROM projects WHERE id = $1', [id]);
        const project = projectResult.rows[0];
        if (!project) return res.status(404).json({ error: 'Project not found' });

        const sessionUser = req.user;
        const isAdmin = sessionUser.role === 'Admin';
        const isOwner = project.submitter_id === sessionUser.id;
        const isManager = project.manager_id === sessionUser.id;

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

        await db.transaction(async (client) => {
            const validationErrors = validateProject({ 
                status, process, type, methodology, 
                actualInvestment, actualRoi, estimatedBenefit
            });
            if (validationErrors.length > 0) {
                throw new Error(validationErrors.join(', '));
            }

            if (status) {
                await client.query('UPDATE projects SET status = $1 WHERE id = $2', [status, id]);
            }

            if (actualInvestment !== undefined) {
                await client.query('UPDATE projects SET actual_investment = $1, actual_roi = $2 WHERE id = $3', 
                    [actualInvestment, actualRoi, id]);
            }

            if (title || estimatedBenefit !== undefined) {
                const sanitizedTitle = title ? sanitize(title) : undefined;
                const sanitizedSummary = summary ? sanitize(summary) : undefined;
                await client.query(`
                    UPDATE projects SET 
                        title = COALESCE($1, title), 
                        summary = COALESCE($2, summary), 
                        process = COALESCE($3, process), 
                        type = COALESCE($4, type), 
                        methodology = COALESCE($5, methodology), 
                        target_date = COALESCE($6, target_date), 
                        doc_link = COALESCE($7, doc_link),
                        estimated_benefit = COALESCE($8, estimated_benefit)
                    WHERE id = $9
                `, [sanitizedTitle, sanitizedSummary, process, type, methodology, targetDate, docLink, estimatedBenefit, id]);
            }

            if (action) {
                await client.query(
                    db.isPostgres
                        ? 'INSERT INTO audit_log (project_id, date, "user", action, note) VALUES ($1, $2, $3, $4, $5)'
                        : 'INSERT INTO audit_log (project_id, date, user, action, note) VALUES ($1, $2, $3, $4, $5)',
                    [id, new Date().toISOString().split('T')[0], userName, action, note || '']
                );
            }
        });
        res.json({ message: 'Project updated' });
    } catch (error) {
        console.error('Error updating project:', error);
        res.status(error.message.includes('Permission denied') ? 403 : 500).json({ error: error.message || 'Database error' });
    }
});

app.delete('/api/projects/:id', authorize(['Admin']), async (req, res) => {
    const { id } = req.params;
    try {
        await db.transaction(async (client) => {
            await client.query('DELETE FROM audit_log WHERE project_id = $1', [id]);
            await client.query('DELETE FROM projects WHERE id = $1', [id]);
        });
        res.json({ message: 'Project deleted' });
    } catch (error) {
        console.error('Error deleting project:', error);
        res.status(500).json({ error: 'Database error' });
    }
});

app.post('/api/projects/batch-delete', authorize(), async (req, res) => {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ error: 'Invalid IDs' });
    }

    try {
        await db.transaction(async (client) => {
            const sessionUser = req.user;
            
            for (const id of ids) {
                const projectResult = await client.query('SELECT submitter_id, status FROM projects WHERE id = $1', [id]);
                const project = projectResult.rows[0];
                if (!project) continue;

                const isAdmin = sessionUser.role === 'Admin';
                const isOwner = project.submitter_id === sessionUser.id;
                const isDeletable = ['Draft', 'Pending Approval', 'Pending Rework'].includes(project.status);

                if (!isAdmin && !(isOwner && isDeletable)) {
                    throw new Error(`Unauthorized to delete project ${id}`);
                }

                await client.query('DELETE FROM audit_log WHERE project_id = $1', [id]);
                await client.query('DELETE FROM projects WHERE id = $1', [id]);
            }
        });
        res.json({ message: `${ids.length} projects deleted` });
    } catch (error) {
        console.error('Error in batch delete:', error);
        res.status(error.message.includes('Unauthorized') ? 403 : 500).json({ error: error.message || 'Database error' });
    }
});

app.post('/api/projects/batch-update-status', authorize(['Manager', 'Admin']), async (req, res) => {
    const { ids, status, user, action, note } = req.body;
    if (!Array.isArray(ids) || ids.length === 0 || !status) {
        return res.status(400).json({ error: 'Invalid input' });
    }

    try {
        await db.transaction(async (client) => {
            const date = new Date().toISOString().split('T')[0];

            for (const id of ids) {
                await client.query('UPDATE projects SET status = $1 WHERE id = $2', [status, id]);
                await client.query(
                    db.isPostgres
                        ? 'INSERT INTO audit_log (project_id, date, "user", action, note) VALUES ($1, $2, $3, $4, $5)'
                        : 'INSERT INTO audit_log (project_id, date, user, action, note) VALUES ($1, $2, $3, $4, $5)',
                    [id, date, user, action || status, note || '']
                );
            }
        });
        res.json({ message: `${ids.length} projects updated` });
    } catch (error) {
        console.error('Error in batch update status:', error);
        res.status(500).json({ error: 'Database error' });
    }
});
app.post('/api/projects/batch-update', authorize(['Manager', 'Admin']), async (req, res) => {
    const { ids, updates, user, action, note } = req.body;
    if (!Array.isArray(ids) || ids.length === 0 || !updates) {
        return res.status(400).json({ error: 'Invalid input' });
    }

    try {
        await db.transaction(async (client) => {
            const date = new Date().toISOString().split('T')[0];

            for (const id of ids) {
                const projectResult = await client.query('SELECT manager_id FROM projects WHERE id = $1', [id]);
                if (projectResult.rowCount === 0) continue;
                
                const p = projectResult.rows[0];
                if (req.user.role !== 'Admin' && req.user.id !== p.manager_id) {
                    throw new Error(`Unauthorized to modify project ${id}`);
                }
                
                if (updates.manager_id) {
                    await client.query('UPDATE projects SET manager_id = $1 WHERE id = $2', [updates.manager_id, id]);
                }
                
                await client.query(
                    db.isPostgres
                        ? 'INSERT INTO audit_log (project_id, date, "user", action, note) VALUES ($1, $2, $3, $4, $5)'
                        : 'INSERT INTO audit_log (project_id, date, user, action, note) VALUES ($1, $2, $3, $4, $5)',
                    [id, date, user, action || 'Updated', note || '']
                );
            }
        });
        res.json({ message: `${ids.length} projects updated` });
    } catch (error) {
        console.error('Error in batch update:', error);
        res.status(error.message.includes('Unauthorized') ? 403 : 500).json({ error: error.message || 'Database error' });
    }
});

app.get('/api/users', authorize(['Admin']), async (req, res) => {
    try {
        const usersResult = await db.query('SELECT * FROM users ORDER BY name ASC');
        res.json(usersResult.rows);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Database error' });
    }
});

// Limited view for Employees to select a manager
app.get('/api/users/reviewers', authorize(), async (req, res) => {
    try {
        const usersResult = await db.query(
            'SELECT id, name, role FROM users WHERE role IN ($1, $2) ORDER BY name ASC',
            ['Manager', 'Admin']
        );
        res.json(usersResult.rows);
    } catch (error) {
        console.error('Error fetching reviewers:', error);
        res.status(500).json({ error: 'Database error' });
    }
});

app.patch('/api/users/:id/role', authorize(['Admin']), async (req, res) => {
    const { id } = req.params;
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

app.get('/api/projects/:id/comments', authorize(), async (req, res) => {
    const { id } = req.params;
    try {
        const projectResult = await db.query('SELECT submitter_id, manager_id FROM projects WHERE id = $1', [id]);
        if (projectResult.rowCount === 0) return res.status(404).json({ error: 'Project not found' });
        const p = projectResult.rows[0];
        if (req.user.role !== 'Admin' && req.user.id !== p.submitter_id && req.user.id !== p.manager_id) {
            return res.status(403).json({ error: 'Permission denied: You do not have access to this project' });
        }

        const commentsResult = await db.query('SELECT * FROM comments WHERE project_id = $1 ORDER BY timestamp ASC', [id]);
        res.json(commentsResult.rows);
    } catch (error) {
        console.error('Error fetching comments:', error);
        res.status(500).json({ error: 'Database error' });
    }
});

app.post('/api/comments', authorize(), async (req, res) => {
    const { projectId, userId, userName, text } = req.body;
    if (!projectId || !userId || !text) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        const projectResult = await db.query('SELECT submitter_id, manager_id FROM projects WHERE id = $1', [projectId]);
        if (projectResult.rowCount === 0) return res.status(404).json({ error: 'Project not found' });
        const p = projectResult.rows[0];
        if (req.user.role !== 'Admin' && req.user.id !== p.submitter_id && req.user.id !== p.manager_id) {
            return res.status(403).json({ error: 'Permission denied: You do not have access to this project' });
        }

        const sanitizedText = sanitize(text);
        const timestamp = new Date().toISOString();
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

// --- Production Static Serving ---
const distPath = path.join(__dirname, '../dist');
app.use(express.static(distPath));

// Fallback for React Router (Single Page Application)
app.use((req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Backend server running at http://0.0.0.0:${PORT}`);
});
