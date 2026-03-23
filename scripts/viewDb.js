import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, '../stride.db');
const db = new Database(dbPath);

const projects = db.prepare('SELECT id, title, process, status, estimated_benefit FROM projects').all();
const audit = db.prepare('SELECT project_id, date, user, action, note FROM audit_log').all();
const users = db.prepare('SELECT id, name, role FROM users').all();

console.log('### Projects');
console.table(projects);

console.log('\n### Audit Log');
console.table(audit);

console.log('\n### Users');
console.table(users);

db.close();
