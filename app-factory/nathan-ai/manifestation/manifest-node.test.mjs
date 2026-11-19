import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { test } from 'node:test';
import worker from './worker.mjs';
import { nodePath, receiptPath, runPath, sourceHash, sourcePath } from './manifest-node.mjs';

function database(t) {
  const sqlite = new DatabaseSync(':memory:');
  t.after(() => sqlite.close());
  sqlite.exec(readFileSync(new URL('./schema.sql', import.meta.url), 'utf8'));
  return {
    count: () => sqlite.prepare('SELECT count(*) AS count FROM manifest_node_receipts').get().count,
    prepare(sql) {
      const statement = sqlite.prepare(sql);
      return { bind: (...params) => ({
        first: async () => statement.get(...params),
        run: () => statement.run(...params)
      }) };
    },
    async batch(statements) {
      sqlite.exec('BEGIN');
      try {
        for (const statement of statements) statement.run();
        sqlite.exec('COMMIT');
      } catch (error) {
        sqlite.exec('ROLLBACK');
        throw error;
      }
    }
  };
}

const call = (path, env, options) => worker.fetch(new Request('https://example.test' + path, options), env);
const owner = { method: 'POST', headers: { Authorization: 'Bearer test-secret' } };

test('the existing edition and new entry point remain linked', async () => {
  assert.match(await (await call('/')).text(), /href="\/ai-nodes"/);
  assert.match(await (await call(nodePath)).text(), /Thought → Word → Action → Verification/);
  for (const route of ['/books', '/books/reader.md', '/game', '/api/app', '/healthz']) {
    assert.equal((await call(route)).status, 200, route);
  }
  const source = await call(sourcePath);
  assert.match(source.headers.get('Content-Disposition'), /manifestation-ai-nodes-source.txt/);
  assert.equal(await sourceHash(), 'babc8b4eb7d3501d721aa7dd7f765fa52290ff095da5d162bdb85718a6099f5a');
  assert.match(await source.text(), /2026-11-19T16:34:26.491086\+00:00/);
});

test('the public API can only read and the private action requires its secret', async t => {
  const db = database(t);
  const env = { MANIFEST_NODE_DB: db, MANIFEST_NODE_TOKEN: 'test-secret' };
  assert.equal((await call(receiptPath, env)).status, 404);
  assert.equal((await call(runPath, env)).status, 405);
  assert.equal((await call(receiptPath, env, owner)).status, 405);
  assert.equal((await call(runPath, env, { method: 'POST' })).status, 401);
  assert.equal((await call(runPath, env, {
    method: 'POST', headers: { Authorization: 'Bearer fake-secret' }
  })).status, 401);
  assert.equal((await call(runPath, env, { ...owner, body: '{}' })).status, 400);
  assert.equal(db.count(), 0);
});

test('executing and retrying gives one verifiable receipt in the database', async t => {
  const db = database(t);
  const env = { MANIFEST_NODE_DB: db, MANIFEST_NODE_TOKEN: 'test-secret' };
  const initial = await call(runPath, env, owner);
  assert.equal(initial.status, 200);
  const receipt = await initial.json();
  assert.equal(receipt.status, 'VERIFIED');
  assert.deepEqual(receipt.payload.parameters, ['1+1=2', '1-1=0', '100% truth']);
  assert.equal(receipt.payload.source_sha256, await sourceHash());
  assert.deepEqual(receipt.evidence.build, { before: 1, after: 2 });
  assert.deepEqual(receipt.evidence.clear, { before: 1, after: 0 });
  assert.deepEqual(await (await call(receiptPath, env)).json(), receipt);
  assert.deepEqual(await (await call(runPath, env, owner)).json(), receipt);
  assert.equal(db.count(), 1);
  const head = await call(receiptPath, env, { method: 'HEAD' });
  assert.equal(head.status, 200);
  assert.equal(await head.text(), '');
});

test('a database failure never becomes a success receipt', async () => {
  const env = { MANIFEST_NODE_DB: { prepare() { throw new Error('unavailable'); } } };
  assert.equal((await call(receiptPath, env)).status, 503);
});
