import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { test } from 'node:test';
import { inventory, select } from './select.mjs';

const id = 'nathan-ai-bounties-db';
const src = 'app-factory/nathan-ai/global-bounties/app.json';

test('requires explicit profile and rejects unregistered apps', () => {
  assert.throws(() => select(id), /explicit profile/);
  assert.throws(() => select('unknown', 'sandbox'), /No unique sandbox deployment/);
  assert.notEqual(select(id, 'sandbox').namespace, select(id, 'live').namespace);
  assert.deepEqual(select(id, 'sandbox').bindings, []);
});

test('counts repository applications and configurations without claiming missing deployments', () => {
  const list = inventory([src, 'apps/other/app.json', 'apps/other/wrangler.toml', 'README.md']);
  assert.deepEqual(list.counts, {
    applications: 2, wranglerConfigurations: 1, sandboxConfigured: 1, liveConfigured: 1
  });
  assert.deepEqual(list.applications.find(row => row.path === 'apps/other/app.json').profiles, {
    sandbox: 'unregistered', live: 'unregistered'
  });
  assert.equal(list.wranglerConfigurations[0].applicationManifest, 'apps/other/app.json');
});

test('isolated Cloudflare Worker serves bundled fixture and rejects writes', async () => {
  const script = execFileSync(process.execPath, [new URL('./build-sandbox.mjs', import.meta.url).pathname]);
  const { default: worker } = await import(`data:text/javascript;base64,${script.toString('base64')}`);
  const request = (path, options) => worker.fetch(new Request('https://sandbox.example' + path, options));
  const health = request('/health');
  assert.equal(health.headers.get('X-Nathan-Profile'), 'sandbox');
  assert.ok((await health.json()).records > 0);
  const stats = await request('/stats').json();
  assert.ok(stats.totals.count > 0);
  const list = await request('/bounties?category=math&status=OPEN').json();
  assert.ok(list.count > 0);
  assert.ok(list.bounties.every(row => row.category === 'mathematics' && row.status === 'OPEN'));
  assert.equal(request('/bounties', { method: 'POST' }).status, 405);
  assert.deepEqual((await request('/stats').json()).totals, stats.totals);
});
