import { randomUUID } from 'node:crypto';

const table = 'morrow_notification_outbox';
export function notificationWorker(db, { topic = process.env.NTFY_TOPIC, send = fetch, intervalMs = 30000, onDelivery = () => {} } = {}) {
  if (topic && !/^[A-Za-z0-9_-]{32,128}$/.test(topic)) throw new Error('Use a random ntfy topic of 32–128 safe characters');
  let active, timer, controller, stopped = false;
  async function drain() {
    if (!topic || stopped) return false;
    let sent = false;
    for (let count = 0; count < 10 && !stopped; count++) {
      const lease = randomUUID();
      const result = await db.query(`UPDATE ${table} SET attempts=attempts+1, lease_until=now()+interval '30 seconds', lease_token=$1
        WHERE id=(SELECT id FROM ${table} WHERE delivered_at IS NULL AND attempts<5
        AND next_attempt_at<=now() AND lease_until<=now() ORDER BY created_at,id
        FOR UPDATE SKIP LOCKED LIMIT 1) RETURNING id,site,attempts`, [lease]);
      const row = result.rows[0];
      if (!row) break;
      sent = true;
      controller = new AbortController();
      let status;
      try {
        const title = row.site === 'focus' ? 'Cardiologist' : row.site === 'takt' ? 'TAKT Dental' : 'Morrow Studio';
        const response = await send('https://ntfy.sh/', {
          method: 'POST', redirect: 'error',
          signal: AbortSignal.any([controller.signal, AbortSignal.timeout(10000)]),
          headers: {'Content-Type':'application/json','Idempotency-Key':row.id},
          body:JSON.stringify({topic,title,message:'New inquiry #'+row.id}),
        });
        await response.body?.cancel();
        if (!response.ok) throw new Error('delivery_failed');
        const saved = await db.query(`UPDATE ${table} SET delivered_at=now(),lease_until='-infinity',lease_token=NULL,last_error=NULL WHERE id=$1 AND lease_token=$2`,[row.id,lease]);
        status = saved.rowCount === 1 ? 'delivered' : 'lease_lost';
      } catch {
        const delay = Math.min(3600,30000*2**(row.attempts-1)/1000);
        await db.query(`UPDATE ${table} SET next_attempt_at=now()+($3::int*interval '1 second'),lease_until='-infinity',lease_token=NULL,last_error='delivery_failed' WHERE id=$1 AND lease_token=$2`,[row.id,lease,delay]);
        status = 'retry';
      } finally { controller = undefined; }
      onDelivery({id:row.id,status});
    }
    return sent;
  }
  function run() {
    if (active) return active;
    active = drain().finally(() => { active = undefined; });
    return active;
  }
  function tick() {
    run().catch(() => console.error(JSON.stringify({event:'notification_worker',status:'unavailable'})));
  }
  return {
    run,
    start() { if (!topic || timer || stopped) return; tick(); timer=setInterval(tick,intervalMs); timer.unref(); },
    async stop() { stopped=true; clearInterval(timer); controller?.abort(); await active; },
  };
}

export async function runNotificationBatch(db, options = {}) {
  const summary = {attempted:0,delivered:0,failed:0};
  const worker = notificationWorker(db, {...options, onDelivery: ({status}) => {
    summary.attempted++;
    if (status === 'delivered') summary.delivered++;
    else summary.failed++;
  }});
  await worker.run();
  return summary;
}
