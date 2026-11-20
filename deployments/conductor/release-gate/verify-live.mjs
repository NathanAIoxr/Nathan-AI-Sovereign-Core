import assert from 'node:assert/strict';

const release = process.argv[2];
assert.match(release ?? '', /^[a-f0-9]{40}$/);
const root = 'https://unified-operations-cockpit.nathantaboract.workers.dev/tabor-sites/conductor';
const opts = () => ({ redirect: 'manual', signal: AbortSignal.timeout(15_000) });

const health = await fetch(root + '/api/release-gate/health', opts());
assert.equal(health.status, 200);
assert.deepEqual(await health.json(), { policy: 'lasso-release-v1', ready: true, release });

const fixture = { id: 'smoke', producer: 'llm', kind: 'authored', action: 'index', destination: 'fixture', encoding: 'utf8',
  payload: 'synthetic-smoke-fixture' };
const post = (path, body) => fetch(root + path, {
  ...opts(), method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(body)
});
const fail = await post('/api/release-gate/evaluate', { candidate: fixture });
assert.equal(fail.status, 422);
const receipt = await fail.json();
assert.equal(receipt.bit, 0);
assert.equal(receipt.reason, 'missing_or_invalid_permit');
assert.equal(Object.hasOwn(receipt, 'payload'), false);

const issue = await post('/cheironomer/operator/release-gate/attest', { candidate: fixture });
assert.ok([302, 303, 401, 403].includes(issue.status));
const original = await fetch(root + '/api/health', opts());
assert.equal(original.status, 200);
assert.equal((await original.json()).service, 'nathan-ai-conductor');
console.log('Verified live gate readiness, unsigned discard, operator route protection, and Master Conductor health at ' + release);
