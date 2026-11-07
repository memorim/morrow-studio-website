import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import pg from 'pg';
import {notificationWorker} from '../notifications.js';

test('invalid push channels fail before any network or database work', () => {
  for (const topic of ['short','https://example.com/','a'.repeat(129)]) assert.throws(() => notificationWorker({}, {topic}));
});

test('PostgreSQL queue is atomic, claimed once, private and bounded across restarts', {skip:!process.env.DATABASE_URL}, async () => {
  const schema='notify_'+randomUUID().replaceAll('-','');
  const admin=new pg.Pool({connectionString:process.env.DATABASE_URL,max:1});
  const db=new pg.Pool({connectionString:process.env.DATABASE_URL,options:'-c search_path='+schema,max:3});
  const topic='a'.repeat(48);
  const workers=[];
  let release=()=>{};
  try {
    await admin.query('CREATE SCHEMA '+schema);
    await db.query(await readFile(new URL('../migrations/001_inquiries.sql',import.meta.url),'utf8'));
    const id=randomUUID();
    const insert=identifier => db.query("INSERT INTO morrow_inquiries(id,name,email,message) VALUES($1,'Private name','private@example.test','Private inquiry details')",[identifier]);
    await db.query(`CREATE FUNCTION reject_alert() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'test failure'; END; $$;
      CREATE TRIGGER reject_alert BEFORE INSERT ON morrow_notification_outbox FOR EACH ROW EXECUTE FUNCTION reject_alert()`);
    await assert.rejects(() => insert(id));
    assert.equal(Number((await db.query('SELECT count(*) n FROM morrow_inquiries')).rows[0].n),0);
    await db.query('DROP TRIGGER reject_alert ON morrow_notification_outbox');
    await insert(id);
    let begin;
    const started=new Promise(resolve=>{begin=resolve});
    let calls=0;
    const first=notificationWorker(db,{topic,send:async(url,options)=>{
      calls++;
      assert.equal(url,'https://ntfy.sh/');
      assert.equal(options.redirect,'error');
      assert.equal(options.headers['Idempotency-Key'],id);
      assert.ok(!options.body.includes('Private'));
      assert.ok(!options.body.includes('private@example.test'));
      begin();
      await new Promise(resolve=>{release=resolve});
      return new Response(null,{status:200});
    }});
    const second=notificationWorker(db,{topic,send:()=>{throw new Error('claimed twice')}});
    workers.push(first,second);
    const active=first.run();
    await started;
    assert.equal(await second.run(),false);
    release();await active;
    assert.equal(calls,1);
    assert.ok((await db.query('SELECT delivered_at FROM morrow_notification_outbox WHERE id=$1',[id])).rows[0].delivered_at);
    const failedId=randomUUID();await insert(failedId);
    const failing=notificationWorker(db,{topic,send:async()=>new Response(null,{status:503})});workers.push(failing);
    for(let attempt=1;attempt<=5;attempt++){
      await db.query("UPDATE morrow_notification_outbox SET next_attempt_at=now()-interval '1 second' WHERE id=$1",[failedId]);
      await failing.run();
    }
    const final=(await db.query('SELECT * FROM morrow_notification_outbox WHERE id=$1',[failedId])).rows[0];
    assert.equal(final.attempts,5);assert.equal(final.delivered_at,null);assert.equal(final.last_error,'delivery_failed');
    assert.equal(await second.run(),false);
  } finally {
    release();
    for(const worker of workers)await worker.stop();
    await db.end();
    await admin.query('DROP SCHEMA IF EXISTS '+schema+' CASCADE');
    await admin.end();
  }
});
