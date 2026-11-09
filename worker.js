import pg from 'pg';
import { runNotificationBatch } from './notifications.js';

if (!process.env.DATABASE_URL) throw new Error('Set DATABASE_URL');
if (!process.env.NTFY_TOPIC) throw new Error('Set NTFY_TOPIC');

const db = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  max: 1,
  connectionTimeoutMillis: 10000,
});
try {
  const summary = await runNotificationBatch(db);
  console.log(JSON.stringify({event:'notification_batch',...summary}));
  if (summary.failed) process.exitCode = 1;
} finally {
  await db.end();
}
