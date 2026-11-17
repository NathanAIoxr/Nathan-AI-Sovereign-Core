import catalog from '../game/ecosystem.json' with { type: 'json' };

export const intervalMs = 5 * 60 * 1000;
const retentionMs = 4 * 60 * 60 * 1000;
const statusHeaders = { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' };
const sites = Object.fromEntries(catalog.map(app => [app.id, app.url]));
const flagship = sites['hook-and-ring'];
const isDigest = value => /^[a-f0-9]{64}$/.test(value ?? '');
const checks = [
  ['online', 'Tournament database', flagship, '/api/status', 'json', data => data.onlinePlay === true],
  ['source', 'GitHub release and source archive', flagship, '/release.json', 'json', data =>
    /^[a-f0-9]{40}$/.test(data.sourceCommit ?? '') && isDigest(data.archive?.sha256) &&
    data.archive?.path === '/source.tar.gz' && data.routes?.some(route => route.path === data.archive.path && route.sha256 === data.archive.sha256)],
  ['archive', 'Source download', flagship, '/source.tar.gz', 'head', data => data.startsWith('application/gzip')],
  ['catalog', 'Arcade catalog', flagship, '/game-plugins.json', 'json', data =>
    Array.isArray(data) && data.length >= 60 && data.every(game => typeof game.id === 'string') &&
    new Set(data.map(game => game.id)).size === data.length],
  ['training', 'Toss Lab pinch controls', flagship, '/training', 'text', data => data.includes('Finger pinch and twist')],
  ['controller', 'Tracker Ball controller', flagship, '/controllers/digit-input.mjs', 'text', data => data.includes('attachDigitTrackBaller')],
  ['ranked-ring', 'Hook and Ring leaderboard', flagship, '/api/board', 'json', data => Array.isArray(data.scores)],
  ['ranked-yard', 'Yard Darts leaderboard', flagship, '/api/yard-darts/board', 'json', data => Array.isArray(data.scores)],
  ...catalog.filter(app => app.url !== flagship).map(app =>
    [app.id, app.title, app.url, '/', 'head', data => data.startsWith('text/html')]),
];

export async function scanRelease(startedAt, fetcher) {
  const results = await Promise.all(checks.map(async ([id, label, base, path, kind, verify]) => {
    const started = Date.now();
    const result = (ok, detail) => ({ id, label, ok, detail, latencyMs: Date.now() - started });
    try {
      const response = await fetcher(new URL(path, base), {
        redirect: 'error',
        method: kind === 'head' ? 'HEAD' : 'GET',
        signal: AbortSignal.timeout(8000),
      });
      if (!response.ok) {
        await response.body?.cancel();
        return result(false, 'HTTP ' + response.status);
      }
      let data;
      if (kind === 'json') data = await response.json();
      if (kind === 'text') data = await response.text();
      if (kind === 'head') data = response.headers.get('content-type') ?? '';
      const ok = verify(data);
      return result(ok, ok ? 'Ready' : 'Unexpected response');
    } catch {
      return result(false, 'Request failed');
    }
  }));
  return { startedAt, ok: results.every(result => result.ok), checks: results };
}

export function reportStatus(latest, now = Date.now()) {
  return { latest, intervalMs, stale: !latest || now - latest.startedAt > 3 * intervalMs };
}

export default {
  async fetch(request, env) {
    if (new URL(request.url).pathname !== '/api/status') return new Response(null, { status: 404 });
    if (request.method !== 'GET') return new Response(null, { status: 405, headers: { Allow: 'GET' } });
    try {
      const row = await env.MONITOR_DB.prepare('SELECT report FROM hook_ring_bee_runs ORDER BY started_at DESC LIMIT 1').first();
      return Response.json(reportStatus(row ? JSON.parse(row.report) : null), { headers: statusHeaders });
    } catch {
      return Response.json({ error: 'Monitor storage is temporarily unavailable.' }, { status: 503, headers: statusHeaders });
    }
  },
  async scheduled(controller, env) {
    const startedAt = controller.scheduledTime;
    const report = await scanRelease(startedAt, (url, options) => {
      const binding = url.hostname.split('.')[0].replaceAll('-', '_').toUpperCase();
      return env[binding].fetch(new Request(url, options));
    });
    await env.MONITOR_DB.batch([
      env.MONITOR_DB.prepare('INSERT OR REPLACE INTO hook_ring_bee_runs(started_at, report) VALUES (?, ?)')
        .bind(startedAt, JSON.stringify(report)),
      env.MONITOR_DB.prepare('DELETE FROM hook_ring_bee_runs WHERE started_at < ?').bind(startedAt - retentionMs),
    ]);
  },
};
