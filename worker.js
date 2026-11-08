import pg from 'pg';
import { notificationWorker } from './notifications.js';

if (!process.env.DATABASE_URL) throw new Error('Set DATABASE_URL');
if (!process.env.NTFY_TOPIC) throw new Error('Set NTFY_TOPIC');

const db = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  max: 1,
  connectionTimeoutMillis: 10000,
});
const worker = notificationWorker(db, { intervalMs: 1 });
try {
  await worker.run();
} finally {
  await db.end();
}
