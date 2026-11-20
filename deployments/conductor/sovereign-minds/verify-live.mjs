import assert from 'node:assert/strict';
import { mindIds, seedMind } from './seeds.mjs';

const release = process.argv[2];
const base = process.env.SOVEREIGN_MIND_ORIGIN ?? 'https://unified-operations-cockpit.nathantaboract.workers.dev';
assert.match(release ?? '', /^[a-f0-9]{40}$/);

async function get(path) {
  const response = await fetch(new URL(path, base), { signal: AbortSignal.timeout(10_000) });
  assert.equal(response.status, 200, path);
  return response.json();
}

const health = await get('/tabor-sites/sovereign-minds/healthz');
assert.deepEqual(health, { ready: true, service: 'sovereign-minds', release, catalogCount: mindIds.length });
const catalog = await get('/tabor-sites/sovereign-minds/api/catalog');
assert.equal(catalog.release, release);
assert.deepEqual(catalog.minds.map(row => row.id), mindIds);
for (const id of mindIds) {
  const profile = await seedMind(id);
  const prefix = '/tabor-sites/mind-' + id;
  assert.deepEqual(await get(prefix + '/healthz'), { ready: true, mindId: id, digest: profile.digest, release });
  assert.deepEqual(await get(prefix + '/api/profile'), profile);
}
console.log('Verified Cloudflare catalog and ' + mindIds.length + ' independent MIND endpoints at GitHub release ' + release);
