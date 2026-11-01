import express from 'express';
import pg from 'pg';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('./', import.meta.url));
if (!process.env.DATABASE_URL) throw new Error('Set DATABASE_URL before starting Morrow');
const db = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 3, connectionTimeoutMillis: 10000 });
await db.query(await readFile(new URL('./migrations/001_inquiries.sql', import.meta.url), 'utf8'));
const app = express();
app.disable('x-powered-by');
app.use('/assets', express.static(root + 'assets'));
const template = await readFile(new URL('./index.html', import.meta.url), 'utf8');
app.get(['/', '/index.html'], (req, res) => {
  const category = req.query.category || 'all';
  if (!['all','brand','product','web'].includes(category)) return res.sendStatus(400);
  res.type('html').send(template.replace(/class="(project(?: project-wide)?)" data-category="([^"]+)"/g,
    (match, classes, item) => category === 'all' || category === item ? match : `class="${classes} hidden" data-category="${item}"`)
    .replace('class="active" name="category"', 'name="category"')
    .replace(/data-filter="([^"]+)"/g, (_match, item) =>
      (category === item ? 'class="active" ' : '') + `aria-pressed="${category === item}" data-filter="${item}"`));
});
for (const file of ['styles.css', 'script.js']) {
  app.get('/' + file, (_req, res) => res.sendFile(file, { root }));
}
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

app.use('/api/inquiries', (req, res, next) => {
  res.vary('Origin');
  const origin = req.get('origin');
  if (origin === 'https://memorim.github.io') {
    res.set('Access-Control-Allow-Origin', origin);
    res.set('Access-Control-Allow-Methods', 'POST');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
  } else if (origin && origin !== process.env.RENDER_EXTERNAL_URL &&
    !(process.env.NODE_ENV !== 'production' && /^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/.test(origin))) {
    return res.sendStatus(403);
  }
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});
// ponytail: one free web instance shares this bounded write budget. Use a shared limiter before scaling.
let windowEnd = 0, requests = 0;
app.post('/api/inquiries', express.json({ limit: '12kb' }), async (req, res) => {
  if (!req.is('application/json')) return res.sendStatus(415);
  const { id, name, email, message } = req.body ?? {};
  if (![id, name, email, message].every(x => typeof x === 'string') ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id) ||
    name.trim().length < 2 || name.length > 80 || message.trim().length < 5 ||
    message.length > 1000 || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Проверьте имя, почту и описание проекта.' });
  }
  if (Date.now() >= windowEnd) { windowEnd = Date.now() + 60000; requests = 0; }
  if (++requests > 40) return res.status(429).json({ error: 'Повторите отправку через минуту.' });
  const result = await db.query(
    `INSERT INTO morrow_inquiries (id, name, email, message) VALUES ($1, $2, $3, $4)
     ON CONFLICT(id) DO UPDATE SET id=excluded.id
       WHERE (morrow_inquiries.name, morrow_inquiries.email, morrow_inquiries.message)
           = (excluded.name, excluded.email, excluded.message)
     RETURNING id`, [id, name.trim(), email, message.trim()]);
  if (!result.rowCount) return res.status(409).json({ error: 'Обновите форму и отправьте снова.' });
  res.status(201).json({ id });
});
app.use((error, _req, res, _next) => {
  const code = [400, 413].includes(error.status) ? error.status : 503;
  res.status(code).json({ error: code === 503 ? 'Сервер временно недоступен.' : 'Проверьте данные формы.' });
});
app.listen(Number(process.env.PORT || 4832), process.env.RENDER ? '0.0.0.0' : '127.0.0.1');
