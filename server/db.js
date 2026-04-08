import pg from 'pg';
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const { Pool } = pg;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Detect Environment
const isPostgres = !!(process.env.PGHOST || process.env.DATABASE_URL);
console.log(`Database Engine: ${isPostgres ? 'PostgreSQL' : 'SQLite (Fallback)'}`);

let pool = null;
let sqlite = null;

if (isPostgres) {
    pool = new Pool();
} else {
    const dbPath = path.join(__dirname, '../stride.db');
    sqlite = new Database(dbPath);
}

/**
 * Universal Query Wrapper
 * Converts PostgreSQL-style parameterized queries ($1, $2...) to SQLite style (?)
 * when running in SQLite mode.
 */
async function query(text, params = []) {
    if (isPostgres) {
        return await pool.query(text, params);
    } else {
        // SQLite: Convert $1, $2... to values by index
        let sqliteQuery = text;
        const sortedParams = [];
        
        // Find all $n placeholders
        const placeholders = Array.from(text.matchAll(/\$(\d+)/g));
        if (placeholders.length > 0) {
            // We need to replace them one by one to handle duplicates and order
            // However, better-sqlite3 uses ? or @name.
            // Let's replace each $n with a ? and build a new params array in that order.
            sqliteQuery = text.replace(/\$(\d+)/g, (match, p1) => {
                const index = parseInt(p1) - 1;
                sortedParams.push(params[index]);
                return '?';
            });
        } else {
            sortedParams.push(...params);
        }

        const stmt = sqlite.prepare(sqliteQuery);
        
        if (text.trim().toUpperCase().startsWith('SELECT')) {
            const rows = stmt.all(...sortedParams);
            return { rows, rowCount: rows.length };
        } else {
            const info = stmt.run(...params);
            return { rows: [], rowCount: info.changes };
        }
    }
}

/**
 * Transaction Wrapper
 * Uses Manual BEGIN/COMMIT for SQLite to support async callbacks.
 */
async function transaction(callback) {
    if (isPostgres) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            const result = await callback(client);
            await client.query('COMMIT');
            return result;
        } catch (e) {
            await client.query('ROLLBACK');
            throw e;
        } finally {
            client.release();
        }
    } else {
        // Manual transaction for SQLite to support async
        sqlite.prepare('BEGIN').run();
        try {
            const mockClient = {
                query: (text, params = []) => {
                    const sqliteQuery = text.replace(/\$\d+/g, '?');
                    const stmt = sqlite.prepare(sqliteQuery);
                    if (text.trim().toUpperCase().startsWith('SELECT')) {
                        const rows = stmt.all(...params);
                        return { rows, rowCount: rows.length };
                    } else {
                        const info = stmt.run(...params);
                        return { rows: [], rowCount: info.changes };
                    }
                }
            };
            const result = await callback(mockClient);
            sqlite.prepare('COMMIT').run();
            return result;
        } catch (e) {
            sqlite.prepare('ROLLBACK').run();
            throw e;
        }
    }
}

export default {
    query,
    transaction,
    isPostgres
};
