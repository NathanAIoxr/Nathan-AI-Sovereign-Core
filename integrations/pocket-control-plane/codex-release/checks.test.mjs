import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createPocket } from './pocket.mjs';
import { verifyGitHubReceipt, validClaims, publicSigningKeys } from './github-identity.mjs';

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
  assert.equal(publicSigningKeys([{ ...jwk, kid: 'test' }]).length, 1);
  assert.equal(publicSigningKeys([{ ...jwk, kid: 'test' }, { ...jwk, kid: 'test' }]), null);
  assert.equal(publicSigningKeys([{ ...jwk, kid: 'test', n: 'undersized' }]), null);
  const encoded = value => Buffer.from(JSON.stringify(value)).toString('base64url');
  const signed = encoded({ alg: 'RS256', kid: 'test' }) + '.' + encoded(claims);
  const sig = Buffer.from(await crypto.subtle.sign(algo, pair.privateKey, new TextEncoder().encode(signed))).toString('base64url');
  const fetchKeys = async () => Response.json({ keys: [{ ...jwk, kid: 'test' }] });
  const proof = await verifyGitHubReceipt('Bearer ' + signed + '.' + sig, fetchKeys, time);
  assert.equal(proof.run, claims.run_id);
  assert.equal(await verifyGitHubReceipt('Bearer ' + signed + '.AAAA', fetchKeys, time), null);
});

test('Pocket Control lists the standalone apps and only dispatches their refreshes on schedule', async () => {
  const attached = JSON.parse(await readFile(new URL('./standalone-apps.json', import.meta.url), 'utf8'));
  const queue = [];
  const runtime = createPocket([],attached);
  let receipt;
  const env = { PROJECTS: { get: name => ({fetch: async request => {
    const found = attached.find(app => app.worker === name);
    const path = new URL(request.url).pathname;
    queue.push([name,request.method,path]);
    if (request.method === 'POST') assert.equal(path,'/__hub/refresh');
    return Response.json({id:found.id,version:found.version,verified:true});
  }})}, RECEIPTS: {
    get: async () => null,
    put: async (key,value) => { receipt = JSON.parse(value); },
  }};
  const catalog = await runtime.fetch(new Request(origin + '/api/catalog'),env);
  assert.deepEqual((await catalog.json()).projects.map(app => app.id),['taborboy','taborpool']);
  assert.equal((await runtime.fetch(new Request(origin + '/work/taborboy/__hub/refresh',{method:'POST'}),env)).status,405);
  const launch = await runtime.fetch(new Request(origin + '/work/taborboy/'),env);
  assert.equal(launch.status,302);
  assert.equal(launch.headers.get('location'),'https://taborboy.pages.dev/app/');
  assert.equal(queue.length,0);
  const originalFetch = globalThis.fetch;
  let cron;
  globalThis.fetch = async () => new Response(JSON.stringify({workflow_runs:[]}));
  try {
    runtime.scheduled({},env,{waitUntil:work => {cron = work;}});
    await cron;
  } finally {
    globalThis.fetch = originalFetch;
  }
  assert.equal(queue.filter(job => job[1] === 'POST').length,2);
  assert.deepEqual(receipt.appJobs,[{id:'taborboy',verified:true},{id:'taborpool',verified:true}]);
});

test('public order is deterministic and the build rejects reordered originals and groups', async () => {
  const { validateCatalogOrder } = await import('./release-order.mjs');
  const order = await (await get('/api/order')).json();
  assert.doesNotThrow(() => validateCatalogOrder(manifest));
  assert.deepEqual(order.groups.map(group => group.id), ['numbered', 'kodex', 'codex', 'nodes', 'recovery', 'standalone-apps']);
  assert.deepEqual(order.groups.flatMap(group => group.projects), manifest.map(row => row.id));
  assert.deepEqual(order.crosshairs.sources, manifest.slice(0, 10).map(row => row.id));
  assert.equal(order.jobs.at(-1).cron, '11 * * * *');
  const release = await (await get('/release-order')).text();
  assert.ok(release.indexOf('/work/codex-00/') < release.indexOf('/work/codex-09/'));
  assert.ok(release.indexOf('/work/codex-09/') < release.indexOf('/work/sovereign-kodex/'));
  assert.throws(() => validateCatalogOrder([manifest[1], manifest[0], ...manifest.slice(2)]), /numbered Codex/);
  assert.throws(() => validateCatalogOrder([...manifest.slice(0, 11), ...manifest.slice(13), ...manifest.slice(11, 13)]), /release order/);
});

test('hourly Worker checks source stations, Crosshairs, then standalone apps', async () => {
  const { createViews, anchors } = await import('../codex-crosshairs/views.mjs');
  const standalone = { id: 'taborboy', worker: 'taborboy-worker', version: '1', group: 'standalone-apps' };
  const source = { id: 'codex-00', worker: 'tabor-recovered-codex-00', version: '1', group: 'numbered' };
  const entries = manifest.slice(0, 10);
  const requests = [];
  let result;
  const env = {
    PROJECTS: { get: name => ({ fetch: async request => {
      const path = new URL(request.url).pathname;
      requests.push([name, request.method, path]);
      if (name === 'tabor-codex-crosshairs') return Response.json({ anchors, entries, views: createViews(entries) });
      return Response.json({ ...(name === standalone.worker ? standalone : source), verified: true });
    } }) },
    RECEIPTS: {
      get: async () => null,
      put: async (_key, value) => { result = JSON.parse(value); },
    },
  };
  const original = globalThis.fetch;
  globalThis.fetch = async () => Response.json({ workflow_runs: [] });
  try {
    let completion;
    createPocket([source], [standalone]).scheduled({}, env, { waitUntil: run => { completion = run; } });
    await completion;
  } finally {
    globalThis.fetch = original;
  }
  assert.deepEqual(requests, [
    [source.worker, 'GET', '/healthz'],
    ['tabor-codex-crosshairs', 'GET', '/api/views'],
    [standalone.worker, 'POST', '/__hub/refresh'],
    [standalone.worker, 'GET', '/healthz'],
  ]);
  assert.deepEqual(result.crosshairs, { ready: true, views: 9 });
  assert.equal(result.healthy, 2);
});
