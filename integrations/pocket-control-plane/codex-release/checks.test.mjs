import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createPocket } from './pocket.mjs';
import { verifyGitHubReceipt, validClaims } from './github-identity.mjs';

const manifest = JSON.parse(await readFile(new URL('./manifest.json', import.meta.url), 'utf8'));
const apps = await Promise.all(manifest.map(async row => {
  const project = JSON.parse(await readFile(new URL('./projects/' + row.id + '/app.json', import.meta.url), 'utf8'));
  const { default: handler } = await import('./projects/' + row.id + '/worker.mjs');
  return { project, handler };
}));
const origin = 'https://nathan-ai-pocket-codex.nathantaboract.workers.dev';
const bindings = { PROJECTS: { get: name => apps.find(app => app.project.worker === name).handler } };
const pocket = createPocket(apps.map(app => app.project));
const get = (path, method = 'GET') => pocket.fetch(new Request(origin + path, { method }), bindings);

test('separate manifest rows, Worker names, and source states for all 83 stations', () => {
  assert.equal(apps.length, 83);
  assert.equal(new Set(apps.map(app => app.project.id)).size, 83);
  assert.equal(new Set(apps.map(app => app.project.worker)).size, 83);
  assert.equal(apps.filter(app => app.project.status === 'Original pending').length, 18);
  assert.equal(apps.filter(app => app.project.group === 'numbered').length, 11);
});

test('every project has an isolated catalog, guide, activity, and health route', async () => {
  for (const { project } of apps) {
    const base = '/work/' + project.id;
    const health = await (await get(base + '/healthz')).json();
    assert.equal(health.id, project.id);
    assert.equal(health.worker, project.worker);
    assert.equal((await (await get(base + '/catalog')).json()).title, project.title);
    assert.match(await (await get(base + '/books/reader.md')).text(), /^# /);
    assert.equal((await get(base + '/game')).status, 200);
  }
});

test('basic routing, written content, interaction, link safety, and source separation', async () => {
  assert.equal((await get('/work/missing/healthz')).status, 404);
  assert.equal((await get('/work/codex-06/healthz', 'POST')).status, 405);
  assert.equal((await get('/work/codex-06/healthz', 'HEAD')).status, 200);
  assert.match(await (await get('/work/codex-06/game?point0=0&point1=0&point2=0&point3=1')).text(), /111\.20 km/);
  assert.match(await (await get('/work/sovereign-kodex/game?position=4')).text(), /G♯ \/ A♭/);
  assert.match(await (await get('/work/mirror-shadow/game?word=MAGIC')).text(), /CIGAM/);
  assert.match(await (await get('/?q=%3Cscript%3E')).text(), /&lt;script&gt;/);
  assert.match(await (await get('/?tab=github')).text(), /GitHub Pro/);
  assert.equal((await get('/api/github/receipt', 'POST')).status, 503);
});

test('GitHub receipt requires an exact repository, workflow, branch, and valid signature', async () => {
  const time = 10000;
  const claims = {
    iss: 'https://token.actions.githubusercontent.com', aud: origin, repository_id: '1038249626', repository_owner_id: '226606102',
    sub: 'repo:NathanAIoxr/Nathan-AI-Sovereign-Core:ref:refs/heads/main', ref: 'refs/heads/main',
    workflow_ref: 'NathanAIoxr/Nathan-AI-Sovereign-Core/.github/workflows/codex-pocket-build.yml@refs/heads/main',
    event_name: 'workflow_dispatch', iat: time, nbf: time, exp: time + 300,
    run_id: '12800000', run_attempt: '1', sha: 'a'.repeat(40),
  };
  assert.equal(validClaims(claims, time), true);
  assert.equal(validClaims({ ...claims, sub: 'repo:NathanAIoxr@226606102/Nathan-AI-Sovereign-Core@1038249626:ref:refs/heads/main' }, time), true);
  assert.equal(validClaims({ ...claims, repository_owner_id: '2' }, time), false);
  assert.equal(validClaims({ ...claims, repository_id: '2' }, time), false);
  assert.equal(validClaims({ ...claims, workflow_ref: 'different' }, time), false);
  assert.equal(validClaims(claims, time + 300), false);
  const algo = { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]) };
  const pair = await crypto.subtle.generateKey(algo, true, ['sign', 'verify']);
  const jwk = await crypto.subtle.exportKey('jwk', pair.publicKey);
  const encoded = value => Buffer.from(JSON.stringify(value)).toString('base64url');
  const signed = encoded({ alg: 'RS256', kid: 'test' }) + '.' + encoded(claims);
  const sig = Buffer.from(await crypto.subtle.sign(algo, pair.privateKey, new TextEncoder().encode(signed))).toString('base64url');
  const fetchKeys = async () => Response.json({ keys: [{ ...jwk, kid: 'test' }] });
  const proof = await verifyGitHubReceipt('Bearer ' + signed + '.' + sig, fetchKeys, time);
  assert.equal(proof.run, claims.run_id);
  assert.equal(await verifyGitHubReceipt('Bearer ' + signed + '.AAAA', fetchKeys, time), null);
});
