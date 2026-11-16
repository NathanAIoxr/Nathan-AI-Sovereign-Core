import assert from 'node:assert/strict';
import test from 'node:test';
import worker from './worker.mjs';

const request = (path, method = 'GET') => worker.fetch(new Request('https://example.invalid' + path, { method }));

test('serves the deployment check homepage', async () => {
  const response = await request('/');
  assert.equal(response.status, 200);
  assert.match(response.headers.get('content-type'), /^text\/html/);
  assert.match(await response.text(), /Nathan AI · Deployment Check/);
});
test('serves JSON health and a bodyless HEAD response', async () => {
  const response = await request('/api/health');
  assert.deepEqual(await response.json(), { ok: true, service: 'nathan-ai-deployment-check' });
  const head = await request('/api/health', 'HEAD');
  assert.equal(head.status, 200);
  assert.equal(await head.text(), '');
});
test('returns 404 for missing routes and 405 for unsupported methods', async () => {
  assert.equal((await request('/unknown')).status, 404);
  const response = await request('/api/health', 'POST');
  assert.equal(response.status, 405);
  assert.equal(response.headers.get('allow'), 'GET, HEAD');
});
