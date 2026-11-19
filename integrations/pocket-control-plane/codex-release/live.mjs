import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { setTimeout as delay } from 'node:timers/promises';
import { claimChecks, publicSigningKeys, verifyGitHubReceipt } from './github-identity.mjs';
import { crosshairs, orderedRelease, validateCatalogOrder, verifyCrosshairs, verifyCrosshairsCollections } from './release-order.mjs';
const origin = 'https://nathan-ai-pocket-codex.nathantaboract.workers.dev';
const [numberedAndNamed, standaloneApps] = await Promise.all(['manifest.json', 'standalone-apps.json'].map(async file =>
  JSON.parse(await readFile(new URL(file, import.meta.url), 'utf8'))));
const projects = [...numberedAndNamed, ...standaloneApps];
validateCatalogOrder(projects);
async function get(path) {
  for (let attempt = 0; ; attempt += 1) {
    try {
      const response = await fetch(origin + path, { redirect: 'error', signal: AbortSignal.timeout(12000) });
      if (response.ok || attempt === 3) return response;
      await response.body?.cancel();
    } catch (error) {
      if (attempt === 3) throw error;
    }
    await delay(500 * (attempt + 1));
  }
}
const health = await get('/healthz');
assert.ok(health.ok, 'Pocket dashboard health');
assert.equal((await health.json()).projects, projects.length);
const publishedOrder = await get('/api/order');
assert.ok(publishedOrder.ok, 'Pocket release order is published');
assert.deepEqual(await publishedOrder.json(), orderedRelease(projects));

async function checkProject(row) {
  const result = await get('/work/' + row.id + '/healthz');
  assert.ok(result.ok, row.id + ' health returned ' + result.status);
  const remote = await result.json();
  assert.equal(remote.id, row.id);
  assert.equal(remote.worker, row.worker);
  assert.equal(remote.ready, true);
}
for (let start = 0; start < numberedAndNamed.length; start += 8) {
  await Promise.all(numberedAndNamed.slice(start, start + 8).map(checkProject));
}
const [views, fullViews, collections] = await Promise.all([
  get(crosshairs.path + 'api/views'),
  get(crosshairs.path + 'api/views?collection=all'),
  get(crosshairs.path + 'api/collections'),
]);
assert.ok(views.ok && verifyCrosshairs(await views.json()), 'Codex 0–9 and nine Crosshairs views match the release');
assert.ok(fullViews.ok && verifyCrosshairs(await fullViews.json(), projects.map(row => row.id)), 'Full catalog renders in all nine views');
assert.ok(collections.ok && verifyCrosshairsCollections(await collections.json(), orderedRelease(projects)), 'Crosshairs collections match the published order');
await Promise.all(standaloneApps.map(checkProject));
console.log('Verified the published release order, ' + projects.length + ' project Workers, and all nine Crosshairs views.');
if (process.argv.includes('--receipt')) {
  const oidc = new URL(process.env.ACTIONS_ID_TOKEN_REQUEST_URL);
  oidc.searchParams.set('audience', origin);
  const response = await fetch(oidc, {
    headers: { authorization: 'Bearer ' + process.env.ACTIONS_ID_TOKEN_REQUEST_TOKEN },
    redirect: 'error', signal: AbortSignal.timeout(10000),
  });
  assert.ok(response.ok, 'GitHub OIDC request failed');
  const { value } = await response.json();
  assert.equal(typeof value, 'string');
  const claims = JSON.parse(Buffer.from(value.split('.')[1], 'base64url').toString('utf8'));
  const checks = claimChecks(claims, Date.now() / 1000);
  const rejected = Object.keys(checks).filter(key => !checks[key]);
  assert.equal(rejected.length, 0, 'Unexpected GitHub identity fields: ' + rejected.join(', '));
  let publicKeys;
  const checkKeys = async (...args) => {
    const response = await fetch(...args);
    if (response.ok) publicKeys = publicSigningKeys((await response.clone().json()).keys);
    return response;
  };
  assert.ok(await verifyGitHubReceipt('Bearer ' + value, checkKeys), 'GitHub OIDC signature verification failed');
  assert.ok(publicKeys, 'Invalid GitHub public signing key set');
  const result = await fetch(origin + '/api/github/receipt', {
    method: 'POST', headers: { authorization: 'Bearer ' + value, 'content-type': 'application/json' },
    body: JSON.stringify({ publicSigningKeys: publicKeys }),
    redirect: 'error', signal: AbortSignal.timeout(10000),
  });
  if (!result.ok) {
    const failed = await result.json().catch(() => ({}));
    const reason = typeof failed.reason === 'string' && /^[a-z_]+$/.test(failed.reason) ? ' (' + failed.reason + ')' : '';
    assert.fail('Cloudflare receipt returned ' + result.status + reason);
  }
  const saved = await result.json();
  assert.equal(saved.saved, true);
  assert.equal(saved.run, process.env.GITHUB_RUN_ID);
  console.log('Authenticated build receipt saved to Cloudflare. Signing keys refreshed: ' + saved.signingKeysRefreshed);
}
