import assert from 'node:assert/strict';
import { test } from 'node:test';
import gate, { hasPreviewAccess } from './packages/shared/holding-gate.js';

const hostname = 'owned-project.example';
const build = 'a'.repeat(40);
const issuer = 'https://owned-team.cloudflareaccess.com';
const audience = 'b'.repeat(64);
const keyset = await crypto.subtle.generateKey({
  name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048,
  publicExponent: Uint8Array.from([1, 0, 1]), hash: 'SHA-256',
}, true, ['sign', 'verify']);
const jwk = { ...await crypto.subtle.exportKey('jwk', keyset.publicKey), kid: 'fixture' };
const encode = object => Buffer.from(JSON.stringify(object)).toString('base64url');

async function token(claims = {}) {
  const header = encode({ alg: 'RS256', kid: 'fixture' });
  const now = Math.floor(Date.now() / 1000);
  const body = encode({ iss: issuer, aud: [audience], exp: now + 60, ...claims });
  const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', keyset.privateKey, new TextEncoder().encode(header + '.' + body));
  return header + '.' + body + '.' + Buffer.from(signature).toString('base64url');
}

const request = (path = '/', init) => new Request('https://' + hostname + path, init);
const reader = async url => {
  assert.equal(url.origin, issuer);
  return Response.json({ keys: [jwk] });
};

function bindings(options = {}) {
  const reads = [];
  const row = { project_id: 'owned-project', zone_status: 'ACTIVE', access_audience: audience,
    launch_status: 'HOLDING', build_key: build, entry_key: 'index.html', ...options };
  const get = async key => { reads.push(key); return { size: 11, body: 'staged page' }; };
  return {
    reads, ACCESS_ISSUER: issuer,
    ZONES: { prepare: () => ({ bind: host => ({ first: async () => host === hostname ? row : null }) }) },
    HOLDING_CONFIG: { get: async () => '<private>' },
    STAGING: { get, head: get },
  };
}

test('only correctly signed, current Access tokens for the same audience are admitted', async () => {
  const has = async value => hasPreviewAccess(request('/', {
    headers: { 'Cf-Access-Jwt-Assertion': await value },
  }), issuer, audience, reader);
  const good = await token();
  assert.equal(await has(good), true);
  assert.equal(await has(token({ exp: 1 })), false);
  assert.equal(await has(token({ aud: ['c'.repeat(64)] })), false);
  assert.equal(await has(token({ iss: 'https://other.cloudflareaccess.com' })), false);
  assert.equal(await has(good.slice(0, good.lastIndexOf('.') + 1) + 'Zm9yZ2Vk'), false);
  assert.equal(await has('not-a-token'), false);
});

test('holding shows a generic escaped page and keeps private assets inaccessible', async () => {
  const env = bindings();
  const holding = await gate.fetch(request(), env);
  assert.equal(holding.status, 200);
  assert.match(await holding.text(), /&lt;private&gt;/);
  assert.equal(holding.headers.get('Cache-Control'), 'no-store');
  assert.equal((await gate.fetch(request('/source.md', {
    headers: { 'Cf-Access-Authenticated-User-Email': 'testing@example.invalid' },
  }), env)).status, 404);
  assert.deepEqual(env.reads, []);
  assert.equal((await gate.fetch(request('/', {method:'POST'}), env)).status, 405);
});

test('live reads are scoped to the exact hostname, project and immutable build', async () => {
  const env = bindings({ launch_status: 'LIVE' });
  const result = await gate.fetch(request(), env);
  assert.equal(await result.text(), 'staged page');
  assert.equal(result.headers.get('X-Robots-Tag'), null);
  assert.equal(env.reads[0], 'projects/owned-project/' + build + '/index.html');
  const head = await gate.fetch(request('/', {method:'HEAD'}), env);
  assert.equal(await head.text(), '');
  assert.equal(head.headers.get('Content-Length'), '11');
  assert.equal((await gate.fetch(request('/%2Fother.html'), env)).status, 404);
  assert.equal((await gate.fetch(new Request('https://other.example/'), env)).status, 404);
  assert.equal((await gate.fetch(request(), bindings({ zone_status: 'PENDING' }))).status, 404);
});

test('one hostname KV key can launch an active staged build, with fleet-wide holding taking precedence', async () => {
  const env = bindings();
  const switches = new Map([['ZONE_STATUS:' + hostname, 'LIVE']]);
  env.HOLDING_CONFIG.get = async key => switches.get(key);
  assert.equal(await (await gate.fetch(request(), env)).text(), 'staged page');
  switches.set('FLEET_STATUS', 'HOLDING');
  assert.match(await (await gate.fetch(request(), env)).text(), /Coming soon/);
  switches.delete('FLEET_STATUS');
  const unprepared = bindings({ build_key: null });
  unprepared.HOLDING_CONFIG = env.HOLDING_CONFIG;
  assert.match(await (await gate.fetch(request(), unprepared)).text(), /Coming soon/);
});
