import 'dotenv/config';
import db from './db.js';

async function initDb() {
    console.log(`Initializing Database... (${db.isPostgres ? 'PostgreSQL' : 'SQLite'})`);
    
    try {
        await db.transaction(async (client) => {
            console.log('Creating tables...');
            
            await client.query(`
                CREATE TABLE IF NOT EXISTS users (
                    id TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    email TEXT NOT NULL UNIQUE,
                    role TEXT NOT NULL,
                    manager_id TEXT REFERENCES users(id),
                    google_id TEXT UNIQUE,
                    status TEXT DEFAULT 'Active'
                );
            `);

            // SQLite handles decimals as REAL/NUMERIC. 
            // In Postgres we use DECIMAL(15,2). Both work with this SQL:
            await client.query(`
                CREATE TABLE IF NOT EXISTS projects (
                    id TEXT PRIMARY KEY,
                    title TEXT NOT NULL,
                    submitter_id TEXT NOT NULL REFERENCES users(id),
                    manager_id TEXT NOT NULL REFERENCES users(id),
                    process TEXT,
                    type TEXT,
                    methodology TEXT,
                    summary TEXT,
                    target_date TEXT,
                    estimated_benefit DECIMAL(15,2),
                    status TEXT,
                    doc_link TEXT,
                    created_at TEXT,
                    actual_investment DECIMAL(15,2),
                    actual_roi DECIMAL(15,2)
                );
            `);

            // Handle SERIAL (Postgres) vs INTEGER PRIMARY KEY AUTOINCREMENT (SQLite)
            const auditTableSql = db.isPostgres 
                ? `CREATE TABLE IF NOT EXISTS audit_log (
                    id SERIAL PRIMARY KEY,
                    project_id TEXT NOT NULL REFERENCES projects(id),
                    date TEXT NOT NULL,
                    "user" TEXT NOT NULL,
                    action TEXT NOT NULL,
                    note TEXT
                  );`
                : `CREATE TABLE IF NOT EXISTS audit_log (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    project_id TEXT NOT NULL REFERENCES projects(id),
                    date TEXT NOT NULL,
                    user TEXT NOT NULL,
                    action TEXT NOT NULL,
                    note TEXT
                  );`;
            
            await client.query(auditTableSql);

            const commentsTableSql = db.isPostgres
                ? `CREATE TABLE IF NOT EXISTS comments (
                    id SERIAL PRIMARY KEY,
                    project_id TEXT NOT NULL REFERENCES projects(id),
                    user_id TEXT NOT NULL,
                    user_name TEXT NOT NULL,
                    text TEXT NOT NULL,
                    timestamp TEXT NOT NULL
                  );`
                : `CREATE TABLE IF NOT EXISTS comments (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    project_id TEXT NOT NULL REFERENCES projects(id),
                    user_id TEXT NOT NULL,
                    user_name TEXT NOT NULL,
                    text TEXT NOT NULL,
                    timestamp TEXT NOT NULL
                  );`;

            await client.query(commentsTableSql);

            // Notifications table
            const notificationsTableSql = db.isPostgres
                ? `CREATE TABLE IF NOT EXISTS notifications (
                    id          SERIAL PRIMARY KEY,
                    user_id     TEXT NOT NULL REFERENCES users(id),
                    project_id  TEXT NOT NULL REFERENCES projects(id),
                    type        TEXT NOT NULL,
                    message     TEXT NOT NULL,
                    is_read     INTEGER NOT NULL DEFAULT 0,
                    created_at  TEXT NOT NULL
                  );
                  CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);`
                : `CREATE TABLE IF NOT EXISTS notifications (
                    id          INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id     TEXT NOT NULL REFERENCES users(id),
                    project_id  TEXT NOT NULL REFERENCES projects(id),
                    type        TEXT NOT NULL,
                    message     TEXT NOT NULL,
                    is_read     INTEGER NOT NULL DEFAULT 0,
                    created_at  TEXT NOT NULL
                  );`;

            await client.query(notificationsTableSql);

            // Mock Data Seeding
            console.log('Seeding mock data...');
            
            const MOCK_USERS = [
                { id: 'u3', name: 'David Business Head', email: 'david@company.com', role: 'Admin', managerId: null },
                { id: 'u2', name: 'Sarah Manager', email: 'sarah@company.com', role: 'Manager', managerId: 'u3' },
                { id: 'u1', name: 'Alex Submitter', email: 'alex@company.com', role: 'Employee', managerId: 'u2' },
            ];

            for (const u of MOCK_USERS) {
                // SQLite doesn't support ON CONFLICT (id) DO NOTHING the same way as Postgres but it works.
                // Actually SQLite supports ON CONFLICT(id) DO NOTHING.
                await client.query(
                    `INSERT INTO users (id, name, email, role, manager_id) 
                     VALUES ($1, $2, $3, $4, $5) 
                     ON CONFLICT (id) DO NOTHING`,
                    [u.id, u.name, u.email, u.role, u.managerId]
                );
            }

            const INITIAL_PROJECTS = [
                {
                    id: 'p1',
                    title: 'Automated Invoice Processing',
                    submitterId: 'u1',
                    managerId: 'u2',
                    process: 'Finance',
                    type: 'Cost Reduction',
                    methodology: 'Lean',
                    summary: 'Current manual entry takes 40 hours/week. Automation will reduce this to 5 hours.',
                    targetDate: '2024-12-31',
                    estimatedBenefit: 50000,
                    status: 'Active',
                    docLink: 'https://sharepoint.com/project1',
                    createdAt: '2024-01-15',
                    actualInvestment: null,
                    actualRoi: null,
                    history: [{ date: '2024-01-15', user: 'Sarah Manager', action: 'Approved', note: 'Strong business case.' }]
                },
                {
                    id: 'p2',
                    title: 'Q3 Sales Training Program',
                    submitterId: 'u1',
                    managerId: 'u2',
                    process: 'Sales',
                    type: 'Revenue Generation',
                    methodology: 'Agile',
                    summary: 'Upskilling sales team on new CRM features.',
                    targetDate: '2024-09-15',
                    estimatedBenefit: 120000,
                    status: 'Pending Approval',
                    docLink: '',
                    createdAt: '2024-03-10',
                    history: []
                },
                {
                    id: 'p3',
                    title: 'Legacy System Upgrade',
                    submitterId: 'u1',
                    managerId: 'u2',
                    process: 'IT',
                    type: 'Compliance',
                    methodology: 'Waterfall',
                    summary: 'Updating servers to meet new security protocols.',
                    targetDate: '2024-06-01',
                    estimatedBenefit: 30000,
                    status: 'Closed',
                    docLink: '',
                    createdAt: '2023-11-20',
                    actualInvestment: 12000,
                    actualRoi: 45000,
                    history: [
                        { date: '2024-01-05', user: 'Alex Submitter', action: 'Closed', note: 'Project completed successfully.' },
                        { date: '2023-12-01', user: 'Sarah Manager', action: 'Approved', note: 'Mandatory compliance item.' }
                    ]
                }
            ];

            for (const p of INITIAL_PROJECTS) {
                await client.query(`
                    INSERT INTO projects (
                        id, title, submitter_id, manager_id, process, type, methodology, 
                        summary, target_date, estimated_benefit, status, doc_link, created_at, 
                        actual_investment, actual_roi
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
                    ON CONFLICT (id) DO NOTHING
                `, [
                    p.id, p.title, p.submitterId, p.managerId, p.process, p.type, p.methodology,
                    p.summary, p.targetDate, p.estimatedBenefit, p.status, p.docLink, p.createdAt,
                    p.actualInvestment, p.actualRoi
                ]);

                if (p.history) {
                    for (const h of p.history) {
                        // Avoid duplicates during init
                        const logExists = await client.query(
                            'SELECT 1 FROM audit_log WHERE project_id = $1 AND action = $2 AND date = $3',
                            [p.id, h.action, h.date]
                        );
                        if (logExists.rowCount === 0) {
                            await client.query(
                                db.isPostgres 
                                    ? 'INSERT INTO audit_log (project_id, date, "user", action, note) VALUES ($1, $2, $3, $4, $5)'
                                    : 'INSERT INTO audit_log (project_id, date, user, action, note) VALUES ($1, $2, $3, $4, $5)',
                                [p.id, h.date, h.user, h.action, h.note]
                            );
                        }
                    }
                }
            }
        });
        console.log('Database initialized successfully.');
    } catch (error) {
        console.error('Database initialization error:', error);
        process.exit(1);
    }
}

initDb();
