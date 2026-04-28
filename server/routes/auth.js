import express from 'express';
import { OAuth2Client } from 'google-auth-library';
import db from '../db.js';

const router    = express.Router();
const clientID  = process.env.VITE_GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID;
const oaClient  = new OAuth2Client(clientID);

// Cookie helper — keeps cookie options DRY
function setSessionCookie(res, sessionData) {
    res.cookie('stride_session', JSON.stringify(sessionData), {
        httpOnly: true,
        secure:   process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge:   7 * 24 * 60 * 60 * 1000,
        signed:   true,
    });
}

// GET /api/auth/config — returns the OAuth client ID to the frontend
router.get('/config', (req, res) => {
    res.json({ clientId: clientID });
});

// POST /api/auth/google-login — verifies Google JWT and issues session cookie
router.post('/google-login', async (req, res) => {
    const { credential } = req.body;
    if (!credential) return res.status(400).json({ error: 'Missing credential' });

    try {
        const ticket  = await oaClient.verifyIdToken({ idToken: credential, audience: clientID });
        const payload = ticket.getPayload();
        const { email, name, sub: googleId } = payload;
        const emailLower = email.toLowerCase();

        const userResult = await db.query('SELECT * FROM users WHERE LOWER(email) = $1', [emailLower]);
        let user = userResult.rows[0];

        if (!user) {
            const userId = `u${Date.now()}`;
            const role   = emailLower === 'rajsharmaplus@gmail.com' ? 'Admin' : 'Employee';
            await db.query(
                'INSERT INTO users (id, name, email, role, google_id) VALUES ($1, $2, $3, $4, $5)',
                [userId, name, emailLower, role, googleId]
            );
            user = { id: userId, name, email: emailLower, role, google_id: googleId };
        } else {
            if (user.status === 'Suspended') {
                return res.status(403).json({ error: 'Your account has been suspended. Please contact your administrator.' });
            }
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
        setSessionCookie(res, sessionData);
        res.json({ success: true, user: sessionData });
    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

// POST /api/auth/dev-login — dev only; bypasses Google OAuth
router.post('/dev-login', async (req, res) => {
    if (process.env.NODE_ENV === 'production') {
        return res.status(403).json({ error: 'Dev login is disabled in production' });
    }
    const { userId } = req.body;
    try {
        const userResult = await db.query('SELECT * FROM users WHERE id = $1', [userId]);
        const user = userResult.rows[0];
        if (!user) return res.status(404).json({ error: 'User not found' });

        const sessionData = { id: user.id, name: user.name, role: user.role };
        setSessionCookie(res, sessionData);
        res.json({ success: true, user: sessionData });
    } catch (error) {
        res.status(500).json({ error: 'Dev login failed' });
    }
});

// GET /api/auth/me — returns current session user, syncs role changes
router.get('/me', async (req, res) => {
    const sessionStr = req.signedCookies.stride_session;
    const session    = sessionStr ? JSON.parse(sessionStr) : null;
    if (!session) return res.json({ user: null });

    try {
        const userResult = await db.query('SELECT role, status FROM users WHERE id = $1', [session.id]);
        const user = userResult.rows[0];

        if (!user || user.status === 'Suspended') {
            res.clearCookie('stride_session');
            return res.json({ user: null });
        }
        // Real-time role sync — re-issue cookie if an admin changed the role mid-session
        if (user.role !== session.role) {
            session.role = user.role;
            setSessionCookie(res, session);
        }
        res.json({ user: session });
    } catch {
        res.json({ user: session }); // fallback to cookie if DB briefly unavailable
    }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
    res.clearCookie('stride_session');
    res.json({ success: true });
});

export default router;
