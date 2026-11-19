import test from 'node:test';
import assert from 'node:assert/strict';
import { openLocalRegistry } from '../cloud-slayer/local-sqlite.mjs';
import { inventoryBatch } from '../cloud-slayer/inventory.mjs';
import { buildTestWorkers } from './build-workers.mjs';

const { main: app, slubber, sos } = await buildTestWorkers();

const registry = openLocalRegistry();
const recordedAt = '2026-11-19T13:00:00.000Z';
const ids = Array.from({ length: 1201 }, (_, index) => 'private-worker-' + index);
const snapshot = inventoryBatch([...ids, ids[0]], recordedAt);
registry.sqlite.exec('BEGIN');
for (const { sql, params = [] } of snapshot) registry.sqlite.prepare(sql).run(...params);
registry.sqlite.exec('COMMIT');
const services = {
  CLOUD_SLAYER_DB: registry,
  SLUBBER: { fetch: path => slubber.fetch(new Request(path)) },
  SOS: { fetch: path => sos.fetch(new Request(path)) }
};
const request = (path, init, env = services) => app.fetch(new Request('https://slayer.test' + path, init), env);

test('handles more than 500 records and returns counts without inventory names', async () => {
  const response = await request('/api/cloud-slayer/summary');
  assert.deepEqual(await response.json(), { cloudflare_workers: 1201, shared_modules: 4, total_records: 1205, inventory_as_of: recordedAt });
  const result = await request('/api/cloud-slayer/modules?q=private-worker');
  assert.deepEqual(await result.json(), { modules: [], next: null });
});

test('search filters by view and treats user input as literal search text', async () => {
  const result = await request('/api/cloud-slayer/modules?view=sos&q=slubber');
  const { modules } = await result.json();
  assert.equal(modules.length, 1);
  assert.equal(modules[0].module_id, 'slubber-policy');
  const invalid = await request('/api/cloud-slayer/modules?view=owner');
  assert.equal(invalid.status, 400);
  const literal = await request('/api/cloud-slayer/modules?q=%25');
  assert.equal((await literal.json()).modules.length, 0);
});

test('approved jobs return data and unknown or inactive module names fail closed', async () => {
  const result = await request('/api/cloud-slayer/worker?key=slubber-policy');
  assert.equal((await result.json()).role, 'guest');
  const response = await request('/api/cloud-slayer/worker?key=sos-response');
  assert.equal((await response.json()).scenario, 'manual-drill');
  assert.equal((await request('/api/cloud-slayer/worker?key=private-worker-10')).status, 404);
  assert.equal((await request('/api/cloud-slayer/modules', { method: 'POST' })).status, 405);
  assert.equal((await request('/api/cloud-slayer/modules', {}, {})).status, 503);
  registry.sqlite.exec("UPDATE cloud_slayer_modules SET active=0 WHERE module_id='sos-response'");
  assert.equal((await request('/api/cloud-slayer/worker?key=sos-response')).status, 404);
});

test('SOS and both compute views link to the worker registry', async () => {
  const consolePage = await request('/sos');
  assert.match(await consolePage.text(), /href="\/cloud-slayer\?view=sos"[^>]*>OO<\/a>/);
  for (const view of ['supercomputer', 'hypercomputer']) {
    const page = await request('/cloud-slayer/' + view);
    assert.equal(page.status, 200);
    assert.match(await page.text(), /Search worker modules/);
  }
});
