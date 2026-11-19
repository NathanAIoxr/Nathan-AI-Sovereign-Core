import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { DatabaseSync } from 'node:sqlite';
import { test } from 'node:test';
import worker from '../worker.js';
import { inventoryRow, snapshotSql } from '../scripts/snapshot.js';

const migration = await readFile(new URL('../migrations/0001_owned_runtime_registry.sql', import.meta.url), 'utf8');

function setup(t) {
  const sqlite = new DatabaseSync(':memory:');
  sqlite.exec(migration);
  t.after(() => sqlite.close());
  const db = {
    prepare(sql) {
      const statement = sqlite.prepare(sql);
      function bind(...args) {
        return { all: async () => ({ results: statement.all(...args) }), run: async () => statement.run(...args) };
      }
      return { ...bind(), bind };
    },
    batch: queries => Promise.all(queries.map(q => q.all()))
  };
  function call(path, key, body) {
    const headers = {};
    if (key) headers.Authorization = 'Bearer ' + key;
    if (body) headers['Content-Type'] = 'application/json';
    return worker.fetch(new Request('https://registry.test' + path, {
      method: body ? 'POST' : 'GET', headers, body: body ? JSON.stringify(body) : undefined
    }), { DB: db, REGISTRY_KEY: 'registry-test' });
  }
  return { call, sqlite };
}

test('owner can register and update separate worker, bot and agent rows', async t => {
  const { call } = setup(t);
  assert.equal((await call('/records')).status, 401);
  for (const [kind, title] of [['worker', 'Own Worker'], ['bot', 'Own Bot'], ['agent', 'Own Agent']]) {
    const r = await call('/records', 'registry-test', { kind, slug: 'example', title, state: 'observed' });
    assert.equal(r.status, 200);
    assert.equal((await r.json()).state, 'declared');
  }
  await call('/records', 'registry-test', { kind: 'agent', slug: 'example', title: 'Revised Agent' });
  const response = await (await call('/records?kind=agent&q=revised', 'registry-test')).json();
  assert.equal(response.records[0].title, 'Revised Agent');
  assert.equal(response.totals.reduce((sum, row) => sum + row.total, 0), 3);
  assert.equal((await call('/records?after=bad%20cursor', 'registry-test')).status, 400);
});

test('snapshot uses stable keys and marks removals while preserving owner entries', async t => {
  const { call, sqlite } = setup(t);
  await call('/records', 'registry-test', { kind: 'bot', slug: 'example', title: 'Owner bot' });
  const sync = sqlite.prepare(snapshotSql);
  const first = Array.from({ length: 51 }, (_, index) => inventoryRow({ id: 'same-' + index }, 'my-namespace'));
  first.push(inventoryRow({ id: 'same-0' }, 'account'));
  sync.run(JSON.stringify(first), '2026-11-19T12:00:00.000Z');
  const page = await (await call('/records?kind=worker', 'registry-test')).json();
  assert.equal(page.records.length, 50);
  const later = await (await call('/records?kind=worker&after=' + page.next, 'registry-test')).json();
  assert.equal(later.records.length, 2);
  sync.run(JSON.stringify(first.slice(-1)), '2026-11-19T12:01:00.000Z');
  sync.run(JSON.stringify(first), '2026-11-19T12:00:00.000Z');
  const totals = sqlite.prepare('SELECT kind,state,total FROM owned_runtime_counts WHERE total > 0 ORDER BY kind,state').all();
  assert.deepEqual(totals.map(x => [x.kind, x.state, x.total]), [
    ['bot', 'declared', 1], ['worker', 'missing', 51], ['worker', 'observed', 1]
  ]);
});
