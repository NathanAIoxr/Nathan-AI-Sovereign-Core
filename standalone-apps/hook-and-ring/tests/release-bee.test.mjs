import test from 'node:test';
import assert from 'node:assert/strict';
import bee, { intervalMs, reportStatus, scanRelease } from '../server/release-bee.mjs';

test('the release bee flags bad responses and checks every linked service', async () => {
  const seen = new Set();
  const report = await scanRelease(1234, async (url, options) => {
    seen.add(url.hostname);
    if (url.pathname === '/api/board') {
      assert.equal(options.method, 'GET');
      return Response.json({ scores: [] });
    }
    if (url.pathname === '/api/yard-darts/board') return new Response(null, { status: 503 });
    if (url.pathname === '/') {
      assert.equal(options.method, 'HEAD');
      return new Response(null, { headers: { 'Content-Type': 'text/html' } });
    }
    throw Error('Simulated offline route');
  });
  assert.equal(seen.size, 6);
  assert.equal(report.startedAt, 1234);
  assert.equal(report.ok, false);
  assert.equal(report.checks.find(check => check.id === 'ranked-ring').ok, true);
  assert.equal(report.checks.find(check => check.id === 'ranked-yard').detail, 'HTTP 503');
  assert.equal(report.checks.find(check => check.id === 'catalog').detail, 'Request failed');
});

test('the published status reports overdue checks and exposes no write operation', async () => {
  const report = { startedAt: Date.now(), ok: true, checks: [] };
  const env = { MONITOR_DB: { prepare: () => ({ first: async () => ({ report: JSON.stringify(report) }) }) } };
  const status = 'https://example.test/api/status';
  const response = await bee.fetch(new Request(status), env);
  assert.equal(response.headers.get('Cache-Control'), 'no-store');
  assert.deepEqual(await response.json(), { latest: report, intervalMs, stale: false });
  assert.equal(reportStatus(report, report.startedAt + 3 * intervalMs + 1).stale, true);
  assert.equal((await bee.fetch(new Request(status, { method: 'POST' }), env)).status, 405);
});
