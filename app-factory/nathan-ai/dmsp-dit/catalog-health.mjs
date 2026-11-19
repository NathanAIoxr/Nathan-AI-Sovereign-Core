const NAMESPACE = "nathan-tabor-platforms";
const JOB_ID = "dmsp-catalog-health";
const PORTALS = ["bitcoin","cloud","compute","github","languages","library","memory","moment","outside-box","wordplay","world"];
const SHARD_COUNT = 989;
const PHASES = 5;
const MINUTE_MS = 60_000;
const CONCURRENCY = 5;
const SHARDS = Array.from({ length: SHARD_COUNT }, (_, i) => "language-shard-" + String(i + 1).padStart(4, "0"));

export function catalogBatch(minute) {
  const size = Math.ceil(SHARDS.length / PHASES);
  const offset = (minute % PHASES) * size;
  return [...PORTALS, ...SHARDS.slice(offset, offset + size)];
}

export async function probeCatalog(pool, name) {
  const isPortal = PORTALS.includes(name);
  if (!isPortal && !SHARDS.includes(name)) return [name, "FAIL", "not_allowlisted"];
  const route = "/p/" + name + (isPortal ? "/api/platform" : "");
  try {
    const worker = pool.get(name, {}, { limits: { cpuMs: 10, subRequests: isPortal ? 1 : 0 } });
    const response = await worker.fetch("https://catalog.internal" + route, { method: "GET", redirect: "error" });
    if (!response.ok) return [name, "FAIL", "http_" + response.status];
    const data = await response.json();
    const hasCatalogData = isPortal
      ? typeof data?.title === "string" && data.title.length > 0
      : data?.source === "Glottolog CLDF v5.4" && Array.isArray(data.records) &&
        data.records.length > 0 && data.records.length <= 48 &&
        data.first === data.records[0]?.id && data.last === data.records.at(-1)?.id;
    return data?.id === name && hasCatalogData
      ? [name, "PASS", "catalog_response_verified"]
      : [name, "FAIL", "unexpected_catalog_response"];
  } catch {
    return [name, "FAIL", "catalog_worker_unavailable"];
  }
}

export default {
  async scheduled(controller, env) {
    const slot = Math.floor(controller.scheduledTime / MINUTE_MS);
    const { results } = await env.DB.prepare(`
      SELECT p.script_name FROM json_each(?) AS names
      JOIN dmsp_worker_pool AS p ON p.script_name = names.value
      WHERE p.namespace = ? AND p.execution_enabled = 1 AND p.pool_state != 'DISABLED'
        AND EXISTS (
          SELECT 1 FROM grid_build_queue WHERE job_id = ? AND kind = 'DMSP_CATALOG_CHECK'
          AND target = ? AND state = 'QUEUED' AND requires_approval = 0
        )
    `).bind(JSON.stringify(catalogBatch(slot)), NAMESPACE, JOB_ID, NAMESPACE).all();
    if (!results.length) return;

    const receipts = [];
    for (let i = 0; i < results.length; i += CONCURRENCY) {
      const batch = results.slice(i, i + CONCURRENCY);
      receipts.push(...await Promise.all(batch.map(row => probeCatalog(env.POOL, row.script_name))));
    }

    await env.DB.batch([
      env.DB.prepare(`
        INSERT INTO dmsp_catalog_receipts (script_name, slot, result, detail, observed_at)
        SELECT json_extract(value, '$[0]'), ?, json_extract(value, '$[1]'),
          json_extract(value, '$[2]'), ? FROM json_each(?) WHERE true
        ON CONFLICT(script_name) DO UPDATE SET slot=excluded.slot, result=excluded.result,
          detail=excluded.detail, observed_at=excluded.observed_at
        WHERE excluded.slot > dmsp_catalog_receipts.slot OR
          (excluded.slot = dmsp_catalog_receipts.slot AND
            dmsp_catalog_receipts.result = 'FAIL' AND excluded.result = 'PASS')
      `).bind(slot, new Date().toISOString(), JSON.stringify(receipts)),
      env.DB.prepare(`
        UPDATE dmsp_worker_pool AS p
        SET pool_state = CASE WHEN r.result = 'PASS' THEN 'ACTIVE' ELSE 'DEGRADED' END,
          health_state = r.result, last_verified_at = r.observed_at
        FROM dmsp_catalog_receipts AS r
        WHERE p.script_name = r.script_name AND r.slot = ? AND p.namespace = ?
          AND p.execution_enabled = 1 AND p.pool_state != 'DISABLED'
      `).bind(slot, NAMESPACE),
    ]);
  },

  async fetch(request, env) {
    if (request.method !== "GET" || new URL(request.url).pathname !== "/status") {
      return Response.json({ error: "not_found" }, { status: 404 });
    }
    const threshold = Math.floor(Date.now() / MINUTE_MS) - PHASES - 2;
    const { results } = await env.DB.prepare(`
      SELECT CASE WHEN substr(p.script_name, 1, 15) = 'language-shard-' THEN 'language_shards' ELSE 'portals' END AS category,
        count(*) AS registered,
        sum(CASE WHEN p.execution_enabled = 1 AND p.pool_state != 'DISABLED' THEN 1 ELSE 0 END) AS enabled,
        sum(CASE WHEN r.result = 'PASS' AND r.slot >= ? AND p.execution_enabled = 1
          AND p.pool_state = 'ACTIVE' THEN 1 ELSE 0 END) AS verified,
        sum(CASE WHEN r.result = 'FAIL' THEN 1 ELSE 0 END) AS failed,
        max(r.observed_at) AS latest_receipt
      FROM dmsp_worker_pool AS p LEFT JOIN dmsp_catalog_receipts AS r ON p.script_name = r.script_name
      WHERE p.namespace = ? AND
        (p.script_name GLOB 'language-shard-[0-9][0-9][0-9][0-9]' OR p.script_name IN (SELECT value FROM json_each(?)))
      GROUP BY category ORDER BY category
    `).bind(threshold, NAMESPACE, JSON.stringify(PORTALS)).all();
    return Response.json({
      service: "DMSP catalog worker health",
      coverage_minutes: PHASES,
      scope: "Read-only catalog responses",
      workers: results,
    }, { headers: { "cache-control": "public, max-age=15" } });
  },
};
