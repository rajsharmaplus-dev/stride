/**
 * Creates a notification row inside an existing DB transaction.
 * Must be called with the transaction client so the notification
 * is atomic with the project change that triggered it.
 */
export async function createNotification(client, userId, projectId, type, message) {
    await client.query(
        'INSERT INTO notifications (user_id, project_id, type, message, is_read, created_at) VALUES ($1, $2, $3, $4, 0, $5)',
        [userId, projectId, type, message, new Date().toISOString()]
    );
}
