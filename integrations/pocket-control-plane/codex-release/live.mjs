import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { setTimeout as delay } from 'node:timers/promises';
import { claimChecks, publicSigningKeys, verifyGitHubReceipt } from './github-identity.mjs';
const origin = 'https://nathan-ai-pocket-codex.nathantaboract.workers.dev';
const rows = (await Promise.all(['manifest.json','standalone-apps.json'].map(async file => JSON.parse(await readFile(new URL(file, import.meta.url), 'utf8')))));
const projects = rows.flat();
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
for (let start = 0; start < projects.length; start += 8) {
  await Promise.all(projects.slice(start, start + 8).map(async row => {
    const result = await get('/work/' + row.id + '/healthz');
    assert.ok(result.ok, row.id + ' health returned ' + result.status);
    const remote = await result.json();
    assert.equal(remote.id, row.id);
    assert.equal(remote.worker, row.worker);
    assert.equal(remote.ready, true);
  }));
}
console.log('Verified all ' + projects.length + ' live project Worker health routes.');
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
