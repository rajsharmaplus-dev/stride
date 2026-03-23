import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, '../stride.db');
const artifactDir = '/home/rajsharma/.gemini/antigravity/brain/ffd321e2-d8c6-4e57-8da1-64e3f16d4f57';
const outputFile = path.join(artifactDir, 'database_view.md');

const db = new Database(dbPath);

// Fetch ALL columns from projects
const projects = db.prepare('SELECT * FROM projects').all();
const audit = db.prepare('SELECT project_id, date, user, action, note FROM audit_log').all();
const users = db.prepare('SELECT id, name, role, email, manager_id FROM users').all();

let md = '# 🗄️ SQLite Database Live View\n\n';
md += 'This document shows the current state of the Stride database stored in `stride.db`.\n\n';

md += '## 🗺️ Entity Relationship (ER) Diagram\n\n';
md += '```mermaid\nerDiagram\n    USERS ||--o{ PROJECTS : "submits"\n    USERS ||--o{ PROJECTS : "manages"\n    USERS ||--o{ USERS : "reports to"\n    PROJECTS ||--o{ AUDIT_LOG : "has history"\n\n    USERS {\n        string id PK\n        string name\n        string email\n        string role\n        string manager_id FK\n    }\n    PROJECTS {\n        string id PK\n        string title\n        string submitter_id FK\n        string manager_id FK\n        string process\n        string status\n        float estimated_benefit\n        float actual_investment\n        float actual_roi\n    }\n    AUDIT_LOG {\n        int id PK\n        string project_id FK\n        string date\n        string user\n        string action\n        string note\n    }\n```\n\n';

md += '## 🛠️ Database Design & Schema\n\n';
md += '### SQL Schema (DDL)\n\n';
md += '```sql\n-- Core User Roster\nCREATE TABLE users (\n    id TEXT PRIMARY KEY,\n    name TEXT NOT NULL,\n    email TEXT NOT NULL,\n    role TEXT NOT NULL,\n    manager_id TEXT,\n    FOREIGN KEY (manager_id) REFERENCES users(id)\n);\n\n-- Project Pipeline\nCREATE TABLE projects (\n    id TEXT PRIMARY KEY,\n    title TEXT NOT NULL,\n    submitter_id TEXT NOT NULL,\n    manager_id TEXT NOT NULL,\n    process TEXT,\n    type TEXT,\n    methodology TEXT,\n    summary TEXT,\n    target_date TEXT,\n    estimated_benefit REAL,\n    status TEXT,\n    doc_link TEXT,\n    created_at TEXT,\n    actual_investment REAL,\n    actual_roi REAL,\n    FOREIGN KEY (submitter_id) REFERENCES users(id),\n    FOREIGN KEY (manager_id) REFERENCES users(id)\n);\n\n-- Immutable History Log\nCREATE TABLE audit_log (\n    id INTEGER PRIMARY KEY AUTOINCREMENT,\n    project_id TEXT NOT NULL,\n    date TEXT NOT NULL,\n    user TEXT NOT NULL,\n    action TEXT NOT NULL,\n    note TEXT,\n    FOREIGN KEY (project_id) REFERENCES projects(id)\n);\n```\n\n';

md += '## 📂 Projects (Full Data)\n\n';
md += '| ID | Title | Submitter | Manager | Process | Type | Methodology | Status | Est. Benefit | Inv. | ROI | Target Date | Created At | Summary | Doc Link |\n';
md += '| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |\n';
projects.forEach(p => {
    md += `| ${p.id} | ${p.title} | ${p.submitter_id} | ${p.manager_id} | ${p.process} | ${p.type} | ${p.methodology} | ${p.status} | $${(p.estimated_benefit || 0).toLocaleString()} | $${(p.actual_investment || 0).toLocaleString()} | $${(p.actual_roi || 0).toLocaleString()} | ${p.target_date || '-'} | ${p.created_at || '-'} | ${p.summary || '-'} | ${p.doc_link ? `[Link](${p.doc_link})` : '-'} |\n`;
});

md += '\n## 📝 Audit Log\n\n';
md += '| Project | Date | User | Action | Note |\n';
md += '| :--- | :--- | :--- | :--- | :--- |\n';
audit.forEach(a => {
    md += `| ${a.project_id} | ${a.date} | ${a.user} | ${a.action} | ${a.note} |\n`;
});

md += '\n## 👥 Users\n\n';
md += '| ID | Name | Role | Email | Manager |\n';
md += '| :--- | :--- | :--- | :--- | :--- |\n';
users.forEach(u => {
    md += `| ${u.id} | ${u.name} | ${u.role} | ${u.email} | ${u.manager_id || '-'} |\n`;
});

md += '\n---\n\n> [!TIP]\n';
md += '> You can run `node scripts/viewDb.js` in your terminal anytime to see this data in a table format.\n';

fs.writeFileSync(outputFile, md);
console.log('Comprehensive Database view artifact generated.');
db.close();
