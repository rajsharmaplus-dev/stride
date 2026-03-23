import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, '../stride.db');

const query = process.argv[2];

if (!query) {
    console.error('Usage: node scripts/sql.js "SELECT * FROM projects"');
    process.exit(1);
}

try {
    const db = new Database(dbPath);
    const result = db.prepare(query).all();
    console.table(result);
    db.close();
} catch (error) {
    console.error('Error executing query:', error.message);
}
