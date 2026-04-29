import pg from 'pg';

const { Pool } = pg;

// PostgreSQL-only. SQLite support removed — all deployments use PostgreSQL.
console.log('Database Engine: PostgreSQL');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL?.includes('supabase') 
        ? { rejectUnauthorized: false }  // Supabase requires SSL
        : false                          // Local PostgreSQL does not
});

/**
 * Query wrapper — standard PostgreSQL parameterised queries ($1, $2 ...)
 */
async function query(text, params = []) {
    return await pool.query(text, params);
}

/**
 * Transaction wrapper — acquires a client, runs callback, commits or rolls back.
 */
async function transaction(callback) {
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
}

export default {
    query,
    transaction,
    isPostgres: true   // always true — kept for compatibility with route files that reference it
};
