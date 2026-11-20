const publicRepo = 'NathanAIoxr/Nathan-AI-Sovereign-Core';
const queries = {
  staged_app: 'SELECT project_id AS project, launch_status AS mode, staging_alias AS alias, fixture_count AS fixtures FROM staged_app WHERE project_id = ? LIMIT 2',
  zone_manifest: 'SELECT project, phase AS mode FROM zone_manifest WHERE project = ? LIMIT 2'
};

export function compare(input, manifest, evidence) {
  const github = { path: input.path, revision: input.revision };
  const findings = [];
  const project = input.project;
  if (Array.isArray(manifest) ? !manifest.includes(project) : manifest?.projectId !== project) {
    findings.push('GitHub manifest does not declare the expected project');
  }
  for (const {table, rows} of evidence) {
    if (rows.length !== 1 || rows[0].project !== project) {
      findings.push(table + ' has a missing or ambiguous project row');
      continue;
    }
    const row = rows[0];
    if (!Array.isArray(manifest) && table === 'staged_app') {
      if (row.alias !== manifest.alias) findings.push('Staging alias differs');
      if (row.mode !== manifest.mode) findings.push('Staging mode differs');
      if (row.fixtures !== manifest.fixtureCount) findings.push('Fixture count differs');
    }
  }
  const modes = new Set(evidence.flatMap(x => x.rows.map(row => row.mode)));
  if (modes.size > 1) findings.push('Zone tables disagree on release state');
  return {
    project, github, cloudflare: evidence,
    status: findings.length ? 'review' : 'candidate',
    integration: findings.length ? 'Resolve manifest differences' :
      (Array.isArray(manifest) ? 'Link the project identity to the zone catalog' :
        'Link the app identity and staging metadata to the zone catalog'),
    findings
  };
}

export async function inspect(env, fetcher = fetch) {
  const input = JSON.parse(env.READER_CONFIG);
  const url = 'https://raw.githubusercontent.com/' + publicRepo + '/' + input.revision + '/' + input.path;
  const response = await fetcher(url, { redirect: 'error', signal: AbortSignal.timeout(5000) });
  if (!response.ok) throw new Error('GitHub manifest unavailable');
  const manifest = await response.json();
  const evidence = await Promise.all(input.tables.map(async table => {
    const result = await env.PROJECT_LEDGER.prepare(queries[table]).bind(input.project).all();
    return { table, rows: result.results };
  }));
  return compare(input, manifest, evidence);
}

export default {
  async fetch(request, env) {
    const path = new URL(request.url).pathname;
    const headers = { 'Cache-Control': 'no-store' };
    if (request.method !== 'GET') return new Response(null, { status: 405, headers });
    if (path === '/health') return Response.json({ component: 'project-reader' }, { headers });
    if (path !== '/integration-candidates') return new Response(null, { status: 404, headers });
    if (!env.READER_KEY || request.headers.get('Authorization') !== 'Bearer ' + env.READER_KEY) {
      return new Response(null, { status: 401, headers });
    }
    try { return Response.json(await inspect(env), { headers }); }
    catch { return Response.json({ error: 'Source unavailable' }, { status: 502, headers }); }
  }
};
