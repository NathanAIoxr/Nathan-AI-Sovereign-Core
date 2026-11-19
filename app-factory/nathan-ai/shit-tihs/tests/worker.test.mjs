import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import worker from '../.build/worker.mjs';

const ask = (path, method) => worker.fetch(new Request(`https://example.test${path}`, { method }));
const publicDir = new URL('../public/', import.meta.url);

test('the Worker serves every game asset byte for byte', async () => {
  for (const name of await readdir(publicDir)) {
    const response = ask(name === 'index.html' ? '/' : `/${name}`);
    assert.equal(response.status, 200);
    assert.ok(response.headers.get('Content-Type'));
    assert.deepEqual(Buffer.from(await response.arrayBuffer()), await readFile(new URL(name, publicDir)));
  }
  assert.equal(await ask('/', 'HEAD').text(), '');
  assert.equal(ask('/').headers.get('X-Content-Type-Options'), 'nosniff');
  assert.equal(ask('/missing').status, 404);
  assert.equal(ask('/__proto__').status, 404);
  assert.equal(ask('/', 'POST').status, 405);
});
