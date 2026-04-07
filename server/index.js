import express from 'express';
import cors from 'cors';
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import xss from 'xss';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import { OAuth2Client } from 'google-auth-library';

const client = new OAuth2Client('REPLACE_WITH_YOUR_GOOGLE_CLIENT_ID'); // Placeholder

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, '../stride.db');
const db = new Database(dbPath);

const app = express();

// --- Production Security Middleware ---
// 1. Specific CORS for Production (Adjust as needed for GCP)
const allowedOrigins = ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'http://localhost:5176'];
app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('CORS blocked: Origin not allowed'));
        }
    }
}));

// 2. Global Rate Limiting to prevent DoS/Brute Force
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per window
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests, please try again later.' }
});

app.use('/api/', apiLimiter);
app.use(express.json());
app.use(cookieParser());

const PORT = 3001;

// --- Security & Validation Helpers ---
const VALID_STATUSES = ['Draft', 'Pending Approval', 'Pending Rework', 'Active', 'Declined', 'Closed'];
const VALID_PROCESSES = ['Sales', 'HR', 'Finance', 'Operations', 'IT', 'Supply Chain'];
const VALID_TYPES = ['Cost Reduction', 'Revenue Generation', 'Compliance', 'Quality Improvement', 'Process Efficiency'];
const VALID_METHODOLOGIES = ['Six Sigma', 'Lean', 'Agile', 'Waterfall', 'Quick Win'];

/**
 * Robust sanitization to prevent XSS using the 'xss' library
 */
function sanitize(text) {
    if (typeof text !== 'string') return text;
    return xss(text);
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
    
    // Numeric Validation
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
/**
 * Simple authorization middleware to enforce role-based access on the server.
 * In a production app, this would verify a JWT or session token.
 */
function authorize(allowedRoles = []) {
    return (req, res, next) => {
        // Now using secure cookie sessions instead of insecure headers
        const session = req.cookies.stride_session ? JSON.parse(req.cookies.stride_session) : null;
        
        if (!session || !session.userId || !session.role) {
            return res.status(401).json({ error: 'Authentication required' });
        }
        
        if (allowedRoles.length > 0 && !allowedRoles.includes(session.role)) {
            return res.status(403).json({ error: 'Permission denied: Insufficient privileges' });
        }
        
        req.user = session; // Attach user info to request
        next();
    };
}
// ------------------------------------

// --- Authentication Endpoints ---

// Verify Google ID Token and establish session
app.post('/api/auth/google-login', async (req, res) => {
    const { credential } = req.body;
    if (!credential) return res.status(400).json({ error: 'Missing credential' });

    try {
        // In a real app, you would verify the token with Google:
        // const ticket = await client.verifyIdToken({ idToken: credential, audience: 'CLIENT_ID' });
        // const payload = ticket.getPayload();
        
        // For this implementation, we'll decode the JWT (non-secure for demo, but structure is correct)
        // Note: Real implementation MUST use client.verifyIdToken()
        const base64Url = credential.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const payload = JSON.parse(Buffer.from(base64, 'base64').toString());

        const { email, name, sub: googleId } = payload;

        // DB JIT Provisioning / Lookup
        let user = db.prepare('SELECT * FROM users WHERE google_id = ? OR email = ?').get(googleId, email);

        if (!user) {
            // New User: Auto-provision as Employee
            const userId = `u${Date.now()}`;
            db.prepare('INSERT INTO users (id, name, email, role, google_id) VALUES (?, ?, ?, ?, ?)')
              .run(userId, name, email, 'Employee', googleId);
            user = { id: userId, name, email, role: 'Employee', google_id: googleId };
        } else if (!user.google_id) {
            // Link existing mock user to Google ID
            db.prepare('UPDATE users SET google_id = ? WHERE id = ?').run(googleId, user.id);
            user.google_id = googleId;
        }

        const sessionData = { userId: user.id, name: user.name, role: user.role };
        
        res.cookie('stride_session', JSON.stringify(sessionData), {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        res.json({ success: true, user: sessionData });
    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

app.get('/api/auth/me', (req, res) => {
    const session = req.cookies.stride_session ? JSON.parse(req.cookies.stride_session) : null;
    if (!session) return res.json({ user: null });
    res.json({ user: session });
});

app.post('/api/auth/logout', (req, res) => {
    res.clearCookie('stride_session');
    res.json({ success: true });
});


app.get('/api/projects', authorize(), (req, res) => {
    let { limit = 20, offset = 0 } = req.query; // Reduced default limit for testing pagination
    limit = parseInt(limit);
    offset = parseInt(offset);

    try {
        const total = db.prepare('SELECT COUNT(*) as count FROM projects').get().count;
        const projects = db.prepare('SELECT * FROM projects LIMIT ? OFFSET ?').all(limit, offset);
        const logs = db.prepare('SELECT * FROM audit_log').all();

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
        res.status(500).json({ error: 'Database error' });
    }
});

// POST a new project
app.post('/api/projects', authorize(), (req, res) => {
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
app.patch('/api/projects/:id', authorize(), (req, res) => {
    const { id } = req.params;
    const { status, note, user: userName, action, actualInvestment, actualRoi, title, summary, process, type, methodology, targetDate, docLink } = req.body;

    try {
        const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(id);
        if (!project) return res.status(404).json({ error: 'Project not found' });

        const sessionUser = req.user;
        const isAdmin = sessionUser.role === 'Admin';
        const isOwner = project.submitter_id === sessionUser.userId;
        const isManager = project.manager_id === sessionUser.userId;

        // --- RBAC Enforcement ---
        
        // 1. Review Actions (Status, note, action) require Manager or Admin
        if (status || action || note) {
            // Special Case: A submitter can change status to 'Pending Approval' when resubmitting from 'Rework'
            const isResubmitting = status === 'Pending Approval' && project.status === 'Pending Rework' && isOwner;
            
            if (!isManager && !isAdmin && !isResubmitting) {
                return res.status(403).json({ error: 'Permission denied: Only the assigned manager or an admin can review this project' });
            }
        }

        // 2. Structural edits (title, summary, financials) require Owner or Admin
        if (actualInvestment !== undefined || actualRoi !== undefined || title || summary || process || type || methodology || targetDate || docLink) {
            if (!isOwner && !isAdmin) {
                return res.status(403).json({ error: 'Permission denied: Only the project owner or an admin can modify project details or financials' });
            }
        }

        db.transaction(() => {
            // Sanitization & Validation for updates
            const validationErrors = validateProject({ 
                status, process, type, methodology, 
                actualInvestment, actualRoi 
            });
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
                insertAudit.run(id, new Date().toISOString().split('T')[0], userName, action, note || '');
            }
        })();

        res.json({ message: 'Project updated' });
    } catch (error) {
        console.error('Error updating project:', error);
        res.status(error.message.includes('Permission denied') ? 403 : 500).json({ error: error.message || 'Database error' });
    }
});

// DELETE a single project (Only Admin or specific authorized users)
app.delete('/api/projects/:id', authorize(['Admin']), (req, res) => {
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

// POST batch delete (Only Admin or Owner of specific subsets)
app.post('/api/projects/batch-delete', authorize(), (req, res) => {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ error: 'Invalid IDs' });
    }

    try {
        db.transaction(() => {
            const sessionUser = req.user;
            const deleteLogs = db.prepare('DELETE FROM audit_log WHERE project_id = ?');
            const deleteProject = db.prepare('DELETE FROM projects WHERE id = ?');
            
            for (const id of ids) {
                const project = db.prepare('SELECT submitter_id, status FROM projects WHERE id = ?').get(id);
                if (!project) continue;

                const isAdmin = sessionUser.role === 'Admin';
                const isOwner = project.submitter_id === sessionUser.userId;
                const isDeletable = ['Draft', 'Pending Approval', 'Pending Rework'].includes(project.status);

                if (!isAdmin && !(isOwner && isDeletable)) {
                    throw new Error(`Unauthorized to delete project ${id}`);
                }

                deleteLogs.run(id);
                deleteProject.run(id);
            }
        })();
        res.json({ message: `${ids.length} projects deleted` });
    } catch (error) {
        console.error('Error in batch delete:', error);
        res.status(error.message.includes('Unauthorized') ? 403 : 500).json({ error: error.message || 'Database error' });
    }
});

// POST batch update status (Manager/Admin)
app.post('/api/projects/batch-update-status', authorize(['Manager', 'Admin']), (req, res) => {
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

// POST generic batch update (Manager/Admin)
app.post('/api/projects/batch-update', authorize(['Manager', 'Admin']), (req, res) => {
    const { ids, updates, user, action, note } = req.body;
    if (!Array.isArray(ids) || ids.length === 0 || !updates || typeof updates !== 'object') {
        return res.status(400).json({ error: 'Invalid input' });
    }

    try {
        db.transaction(() => {
            const fields = Object.keys(updates);
            if (fields.length === 0) return;

            // Security: Whitelist allowed fields for bulk update (Immutable)
            const ALLOWED_FIELDS = Object.freeze(['status', 'manager_id', 'process', 'type', 'methodology']);
            const validFields = fields.filter(f => ALLOWED_FIELDS.includes(f));
            
            if (validFields.length === 0) throw new Error('No valid fields provided for update');

            // Construct the set clause using ONLY validated field names
            const setClause = validFields.map(field => `"${field}" = ?`).join(', ');
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


// GET all users (Open access for initial identity selection)
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
app.get('/api/projects/:id/comments', authorize(), (req, res) => {
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
app.post('/api/comments', authorize(), (req, res) => {
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
