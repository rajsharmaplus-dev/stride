import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, '../stride.db');

const db = new Database(dbPath);
db.pragma('foreign_keys = OFF');

// Create tables
db.exec(`
    CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        role TEXT NOT NULL,
        manager_id TEXT,
        FOREIGN KEY (manager_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS projects (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        submitter_id TEXT NOT NULL,
        manager_id TEXT NOT NULL,
        process TEXT,
        type TEXT,
        methodology TEXT,
        summary TEXT,
        target_date TEXT,
        estimated_benefit REAL,
        status TEXT,
        doc_link TEXT,
        created_at TEXT,
        actual_investment REAL,
        actual_roi REAL,
        FOREIGN KEY (submitter_id) REFERENCES users(id),
        FOREIGN KEY (manager_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS audit_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id TEXT NOT NULL,
        date TEXT NOT NULL,
        user TEXT NOT NULL,
        action TEXT NOT NULL,
        note TEXT,
        FOREIGN KEY (project_id) REFERENCES projects(id)
    );
`);

// Mock Data
const MOCK_USERS = [
    { id: 'u1', name: 'Alex Submitter', email: 'alex@company.com', role: 'Employee', managerId: 'u2' },
    { id: 'u2', name: 'Sarah Manager', email: 'sarah@company.com', role: 'Manager', managerId: 'u3' },
    { id: 'u3', name: 'David Business Head', email: 'david@company.com', role: 'Admin', managerId: null },
];

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

// Seed Users
const insertUser = db.prepare('INSERT OR IGNORE INTO users (id, name, email, role, manager_id) VALUES (?, ?, ?, ?, ?)');
MOCK_USERS.forEach(u => insertUser.run(u.id, u.name, u.email, u.role, u.managerId));

// Seed Projects and History
const insertProject = db.prepare(`
    INSERT OR IGNORE INTO projects (
        id, title, submitter_id, manager_id, process, type, methodology, 
        summary, target_date, estimated_benefit, status, doc_link, created_at, 
        actual_investment, actual_roi
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const insertAudit = db.prepare('INSERT INTO audit_log (project_id, date, user, action, note) VALUES (?, ?, ?, ?, ?)');

INITIAL_PROJECTS.forEach(p => {
    insertProject.run(
        p.id, p.title, p.submitterId, p.managerId, p.process, p.type, p.methodology,
        p.summary, p.targetDate, p.estimatedBenefit, p.status, p.docLink, p.createdAt,
        p.actualInvestment, p.actualRoi
    );

    if (p.history) {
        p.history.forEach(h => {
            insertAudit.run(p.id, h.date, h.user, h.action, h.note);
        });
    }
});

console.log('Database initialized successfully with mock data.');
db.close();
