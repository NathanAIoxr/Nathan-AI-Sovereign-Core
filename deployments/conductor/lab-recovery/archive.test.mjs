import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import test from 'node:test';
import { archive, recoveryRoute, runRecovery, withLabRecovery } from './archive.mjs';

const base = 'https://nathan-tabor-labs.example';
const request = (path, options) => new Request(base + path, options);
function environment() {
  const db = new DatabaseSync(':memory:');
  const schema = readFileSync(new URL('./schema.sql', import.meta.url), 'utf8');
  db.exec(schema);
  db.exec(schema);
  db.exec("UPDATE lab_recovery_jobs_v1 SET status='blocked' WHERE kind='launch'");
  return { db, LAB_ARCHIVE: { head: async () => null }, LAB_BUILDS: {
    prepare(sql) {
      const statement = db.prepare(sql);
      const query = (...params) => ({ all: () => ({ results: statement.all(...params) }), run: () => statement.run(...params) });
      return { ...query(), bind: query };
    },
  } };
}

test('archive status remains private and does not promote absent bytes', async () => {
  const env = environment();
  await runRecovery(env);
  const response = await recoveryRoute(request('/api/recovery'), env);
  const status = await response.json();
  assert.equal(status.jobs.length, 19);
  assert.equal(status.archive.verified, false);
  assert.equal(status.jobs.find(j => j.id === 'archive-integrity').attempts, 0);
  assert.ok(!JSON.stringify(status).includes(archive.key));
  assert.equal((await recoveryRoute(request('/api/recovery', { method: 'HEAD' }), env)).body, null);
});

test('write route is absent with the temporary secret removed', async () => {
  assert.equal((await recoveryRoute(request('/api/recovery/import', { method: 'POST' }), {})).status, 404);
  const env = { LAB_RECOVERY_IMPORT_TOKEN: 'a'.repeat(64) };
  assert.equal((await recoveryRoute(request('/api/recovery/import', { method: 'POST' }), env)).status, 401);
  const authenticated = request('/api/recovery/import', { method: 'POST', headers: { authorization: `Bearer ${env.LAB_RECOVERY_IMPORT_TOKEN}` } });
  assert.equal((await recoveryRoute(authenticated, env)).status, 400);
});

test('an archive with a wrong readback digest stays in retry state', async () => {
  const env = environment();
  env.LAB_ARCHIVE.head = async () => ({ size: archive.bytes });
  env.LAB_ARCHIVE.get = async () => ({ size: archive.bytes, arrayBuffer: async () => new ArrayBuffer(archive.bytes) });
  await runRecovery(env);
  const row = env.db.prepare("SELECT status,receipt,attempts,lease_owner FROM lab_recovery_jobs_v1 WHERE id='archive-integrity'").get();
  assert.equal(row.status, 'queued');
  assert.equal(row.attempts, 1);
  assert.equal(row.lease_owner, null);
  assert.equal(JSON.parse(row.receipt).error, 'readback_digest_mismatch');
});

test('the registered launch is verified and its lease is cleared', async t => {
  const env = environment();
  env.db.exec("UPDATE lab_recovery_jobs_v1 SET status='queued' WHERE id='mathematical-roots'");
  const fetchMock = t.mock.method(globalThis, 'fetch', async (_, options) => {
    assert.ok(options.signal instanceof AbortSignal);
    return new Response('<title>THE MIDDLE C · 100 Mathematical Roots</title>');
  });
  await runRecovery(env);
  await runRecovery(env);
  const row = env.db.prepare("SELECT status,receipt,lease_owner FROM lab_recovery_jobs_v1 WHERE id='mathematical-roots'").get();
  assert.equal(row.status, 'verified');
  assert.equal(JSON.parse(row.receipt).http, 200);
  assert.equal(row.lease_owner, null);
  assert.equal(fetchMock.mock.callCount(), 1);
});

test('original routes and scheduled handlers stay reachable', async () => {
  let ran = false;
  const wrapped = withLabRecovery({ fetch: () => new Response('baseline'), scheduled: async () => { ran = true; } });
  assert.equal(await (await wrapped.fetch(request('/play/labs'), {})).text(), 'baseline');
  await wrapped.scheduled({ scheduledTime: Date.now() }, {});
  assert.equal(ran, true);
});
