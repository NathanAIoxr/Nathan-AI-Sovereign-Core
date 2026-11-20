import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import worker, { MasterConductor, timeEvent } from './src/conductor.mjs';
const sql = new DatabaseSync(':memory:');
for (const file of ['0001_tweezer_tap_zone_ledger.sql','0002_delivery.sql']) {
  sql.exec(readFileSync(new URL('./migrations/'+file,import.meta.url),'utf8'));
}
const db = {
  prepare(query) {
    function prepare(args) {
      return {
        bind: (...values) => prepare(values),
        first: async () => sql.prepare(query).get(...args) ?? null,
        run: async () => sql.prepare(query).run(...args),
        all: async () => ({ results: sql.prepare(query).all(...args) })
      };
    }
    return prepare([]);
  },
  async batch(statements) {
    sql.exec('BEGIN');
    try { for (const statement of statements) await statement.run(); sql.exec('COMMIT'); }
    catch (error) { sql.exec('ROLLBACK'); throw error; }
  }
};
const state = new Map();
const delivered = [];
const snapshots = new Map();
let alarm = null;
let failPublish = false;
const env = {
  BUILD: { id: 'test-revision' }, ZONE_DB: db, ZONE_CONTROL_KEY: 'local-test-key',
  ASSETS: { fetch: () => new Response('TAP THAT') },
  ZONE_R2: { put: async (key, data) => { snapshots.set(key,JSON.parse(data)); } },
  EMIT_BUS: { send: async event => { if (failPublish) throw Error('Queue unavailable'); delivered.push(event); } }
};
const controller = new MasterConductor({storage:{
  get: async key => state.get(key), put: async (key,value) => state.set(key,value),
  getAlarm: async () => alarm, setAlarm: async value => { alarm = value; }
}},env);
env.CONDUCTOR = { idFromName: name => name, get: () => ({
  fetch: (request, init) => controller.fetch(new Request(request,init))
}) };
const call = (path, body, key = 'local-test-key') => worker.fetch(new Request('https://test.invalid'+path,{
  method: body === undefined ? 'GET' : 'POST', headers: { Authorization: 'Bearer '+key },
  body: body === undefined ? undefined : JSON.stringify(body)
}),env);
assert.equal((await call('/')).status,200);
assert.equal((await call('/status',undefined,'wrong')).status,401);
assert.equal((await call('/internal/cron',{})).status,404);
assert.equal((await call('/switch/launch',{})).status,404);
assert.equal((await call('/tap',{ id:'bad',deck:'nostril_toy',trigger:'UNKNOWN' })).status,400);
const tap = { id:'retry',deck:'nostril_toy',trigger:'RESET_SIM' };
assert.equal((await call('/tap',tap)).status,202);
assert.equal((await call('/tap',tap)).status,202);
assert.equal((await call('/tap',{...tap,trigger:'HOLD_HEAD'})).status,409);
failPublish = true;
await assert.rejects(worker.scheduled({scheduledTime:10_001},env), /Queue unavailable/);
assert.equal((await (await call('/status')).json()).pending,2);
assert.ok(alarm);
failPublish = false;
await worker.scheduled({scheduledTime:10_001},env);
await worker.scheduled({scheduledTime:10_001},env);
assert.equal(delivered.length,2);
assert.equal(timeEvent(19_999).id,'time:1');
const messages = [...delivered,...delivered].map(body => ({body, ack(){ this.done=true; }}));
await worker.queue({messages},env);
assert.ok(messages.every(message => message.done));
assert.equal(sql.prepare('SELECT count(*) AS n FROM received_events').get().n,2);
assert.equal((await (await call('/audit',{})).json()).integrity,'PASS');
assert.deepEqual([...snapshots.values()].map(x=>x.name),['schema','smoke','manifest','manifest','smoke','schema']);
sql.prepare("DELETE FROM tap_tiles WHERE tile_position=1").run();
assert.equal((await (await call('/audit',{})).json()).integrity,'FAIL');
await call('/brake',{});
assert.equal((await call('/tap',tap)).status,423);
await call('/resume',{});
assert.equal((await call('/tap',tap)).status,202);
assert.equal((await call('/clock',{},'wrong')).status,401);
env.DELIVERY_MODE = 'd1';
failPublish = true;
const fallback = { id:'d1-fallback',deck:'shoulder_bb',trigger:'RESET_SIM' };
assert.equal((await call('/tap',fallback)).status,202);
await worker.scheduled({scheduledTime:50_000},env);
await worker.scheduled({scheduledTime:50_000},env);
assert.equal(sql.prepare("SELECT count(*) AS n FROM received_events WHERE event_id IN ('tap:d1-fallback','time:5')").get().n,2);
assert.equal((await (await call('/status')).json()).pending,0);
assert.equal(delivered.length,2);
await call('/brake',{});
assert.equal((await call('/clock',{})).status,423);
await call('/resume',{});
assert.equal((await call('/clock',{})).status,200);
console.log('Conductor, Queue and D1 delivery, staged audit, and authorization tests passed.');
