import { test } from 'node:test';
import assert from 'node:assert/strict';
import worker from './worker.mjs';
import { attest, evaluate } from '../release-gate/policy.mjs';

const release = 'a'.repeat(40);
const site = 'https://example.test/tabor-sites/groundskeeper-ai';
const secret = 'nobody can use this synthetic unit test key';
const review = {protectsInnocence: true, honest: true, authorized: true, sources: ['b'.repeat(64)]};
const endpoints = {
  'nathan-ai-conductor/api/health': {service: 'nathan-ai-conductor'},
  'nathan-ai-conductor/api/release-gate/health': {policy: 'lasso-release-v1'},
  'nathan-ai-sovereign-minds/healthz': {service: 'sovereign-minds'},
  'nathan-ai-mind-zero/healthz': {mindId: 'zero'},
  'nathan-ai-mind-one/healthz': {mindId: 'one'}
};

function runtime({alarm = 'current', wrongService = false} = {}) {
  const requests = [];
  return {requests, env: {RELEASE_SHA: release, PLATFORM: {
    get(name) {
      return {async fetch(request) {
        const key = name + new URL(request.url).pathname;
        requests.push(key);
        if (key === 'nathan-ai-conductor/api/time') {
          return Response.json({last: new Date(Date.now() - (alarm === 'stale' ? 3_600_000 : 6000)).toISOString(),
            next: Date.now() + 600_000, passed: alarm === 'degraded' ? 5 : 7, total: 7});
        }
        if (key === 'nathan-ai-conductor/api/release-gate/evaluate') {
          const {candidate, permit} = await request.json();
          const result = await evaluate(candidate, permit, secret);
          return Response.json(result, {status: result.bit === 1 ? 200 : 422});
        }
        assert.ok(Object.hasOwn(endpoints, key), key);
        const reported = wrongService && key.includes('mind-one') ? {mindId: 'zero'} : endpoints[key];
        return Response.json({...reported, ready: true, release});
      }};
    }
  }}};
}

const get = (env, path = '') => worker.fetch(new Request(site + path), env);
const post = (env, value) => worker.fetch(new Request(site + '/api/release', {method: 'POST',
  headers: {'Content-Type': 'application/json'}, body: JSON.stringify(value)}), env);

test('dashboard and status use Collyn’s canonical spelling and only fixed health routes', async () => {
  const {env, requests} = runtime();
  const page = await (await get(env)).text();
  assert.match(page, /Collyn Phillips Tabor/);
  assert.match(page, /DOES THE SYSTEM WORK\?/);
  assert.match(page, /WILL IT KEEP WORKING\?/);
  const report = await (await get(env, '/api/status?target=https://example.org')).json();
  assert.equal(report.services.length, 5);
  assert.ok(report.services.every(row => row.state === 'ready'));
  assert.equal(report.continuity.state, 'current');
  assert.ok([...report.services, report.continuity].every(row => /^[a-f0-9]{64}$/.test(row.sourceDigest) &&
    row.source.startsWith('https://unified-operations-cockpit.nathantaboract.workers.dev/tabor-sites/')));
  assert.equal(new Set(requests).size, 6);
  assert.equal((await get(env, '/api/health')).status, 200);
  assert.equal((await get(env, '/api/release')).status, 405);
  assert.equal((await get(env, '/api/other')).status, 404);
});

test('availability does not cover a wrong service or an old TIME receipt', async () => {
  for (const mode of ['stale', 'degraded']) {
    const {env} = runtime({alarm: mode, wrongService: true});
    const report = await (await get(env, '/api/status')).json();
    assert.equal(report.services.find(row => row.id === 'one').state, 'unverified');
    assert.equal(report.continuity.state, mode === 'degraded' ? mode : 'unverified');
  }
});

test('only a Conductor-approved report is returned, in its exact staged bytes', async () => {
  const {env, requests} = runtime();
  const {candidate} = await (await get(env, '/api/stage')).json();
  assert.equal(candidate.destination, 'groundskeeper-ai');
  const noPermit = await post(env, {candidate});
  assert.equal(noPermit.status, 422);
  assert.equal((await noPermit.json()).reason, 'missing_or_invalid_permit');
  const approved = await attest(candidate, review, secret);
  const passing = await post(env, {candidate, permit: approved.permit});
  assert.equal(passing.status, 200);
  assert.equal(passing.headers.get('X-Lasso-Release-Bit'), '1');
  assert.equal(passing.headers.get('X-Lasso-Release-Digest'), approved.digest);
  assert.equal(await passing.text(), candidate.payload);
  const altered = {...candidate, payload: candidate.payload + ' '};
  const failed = await post(env, {candidate: altered, permit: approved.permit});
  assert.equal(failed.status, 422);
  assert.equal((await failed.json()).reason, 'permit_scope_mismatch');
  assert.equal(requests.filter(key => key.endsWith('/evaluate')).length, 2);
  assert.equal((await post(env, {candidate: {...candidate, destination: 'other'}, permit: approved.permit})).status, 422);
});
