import assert from 'node:assert/strict';
import test from 'node:test';
import { openLocalRegistry } from '../cloud-slayer/local-sqlite.mjs';
import { cloudSlayerApi } from '../cloud-slayer/runtime.mjs';
import { catalogBatch, catalogBatchSize } from '../cloud-slayer/tool-library/catalog.mjs';
import { buildTestWorkers } from './build-workers.mjs';

const sourceRef = 'a'.repeat(40);
const item = number => ({
  key: 'fixture-' + number, title: 'Fixture worker ' + number,
  description: number === 100_000 ? 'Last ammonia calibration tool.' : 'Fixture for scale qualification.',
  kind: 'worker', tags: ['test'], source_path: 'tools/sample.mjs', source_ref: sourceRef
});

function importBatch(db, rows) {
  db.sqlite.exec('BEGIN');
  try {
    for (const { sql, params } of catalogBatch(rows)) db.sqlite.prepare(sql).run(...params);
    db.sqlite.exec('COMMIT');
  } catch (error) {
    db.sqlite.exec('ROLLBACK');
    throw error;
  }
}

test('loads, searches and paginates a 100,000-tool catalog and replays amended records', async t => {
  const db = openLocalRegistry();
  t.after(() => db.sqlite.close());
  for (let start = 1; start <= 100_000; start += catalogBatchSize) {
    importBatch(db, Array.from({ length: catalogBatchSize }, (_, offset) => item(start + offset)));
  }
  const request = path => cloudSlayerApi(new URL('https://test.invalid/api/cloud-slayer/tools' + path), db);

  const first = await (await request('?q=fixture')).json();
  assert.equal(first.registered_tools, 100_000);
  assert.equal(first.tools.length, 25);
  assert.equal(first.next, '25');
  const second = await (await request('?q=fixture&after=' + first.next)).json();
  assert.equal(second.tools[0].tool_key, 'fixture-26');
  assert(second.tools.every(tool => !first.tools.some(previous => previous.tool_key === tool.tool_key)));
  const found = await (await request('?q=ammonia+calib&after=99999')).json();
  assert.deepEqual(found.tools.map(tool => tool.tool_key), ['fixture-100000']);
  assert.equal(found.tools[0].source_url, 'https://github.com/NathanAIoxr/Nathan-AI-Sovereign-Core/blob/' + sourceRef + '/tools/sample.mjs');
  assert.equal(found.next, null);

  const replacement = { ...item(100_000), description: 'Temperature calibration.' };
  importBatch(db, [replacement, replacement]);
  assert.equal((await (await request('?q=ammonia')).json()).tools.length, 0);
  const amended = await (await request('?q=temperature')).json();
  assert.equal(amended.registered_tools, 100_000);
  assert.deepEqual(amended.tools.map(tool => tool.tool_key), ['fixture-100000']);
  assert.equal((await request('?after=-1')).status, 400);
  assert.equal((await request('?q=%22')).status, 400);
  assert.throws(() => catalogBatch([{ ...item(1), source_path: 'tools/../private' }]), /Invalid tool/);
});

test('Tool Library navigation and API are reachable through the app entry point', async t => {
  const { main } = await buildTestWorkers();
  const registry = openLocalRegistry();
  t.after(() => registry.sqlite.close());
  importBatch(registry, [item(1)]);
  const request = path => main.fetch(new Request('https://test.invalid' + path), { CLOUD_SLAYER_DB: registry });
  assert.match(await (await request('/sos')).text(), /href="\/cloud-slayer\/tools"/);
  assert.match(await (await request('/cloud-slayer/tools')).text(), /<h1>Tool Library\.<\/h1>/);
  const response = await request('/api/cloud-slayer/tools?q=fixture');
  assert.equal(response.status, 200);
  assert.equal((await response.json()).registered_tools, 1);
});
