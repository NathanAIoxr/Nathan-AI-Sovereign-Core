import assert from 'node:assert/strict';

const release = process.argv[2];
assert.match(release ?? '', /^[a-f0-9]{40}$/);
const root = 'https://unified-operations-cockpit.nathantaboract.workers.dev/tabor-sites';
const path = root + '/groundskeeper-ai';
const get = url => fetch(url, {signal: AbortSignal.timeout(20_000)});
async function json(url) {
  const response = await get(url);
  assert.equal(response.status, 200, url);
  return response.json();
}

assert.deepEqual(await json(path + '/api/health'), {service: 'groundskeeper-ai', ready: true, release});
const [report, staged, html, conductor] = await Promise.all([
  json(path + '/api/status'),
  json(path + '/api/stage'),
  get(path).then(r => r.text()),
  get(root + '/conductor/').then(r => r.text())
]);
assert.equal(report.release, release);
assert.deepEqual(report.services.map(row => row.id), ['conductor', 'lasso', 'sovereign-minds', 'zero', 'one']);
assert.ok(report.services.every(row => /^[a-f0-9]{40}$/.test(row.release ?? '')), JSON.stringify(report.services));
assert.match(html, /Collyn Phillips Tabor/);
assert.match(conductor, /href="\/tabor-sites\/groundskeeper-ai"/);
const failed = await fetch(path + '/api/release', {method: 'POST', signal: AbortSignal.timeout(15_000),
  headers: {'Content-Type': 'application/json'}, body: JSON.stringify({candidate: staged.candidate, permit: 'unsigned'})});
assert.equal(failed.status, 422);
assert.equal((await failed.json()).reason, 'missing_or_invalid_permit');
console.log(JSON.stringify({release, serviceStates: report.services.map(({id, state}) => ({id, state})),
  continuity: report.continuity, conductorLink: true, unsignedRelease: 0}));
