import { readFile } from 'node:fs/promises';
import { DatabaseSync } from 'node:sqlite';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import worker from '../worker.js';

const migration = await readFile(new URL('../migrations/0001_memory_bank.sql', import.meta.url), 'utf8');

function setup(t) {
  const sqlite = new DatabaseSync(':memory:');
  t.after(() => sqlite.close());
  sqlite.exec(migration);
  const env = {
    API_KEY: 'write-test',
    READ_API_KEY: 'read-test',
    DB: {
      prepare(sql) {
        return {
          bind(...args) {
            const execute = () => ({ results: sqlite.prepare(sql).all(...args) });
            return { all: async () => execute(), execute };
          }
        };
      },
      async batch(statements) {
        sqlite.exec('BEGIN');
        try {
          const results = statements.map((statement) => statement.execute());
          sqlite.exec('COMMIT');
          return results;
        } catch (error) {
          sqlite.exec('ROLLBACK');
          throw error;
        }
      }
    },
    ASSETS: { fetch: async () => new Response('Memory Bank') }
  };
  return async function request(path, { key = 'write-test', method = 'GET', data, contentType = 'application/json' } = {}) {
    const headers = new Headers();
    if (key) headers.set('Authorization', 'Bearer ' + key);
    if (data !== undefined) headers.set('Content-Type', contentType);
    const body = data === undefined ? undefined : typeof data === 'string' ? data : JSON.stringify(data);
    return worker.fetch(new Request('https://test.invalid' + path, { method, headers, body }), env);
  };
}

test('memory API fails closed and read key cannot write', async (t) => {
  const request = setup(t);
  assert.equal((await request('/recall', { key: '' })).status, 401);
  assert.equal((await request('/recall', { key: 'wrong' })).status, 401);
  assert.equal((await request('/recall', { key: 'read-test' })).status, 200);
  assert.equal((await request('/remember', { key: 'read-test', method: 'POST', data: {} })).status, 401);
  assert.equal((await request('/import', { key: 'read-test', method: 'POST', data: {} })).status, 401);
  assert.equal((await request('/unknown')).status, 404);
  const unsupported = await request('/recall', { method: 'PUT' });
  assert.equal(unsupported.status, 405);
  assert.equal(unsupported.headers.get('Allow'), 'GET, POST');
  assert.match((await request('/')).headers.get('Content-Security-Policy'), /frame-ancestors 'none'/);
});

test('recalls dictation-style queries and preserves verbatim content on retry', async (t) => {
  const request = setup(t);
  const data = { title: 'Finger-Physics Games', category: 'Games', content: '  A note with 🧵 and 100% accuracy.\nSecond line.  ', source_ai: 'Claude' };
  const saved = await request('/remember', { method: 'POST', data });
  assert.equal(saved.status, 201);
  const original = await saved.json();
  const retried = await request('/remember', { method: 'POST', data });
  assert.equal(retried.status, 200);
  assert.equal((await retried.json()).id, original.id);
  const search = await request('/recall?q=Pull+up+my+finger-physics+games&category=games', { key: 'read-test' });
  assert.equal(search.headers.get('Cache-Control'), 'no-store');
  const results = await search.json();
  assert.equal(results.count, 1);
  assert.equal(results.memories[0].content, data.content);
  assert.equal(results.memories[0].source_ai, 'Claude');
  assert.equal((await (await request('/recall?q=%25')).json()).count, 1);
  assert.equal((await (await request('/recall?q=%27+OR+1%3D1')).json()).count, 0);
});

test('bulk import validates the whole batch, dedupes and paginates', async (t) => {
  const request = setup(t);
  const first = { title: 'One', content: 'first' };
  const second = { title: 'Two', content: 'second' };
  assert.equal((await request('/import', { method: 'POST', data: { entries: [first, {}] } })).status, 400);
  assert.equal((await (await request('/recall')).json()).count, 0);
  const imported = await request('/import', { method: 'POST', data: { entries: [first, second, first] } });
  assert.deepEqual(await imported.json(), { status: 'imported', received: 3, saved: 2, duplicates: 1, ids: [1, 2] });
  const retry = await request('/import', { method: 'POST', data: { entries: [first, second] } });
  assert.deepEqual(await retry.json(), { status: 'imported', received: 2, saved: 0, duplicates: 2, ids: [] });
  const page = await (await request('/recall?limit=1')).json();
  assert.equal(page.memories[0].title, second.title);
  assert.equal(page.next_before_id, 2);
  const next = await (await request('/recall?limit=1&before_id=2')).json();
  assert.equal(next.memories[0].title, first.title);
  assert.equal(next.next_before_id, null);
});

test('rejects invalid request body, field types, limits and search size', async (t) => {
  const request = setup(t);
  assert.equal((await request('/remember', { method: 'POST', data: 'broken' })).status, 400);
  assert.equal((await request('/remember', { method: 'POST', data: {}, contentType: 'text/plain' })).status, 415);
  assert.equal((await request('/remember', { method: 'POST', data: { title: 'Too long', content: 'A'.repeat(530000) } })).status, 413);
  assert.equal((await request('/remember', { method: 'POST', data: { title: 'Test', content: 42 } })).status, 400);
  assert.equal((await request('/remember', { method: 'POST', data: { title: 'Test', content: '\ud800' } })).status, 400);
  for (const query of ['limit=-1', 'limit=51', 'limit=1x', 'before_id=0', 'q=' + 'x'.repeat(301)]) {
    assert.equal((await request('/recall?' + query)).status, 400);
  }
});

test('JSON recall keeps search out of the URL and uses the same read boundary', async (t) => {
  const request = setup(t);
  await request('/remember', { method: 'POST', data: { title: 'One', content: 'private note' } });
  await request('/remember', { method: 'POST', data: { title: 'Two', content: 'private note' } });
  const search = { method: 'POST', key: 'read-test', data: { q: 'private', limit: 1 } };
  const reply = await request('/recall', search);
  assert.equal(reply.status, 200);
  assert.equal(reply.headers.get('Referrer-Policy'), 'no-referrer');
  assert.equal(reply.headers.get('Cache-Control'), 'no-store');
  const first = await reply.json();
  assert.equal(first.memories[0].title, 'Two');
  const next = await request('/recall', { ...search, data: { ...search.data, before_id: first.next_before_id } });
  assert.equal((await next.json()).memories[0].title, 'One');
  assert.equal((await request('/recall', { ...search, key: 'wrong' })).status, 401);
  assert.equal((await request('/recall?category=games', search)).status, 400);
  assert.equal((await request('/recall?limit=1&limit=2')).status, 400);
  for (const data of [{ q: 5 }, { limit: '1' }, { before_id: null }, { unknown: true }, []]) {
    assert.equal((await request('/recall', { ...search, data })).status, 400);
  }
  assert.equal((await request('/recall', { ...search, data: { q: 'x'.repeat(5000) } })).status, 413);
});
