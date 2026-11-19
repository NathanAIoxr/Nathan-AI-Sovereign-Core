import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { setTimeout as delay } from 'node:timers/promises';
import { claimChecks, verifyGitHubReceipt } from './github-identity.mjs';
const origin = 'https://nathan-ai-pocket-codex.nathantaboract.workers.dev';
const rows = JSON.parse(await readFile(new URL('./manifest.json', import.meta.url), 'utf8'));
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
assert.equal((await health.json()).projects, rows.length);
for (let start = 0; start < rows.length; start += 8) {
  await Promise.all(rows.slice(start, start + 8).map(async row => {
    const result = await get('/work/' + row.id + '/healthz');
    assert.ok(result.ok, row.id + ' health returned ' + result.status);
    const remote = await result.json();
    assert.equal(remote.id, row.id);
    assert.equal(remote.worker, row.worker);
    assert.equal(remote.ready, true);
  }));
}
console.log('Verified all ' + rows.length + ' live project Worker health routes.');
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
  assert.ok(await verifyGitHubReceipt('Bearer ' + value), 'GitHub OIDC signature verification failed');
  const result = await fetch(origin + '/api/github/receipt', {
    method: 'POST', headers: { authorization: 'Bearer ' + value },
    redirect: 'error', signal: AbortSignal.timeout(10000),
  });
  assert.ok(result.ok, 'Cloudflare receipt returned ' + result.status);
  const saved = await result.json();
  assert.equal(saved.saved, true);
  assert.equal(saved.run, process.env.GITHUB_RUN_ID);
  console.log('Authenticated build receipt saved to Cloudflare.');
}
