/** Nathan AI Sovereign Concordance: metadata-only, source-preserving Cloudflare integration. */
export const VERSION = '2026-11-18.1';
const HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'no-store',
  'X-Content-Type-Options': 'nosniff',
  'Access-Control-Allow-Origin': '*',
};
const reply = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: HEADERS });
const size = (v, max = 100) => Math.min(max, Math.max(1, Number.parseInt(v || '25', 10) || 25));
const cursor = v => Math.min(50000, Math.max(0, Number.parseInt(v || '0', 10) || 0));
const term = v => String(v || '').trim().slice(0, 100);
const count = async (db, table) => (await db.prepare('SELECT COUNT(*) AS n FROM ' + table).first()).n;

export async function summary(env) {
  const [layers, components, repositories, sources, priorFleet, imports, fleet, logical] = await Promise.all([
    count(env.ATLAS, 'global_atlas_layers'),
    count(env.ATLAS, 'global_atlas_components'),
    count(env.ATLAS, 'global_atlas_public_repos'),
    count(env.ATLAS, 'global_atlas_sources'),
    count(env.ATLAS, 'global_atlas_existing_fleet'),
    count(env.ATLAS, 'imported_workers'),
    count(env.FLEET, 'fleet_entry'),
    count(env.FLEET, 'virtual_supercomputer_slot_v1'),
  ]);
  const [candidateStatus, slotStatus] = await Promise.all([
    env.ATLAS.prepare('SELECT status, COUNT(*) AS n FROM global_atlas_public_repos GROUP BY status ORDER BY status').all(),
    env.FLEET.prepare('SELECT deployment_state, COUNT(*) AS n FROM virtual_supercomputer_slot_v1 GROUP BY deployment_state ORDER BY deployment_state').all(),
  ]);
  return {
    version: VERSION,
    scope: 'authorized account metadata concordance; no third-party code execution',
    totals: { layers, components, public_repository_candidates: repositories, source_directories: sources,
      atlas_fleet_crosswalk: priorFleet, imported_worker_records: imports, fleet_catalog: fleet, logical_slots: logical },
    public_repository_status: candidateStatus.results,
    logical_slot_status: slotStatus.results,
    external_kernels: 'references_only_not_cloudflare_runtime',
    note: 'Counts are database records, not deployments or independent computers. Upload/deployment health is audited separately.',
  };
}
async function digest(body) {
  const bytes = new TextEncoder().encode(JSON.stringify(body));
  return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)), b => b.toString(16).padStart(2, '0')).join('');
}
export async function recordReceipt(env, at = new Date().toISOString()) {
  const s = await summary(env);
  const hash = await digest(s);
  await env.ATLAS.prepare('INSERT INTO sovereign_concordance_receipts (observed_at,sha256,summary_json) VALUES (?,?,?)')
    .bind(at, hash, JSON.stringify(s)).run();
  return { observed_at: at, sha256: hash, summary: s };
}
const limited = async (sql, bind, db, key = 'items') => ({[key]: (await db.prepare(sql).bind(...bind).all()).results});
export default {
  async fetch(request, env) {
    if (!['GET', 'HEAD'].includes(request.method)) return reply({ error: 'read_only' }, 405);
    try {
      const url = new URL(request.url);
      const path = url.pathname.replace(/\/+$/, '') || '/';
      const q = term(url.searchParams.get('q'));
      const limit = size(url.searchParams.get('limit'));
      const offset = cursor(url.searchParams.get('offset'));
      let result;
      if (path === '/' || path === '/health') {
        await env.ATLAS.prepare('SELECT 1 AS ok').first();
        result = { name: 'Nathan AI Sovereign Concordance', healthy: true, version: VERSION,
          schedule: 'hourly integrity snapshots', source: 'existing authorized Cloudflare D1 databases',
          endpoints: ['/api/summary', '/api/layers', '/api/repositories', '/api/kernels', '/api/components', '/api/fleet', '/api/receipts'] };
      } else if (path === '/api/summary') result = await summary(env);
      else if (path === '/api/layers') result = await limited(
        'SELECT id,title,updated_at FROM global_atlas_layers ORDER BY id', [], env.ATLAS, 'layers');
      else if (path === '/api/repositories' || path === '/api/kernels') {
        const category = path === '/api/kernels' ? 'Kernels & kernel-adjacent' : term(url.searchParams.get('category'));
        result = await limited('SELECT repo,name,category,url,fit,status FROM global_atlas_public_repos WHERE (? = \'\' OR category = ?) AND (? = \'\' OR repo LIKE ? OR name LIKE ?) ORDER BY repo LIMIT ? OFFSET ?',
          [category, category, q, '%' + q + '%', '%' + q + '%', limit, offset], env.ATLAS, 'repositories');
        result.pagination = { limit, offset, returned: result.repositories.length };
      } else if (path === '/api/components') {
        const layer = term(url.searchParams.get('layer'));
        result = await limited('SELECT id,name,layer,source_type,status FROM global_atlas_components WHERE (? = \'\' OR layer = ?) AND (? = \'\' OR name LIKE ?) ORDER BY id LIMIT ? OFFSET ?',
          [layer, layer, q, '%' + q + '%', limit, offset], env.ATLAS, 'components');
        result.pagination = { limit, offset, returned: result.components.length };
      } else if (path === '/api/fleet') {
        const [fleet, logical, imports] = await Promise.all([
          env.FLEET.prepare('SELECT source_state,COUNT(*) AS n FROM fleet_entry GROUP BY source_state').all(),
          env.FLEET.prepare('SELECT allocation_kind,deployment_state,COUNT(*) AS n FROM virtual_supercomputer_slot_v1 GROUP BY allocation_kind,deployment_state').all(),
          env.ATLAS.prepare('SELECT COUNT(*) AS n FROM imported_workers').first(),
        ]);
        result = { catalog_states: fleet.results, logical_slot_states: logical.results,
          imported_worker_registry_count: imports.n, deployment_verification: 'not_inferred_from_catalog' };
      } else if (path === '/api/receipts') {
        const rs = await env.ATLAS.prepare('SELECT observed_at,sha256 FROM sovereign_concordance_receipts ORDER BY observed_at DESC LIMIT ?')
          .bind(Math.min(24, limit)).all();
        result = { receipts: rs.results, purpose: 'scheduled D1 source-integrity summary only, not external deployment probe' };
      } else return reply({ error: 'not_found' }, 404);
      return request.method === 'HEAD' ? new Response(null, { status: 200, headers: HEADERS }) : reply(result);
    } catch (error) {
      console.error('concordance_failure', String(error));
      return reply({ error: 'concordance_unavailable', verified: false }, 503);
    }
  },
  async scheduled(controller, env, ctx) {
    ctx.waitUntil(recordReceipt(env).then(r => console.log('concordance_receipt', r.observed_at, r.sha256)));
  },
};
