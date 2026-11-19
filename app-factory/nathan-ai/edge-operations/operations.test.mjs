import assert from 'node:assert/strict';
import { test } from 'node:test';
import bridge from '../memory-bank/deploy/tabor-bridge.js';
import worker from './worker.mjs';
import { presign } from './presign.mjs';

test('bridge authenticates health without exposing its key or the fleet registry', async () => {
  const key = { get: async () => 'test fixture for shared secret' };
  const env = {
    EDGE_HEALTH_KEY: key,
    REGISTRY: { prepare: () => ({ first: async () => ({ ready: 1 }) }) },
    PRIVATE_R2: { head: async object => ({ object }) },
    FLEET: { fetch: async url => {
      assert.equal(url, 'https://fleet.internal/health');
      return Response.json({ ok: true, internal: 'must not propagate' });
    } }
  };
  const response = await bridge.fetch(new Request('https://bridge.test/edge-operations/api/health', {
    headers: { 'x-tabor-edge-health': 'injected value' }
  }), {
    EDGE_HEALTH_KEY: key,
    MEMORY_PLATFORM: { get: name => {
      assert.equal(name, 'tabor-edge-operations');
      return { fetch: request => worker.fetch(request, env) };
    } }
  });
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('Cache-Control'), 'no-store');
  assert.deepEqual(await response.json(), {
    ok: true, bindings: { d1Registry: true, privateR2: true, fleetService: true, secretsStore: true }
  });
  assert.equal((await worker.fetch(new Request('https://bridge.test/api/health'), env)).status, 403);
});

test('issued URLs sign the selected method and expire within the supported limit', async () => {
  const env = {
    CLOUDFLARE_ACCOUNT_ID: '0'.repeat(32),
    R2_ACCESS_KEY_ID: 'fixture-access-key',
    R2_SECRET_ACCESS_KEY: 'fixture-secret-key'
  };
  const args = { object: "operator/test pattern #1.png", seconds: 300 };
  const get = new URL(await presign({ ...args, method: 'GET' }, env));
  const put = new URL(await presign({ ...args, method: 'PUT', contentType: 'image/png' }, env));
  assert.equal(get.pathname, '/tabor-edge-operations/operator/test%20pattern%20%231.png');
  assert.equal(put.searchParams.get('X-Amz-Expires'), '300');
  assert.equal(put.searchParams.get('X-Amz-SignedHeaders'), 'content-type;host');
  assert.equal(get.searchParams.get('X-Amz-SignedHeaders'), 'host');
  assert.notEqual(get.searchParams.get('X-Amz-Signature'), put.searchParams.get('X-Amz-Signature'));
  await assert.rejects(presign({ ...args, method: 'PUT', object: '../secret' }, env));
  await assert.rejects(presign({ ...args, method: 'PUT', seconds: 901 }, env));
});

test('diagnostics read visitor metadata at the incoming edge and use no-store', async () => {
  const request = new Request('https://bridge.test/edge-operations/api/diagnostics', {
    headers: { 'CF-Connecting-IP': '192.0.2.1' }
  });
  request.cf = { colo: 'CLT', httpProtocol: 'HTTP/2', city: 'Charlotte' };
  const response = await bridge.fetch(request, {});
  const data = await response.json();
  assert.equal(data.colo, 'CLT');
  assert.equal(data.city, 'Charlotte');
  assert.equal(data.ip, undefined);
  assert.equal(response.headers.get('Cache-Control'), 'no-store');
});
