// Public routes query the curated module table or aggregate the account inventory.
const slayerViews = new Set(['supercomputer', 'hypercomputer', 'sos']);
const slayerJobs = new Map([
  ['inventory-summary', 'inventory'],
  ['pool-summary', 'views'],
  ['slubber-policy', '/api/zones'],
  ['sos-response', '/api/sos?scenario=manual-drill']
]);
const slayerFailure = (error, status) => Response.json({ error }, { status });

async function slayerSummary(db) {
  const [inventory, modules, snapshot] = await db.batch([
    db.prepare('SELECT count(*) AS total FROM cloud_worker_inventory'),
    db.prepare('SELECT count(*) AS total FROM cloud_slayer_modules WHERE active = 1'),
    db.prepare("SELECT recorded_at FROM cloud_slayer_snapshot WHERE source = 'cloudflare-workers'")
  ]);
  const cloudflare_workers = inventory.results[0].total;
  const shared_modules = modules.results[0].total;
  return {
    cloudflare_workers, shared_modules,
    total_records: cloudflare_workers + shared_modules,
    inventory_as_of: snapshot.results[0]?.recorded_at ?? null
  };
}

const slayerToolHost = 'https://github.com/';
const slayerToolSource = 'NathanAIoxr/Nathan-AI-Sovereign-Core';
const slayerToolColumns = 't.id, t.tool_key, t.title, t.description, t.tags, t.kind, t.source_path, t.source_ref';
const slayerToolJoin = 'LEFT JOIN cloud_slayer_tool_upstream u ON u.tool_key = t.tool_key';
const slayerToolFilter = `
  AND (? = '' OR upper(substr(t.title, 1, 1)) = ?)
  AND (? = '' OR (? = 'upstream' AND u.tool_key IS NOT NULL) OR (? = 'nathan-ai' AND u.tool_key IS NULL))`;
const slayerGitPath = path => path.split('/').map(encodeURIComponent).join('/');

async function slayerTools(db, params) {
  const q = (params.get('q') ?? '').trim();
  const letter = params.get('letter') ?? '';
  const source = params.get('source') ?? '';
  const after = params.get('after') ?? '0';
  const tokens = q.match(/[\p{L}\p{N}]+/gu) ?? [];
  const cursor = Number(after);
  if (q.length > 96 || tokens.length > 10 || (q && !tokens.length)
    || (letter && !/^[A-Z]$/.test(letter)) || !['', 'upstream', 'nathan-ai'].includes(source)
    || !/^\d+$/.test(after) || !Number.isSafeInteger(cursor)) {
    return slayerFailure('invalid-tool-filter', 400);
  }
  const filter = [letter, letter, source, source, source];
  const columns = slayerToolColumns + ', u.repository, u.license, u.license_path';
  const statement = q
    ? db.prepare(`SELECT ${columns} FROM cloud_slayer_tool_search
        JOIN cloud_slayer_tools t ON t.id = cloud_slayer_tool_search.rowid ${slayerToolJoin}
        WHERE cloud_slayer_tool_search MATCH ? AND cloud_slayer_tool_search.rowid > ? ${slayerToolFilter}
        ORDER BY cloud_slayer_tool_search.rowid LIMIT 26`)
      .bind(tokens.map(term => '"' + term + '"*').join(' AND '), cursor, ...filter)
    : db.prepare(`SELECT ${columns} FROM cloud_slayer_tools t ${slayerToolJoin}
        WHERE t.id > ? ${slayerToolFilter} ORDER BY t.id LIMIT 26`).bind(cursor, ...filter);
  const [{ results }, count] = await db.batch([
    statement, db.prepare('SELECT total FROM cloud_slayer_tool_count WHERE singleton = 1')
  ]);
  const tools = results.slice(0, 25).map(({ id, source_ref, source_path, repository, license, license_path, ...row }) => {
    const upstream = slayerToolHost + slayerGitPath(repository ?? slayerToolSource);
    const pin = encodeURIComponent(source_ref);
    return {
      ...row,
      source_url: source_path ? upstream + '/blob/' + pin + '/' + slayerGitPath(source_path) : upstream + '/tree/' + pin,
      ...(repository ? { repository, license, license_url: upstream + '/blob/' + pin + '/' + slayerGitPath(license_path) } : {})
    };
  });
  return Response.json({
    tools,
    registered_tools: count.results[0].total,
    next: results.length > 25 ? String(results[24].id) : null
  });
}

export async function cloudSlayerApi(url, db, readApp) {
  if (!db) return slayerFailure('registry-unavailable', 503);
  const path = url.pathname;
  const p = url.searchParams;
  try {
    if (path === '/api/cloud-slayer/summary') return Response.json(await slayerSummary(db));
    if (path === '/api/cloud-slayer/tools') return await slayerTools(db, p);
    if (path === '/api/cloud-slayer/modules') {
      const view = p.get('view') ?? '';
      const q = (p.get('q') ?? '').trim();
      const after = p.get('after') ?? '';
      if ((view && !slayerViews.has(view)) || q.length > 64 || (after && !/^[a-z0-9-]{1,72}$/.test(after))) {
        return slayerFailure('invalid-filter', 400);
      }
      const { results } = await db.prepare(`
        SELECT m.module_id, m.label, m.description
        FROM cloud_slayer_modules m
        WHERE m.active = 1 AND m.module_id > ?
          AND (? = '' OR EXISTS (SELECT 1 FROM cloud_slayer_module_views v WHERE v.module_id = m.module_id AND v.view_name = ?))
          AND (? = '' OR instr(lower(m.label || ' ' || m.description || ' ' || m.module_id), lower(?)) > 0)
        ORDER BY m.module_id LIMIT 26`
      ).bind(after, view, view, q, q).all();
      const modules = results.slice(0, 25).map(item => ({ ...item, runnable: slayerJobs.has(item.module_id) }));
      return Response.json({ modules, next: results.length > 25 ? modules.at(-1).module_id : null });
    }
    if (path === '/api/cloud-slayer/worker') {
      const key = p.get('key');
      const job = slayerJobs.get(key);
      if (!job) return slayerFailure('unknown-module', 404);
      const active = await db.prepare('SELECT 1 AS enabled FROM cloud_slayer_modules WHERE module_id = ? AND active = 1').bind(key).first();
      if (!active) return slayerFailure('unknown-module', 404);
      if (job === 'inventory') return Response.json(await slayerSummary(db));
      if (job === 'views') {
        const { results } = await db.prepare(`
          SELECT v.view_name, count(*) AS shared_modules
          FROM cloud_slayer_module_views v JOIN cloud_slayer_modules m ON v.module_id = m.module_id
          WHERE m.active = 1 GROUP BY v.view_name ORDER BY v.view_name`
        ).all();
        return Response.json({ views: results });
      }
      return await readApp(job);
    }
    return slayerFailure('not-found', 404);
  } catch {
    return slayerFailure('registry-unavailable', 503);
  }
}
