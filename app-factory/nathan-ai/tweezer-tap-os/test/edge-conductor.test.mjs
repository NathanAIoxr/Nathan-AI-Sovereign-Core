import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import worker, { MasterConductor, timeEvent } from '../src/edge-conductor.mjs';
const sql = new DatabaseSync(':memory:');
for (const file of ['0001_tweezer_tap_zone_ledger.sql','0002_delivery.sql','0004_neila.sql']) {
  sql.exec(readFileSync(new URL('../migrations/'+file,import.meta.url),'utf8'));
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
  ZONE_R2: { put: async (key, data) => {
    if (snapshots.has(key)) return null;
    snapshots.set(key,data);
    return {};
  }, get: async key => snapshots.has(key) ? { text: async () => snapshots.get(key) } : null },
  EMIT_BUS: { send: async event => { if (failPublish) throw Error('Queue unavailable'); delivered.push(event); } }
};
const controller = new MasterConductor({storage:{
  get: async key => state.get(key), put: async (key,value) => state.set(key,value),
  delete: async key => state.delete(key),
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
assert.equal((await call('/switch/launch',{})).status,403);
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
const messages = [...delivered,...delivered].map(body => ({body, ack(){ this.done=true; }, retry(){ this.retrying=true; }}));
await worker.queue({messages},env);
assert.ok(messages.every(message => message.done));
assert.equal(sql.prepare('SELECT count(*) AS n FROM received_events').get().n,2);
assert.equal((await (await call('/audit',{})).json()).integrity,'PASS');
const checks = [...snapshots.entries()].filter(([key]) => key.startsWith('neila/audit/')).map(([, value]) => JSON.parse(value));
assert.deepEqual(checks.map(x=>x.name),['schema','smoke','manifest','manifest','smoke','schema']);
assert.equal(checks[3].previous, checks[2].hash);
const seals = sql.prepare('SELECT * FROM event_seals ORDER BY sequence').all();
assert.equal(seals.length,3);
assert.equal(seals[1].previous_hash,seals[0].merkle_root);
const bad = { ...messages[0], done:false, body: { ...messages[0].body, merkle_root:'invalid' } };
await worker.queue({messages:[bad]},env);
assert.equal(bad.retrying,true);
assert.equal(bad.done,false);
env.D1_TIME_TRAVEL_TOKEN = 'test-only';
env.CF_ACCOUNT_ID = 'test-account';
env.ZONE_DATABASE_ID = 'test-db';
const kv = new Map();
env.ZONE_KV = { put: async (key,value) => kv.set(key,value) };
const remoteCalls = [];
const realFetch = globalThis.fetch;
globalThis.fetch = async (url,init) => {
  remoteCalls.push([new URL(url).pathname.split('/').at(-1),init.body]);
  return Response.json({ success:true,result:{ bookmark:'time-travel-bookmark' } });
};
try {
  await state.set('lastHeartbeat', Date.now());
  assert.equal((await controller.launch('first')).status,202);
  assert.equal((await controller.launch('first')).status,409);
  assert.equal((await controller.launch('second')).status,200);
  assert.equal(JSON.parse(kv.get('last-pre-launch')).bookmark,'time-travel-bookmark');
  await controller.heartbeat(Date.now() + 21_000);
  assert.equal((await state.get('activeRelease')).phase,'ROLLED_BACK');
  assert.deepEqual(remoteCalls,[['bookmark',undefined],['restore','{"bookmark":"time-travel-bookmark"}']]);
  await call('/resume',{});
} finally {
  globalThis.fetch = realFetch;
}
sql.prepare("DELETE FROM tap_tiles WHERE tile_position=1").run();
assert.equal((await (await call('/audit',{})).json()).integrity,'FAIL');
await call('/brake',{});
assert.equal((await call('/tap',tap)).status,423);
await call('/resume',{});
assert.equal((await call('/tap',tap)).status,202);
env.RELAY_KEY = 'test-relay';
const internal = key => worker.fetch(new Request('https://tweezer-tap-os.internal/internal/queue', {
  method:'POST', headers:{ 'X-Conductor-Relay':key }, body:JSON.stringify({
    queue:'zone-tweezer-events-q', messages:[{ body:{ zone:'zone/tweezer-tap-os', kind:'TIME_BOOTSTRAP' } }]
  })
}),env);
assert.equal((await internal('invalid')).status,404);
assert.deepEqual(await (await internal('test-relay')).json(),{ack:[0]});
console.log('Conductor, queue, staged audit, and authorization tests passed.');
