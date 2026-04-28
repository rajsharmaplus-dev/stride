import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import db from './db.js';

// Route modules
import authRoutes         from './routes/auth.js';
import projectRoutes      from './routes/projects.js';
import userRoutes         from './routes/users.js';
import commentRoutes      from './routes/comments.js';
import notificationRoutes from './routes/notifications.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT      = process.env.PORT || 3001;

const app = express();
app.set('trust proxy', 1); // required for express-rate-limit behind Cloud Run

// ── 1. Security Headers ────────────────────────────────────────────────────────
app.use((req, res, next) => {
    res.setHeader('Cross-Origin-Opener-Policy', 'unsafe-none');
    next();
});

// ── 2. CORS ────────────────────────────────────────────────────────────────────
const LOCAL_ORIGINS = [
    'http://localhost:8080',
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
    'http://localhost:5176',
];

app.use(cors({
    origin: (origin, callback) => {
        if (!origin) return callback(null, true); // allow curl / mobile
        const isCloudRun = /^https:\/\/stride-[a-zA-Z0-9-]+\.(?:[a-zA-Z0-9-]+\.)?run\.app$/.test(origin);
        const isLocal    = LOCAL_ORIGINS.includes(origin);
        if (isLocal || isCloudRun || process.env.NODE_ENV === 'production') {
            callback(null, true);
        } else {
            console.error('Blocked by CORS:', origin);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
}));

// ── 3. Rate Limiting ───────────────────────────────────────────────────────────
app.use('/api/', rateLimit({
    windowMs:       15 * 60 * 1000,
    max:            100,
    standardHeaders: true,
    legacyHeaders:  false,
    message:        { error: 'Too many requests, please try again later.' },
}));

// ── 4. Body Parser ─────────────────────────────────────────────────────────────
app.use(express.json());

// ── 5. Health Check ────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) =>
    res.json({ status: 'ok', engine: db.isPostgres ? 'PostgreSQL' : 'SQLite' })
);

// ── 6. Session (Signed Cookies) ────────────────────────────────────────────────
let sessionSecret = process.env.SESSION_SECRET;
if (!sessionSecret) {
    if (process.env.NODE_ENV === 'production') {
        throw new Error('FATAL: SESSION_SECRET is not set in the production environment.');
    }
    sessionSecret = 'stride_default_development_secret_key_123!';
    console.warn('WARNING: Using default session secret. Do not use in production!');
}
app.use(cookieParser(sessionSecret));

// ── 7. API Routes ──────────────────────────────────────────────────────────────
app.use('/api/auth',          authRoutes);
app.use('/api/projects',      projectRoutes);
app.use('/api/users',         userRoutes);
app.use('/api',               commentRoutes);   // mounts /api/projects/:id/comments + /api/comments
app.use('/api/notifications', notificationRoutes);

// ── 8. Static Frontend (React SPA) ────────────────────────────────────────────
const distPath = path.join(__dirname, '../dist');
app.use(express.static(distPath));
app.use((req, res) => res.sendFile(path.join(distPath, 'index.html'))); // SPA fallback

// ── 9. Startup: DB Migration + Listen ─────────────────────────────────────────
(async () => {
    try {
        await db.query(`
            CREATE TABLE IF NOT EXISTS notifications (
                id          SERIAL PRIMARY KEY,
                user_id     TEXT NOT NULL REFERENCES users(id),
                project_id  TEXT NOT NULL REFERENCES projects(id),
                type        TEXT NOT NULL,
                message     TEXT NOT NULL,
                is_read     INTEGER NOT NULL DEFAULT 0,
                created_at  TEXT NOT NULL
            );
            CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
        `);
        console.log('✅ notifications table ready');
    } catch (e) {
        console.warn('⚠️  notifications migration warning:', e.message);
    }

    app.listen(PORT, '0.0.0.0', () => {
        console.log(`🚀 Server running at http://0.0.0.0:${PORT}`);
    });
})();
