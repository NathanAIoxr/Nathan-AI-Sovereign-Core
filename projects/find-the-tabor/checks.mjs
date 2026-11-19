import { project, sources } from './content.mjs';

async function check([id, url]) {
  try {
    const response = await fetch(url, { redirect: 'manual', signal: AbortSignal.timeout(7000) });
    const status = response.status;
    if (response.body) await response.body.cancel();
    const outcome = response.ok ? 'reachable' : status >= 300 && status < 400 ? 'redirect' : 'review';
    return { id, status, outcome };
  } catch {
    return { id, status: null, outcome: 'network-error' };
  }
}

async function checkSources(env) {
  const checkedAt = new Date().toISOString();
  const query = `INSERT INTO source_checks VALUES (?1, ?2, ?3, ?4)
    ON CONFLICT(source_id) DO UPDATE SET checked_at=excluded.checked_at,
    http_status=excluded.http_status, outcome=excluded.outcome
    WHERE excluded.checked_at >= source_checks.checked_at`;
  // Bound parallel requests to the curated primary and reference sources.
  for (let i = 0; i < sources.length; i += 5) {
    const results = await Promise.all(sources.slice(i, i + 5).map(check));
    await env.RESEARCH_DB.batch(results.map(result =>
      env.RESEARCH_DB.prepare(query).bind(result.id, checkedAt, result.status, result.outcome)));
  }
}

export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url);
    if (request.method !== 'GET') return new Response('Method not allowed', { status:405, headers:{Allow:'GET'} });
    if (pathname === '/health') return Response.json({worker:project.worker, release:project.release, sources:sources.length});
    if (pathname !== '/api/source-checks') return new Response('Page not found', {status:404});
    const { results } = await env.RESEARCH_DB.prepare('SELECT * FROM source_checks ORDER BY source_id').all();
    return Response.json({ checked:results.length, sources:sources.length, results }, { headers: { 'Cache-Control':'no-store' } });
  },
  async scheduled(_event, env) {
    await checkSources(env);
  }
};
