import test from 'node:test';
import assert from 'node:assert/strict';
import {notificationWorker,runNotificationBatch} from '../notifications.js';

for (const [httpStatus, rowsUpdated, delivered] of [[200,1,true],[503,1,false],[302,1,false],[200,0,false]]) {
  test(`batch reports durable outcome for HTTP ${httpStatus}, lease rows ${rowsUpdated}`, async () => {
    let claimed = false;
    const queries = [];
    const db = {async query(sql) {
      queries.push(sql);
      if (sql.includes('RETURNING id,site,attempts')) {
        if (claimed) return {rows:[]};
        claimed = true;
        return {rows:[{id:'fixture-event',site:'morrow',attempts:1}]};
      }
      return {rowCount:rowsUpdated};
    }};
    const result = await runNotificationBatch(db, {topic:'a'.repeat(48),send:async () => new Response(null,{status:httpStatus})});
    assert.deepEqual(result,{attempted:1,delivered:Number(delivered),failed:Number(!delivered)});
    if (httpStatus !== 200) {
      assert.ok(queries.some(sql => sql.includes("last_error='delivery_failed'")));
      assert.ok(!queries.some(sql => sql.includes('SET delivered_at=now()')));
    }
  });
}

test('database outage rejects a batch instead of reporting successful delivery', async () => {
  await assert.rejects(() => runNotificationBatch({query:async () => {throw new Error('unavailable')}},{topic:'a'.repeat(48)}));
});

for (const [response, failure] of [[429, 'http_429'], [503, 'http_503'], [null, 'transport_error']]) {
  test(`delivery diagnostic is safe and specific: ${failure}`, async () => {
    let claimed = false;
    const events = [];
    const db = {async query(sql) {
      if (sql.includes('RETURNING id,site,attempts')) {
        if (claimed) return {rows:[]};
        claimed = true;
        return {rows:[{id:'fixture-event',site:'morrow',attempts:1}]};
      }
      return {rowCount:1};
    }};
    await notificationWorker(db, {topic:'a'.repeat(48), onDelivery:event => events.push(event), send:async () => {
      if (response === null) throw new Error('sensitive URL or credential');
      return new Response(null, {status:response});
    }}).run();
    assert.deepEqual(events, [{id:'fixture-event',status:'retry',failure}]);
  });
}
