import { departmentBuilds } from "./department-builds.mjs";

const KIND = "DMSP_DEPARTMENT_BUILD";
const NAMESPACE = "nathan-tabor-platforms";
const PREFIX = "dmsp-dit-";
const JOB_PREFIX = "dmsp-department:";
const BATCH_SIZE = 4;
const MINUTE_MS = 60_000;
const RECEIPT_RETENTION_MS = 7 * 24 * 60 * MINUTE_MS;

const scheduledJobs = `
  SELECT q.job_id, q.target, d.id, d.title,
         r.id AS runbookId, r.approval_required AS approvalRequired, r.enabled
  FROM grid_build_queue q
  JOIN dmsp_worker_pool p ON p.script_name = q.target
  LEFT JOIN dmsp_departments d ON q.job_id = ? || d.id
  LEFT JOIN dmsp_runbooks r ON r.department_id = d.id AND r.id = 'rb-' || d.id || '-baseline'
  WHERE q.kind = ? AND q.state = 'QUEUED' AND q.requires_approval = 0
    AND p.namespace = ? AND p.execution_enabled = 1 AND p.pool_state != 'DISABLED'
  ORDER BY q.job_id LIMIT ?
`;

async function runDepartment(env, row, slot) {
  const id = row.job_id.slice(JOB_PREFIX.length);
  if (!Object.hasOwn(departmentBuilds, id) || row.job_id !== JOB_PREFIX + id || row.target !== PREFIX + id) return;

  let result = "FAIL";
  let detail = "department_worker_unavailable";
  let build = null;
  try {
    const worker = env.POOL.get(row.target, {}, { limits: { cpuMs: 10, subRequests: 0 } });
    const response = await worker.fetch("https://department.internal/build", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        departmentId: row.id,
        title: row.title,
        runbookId: row.runbookId,
        approvalRequired: row.approvalRequired,
        enabled: row.enabled,
      }),
    });

    detail = "unexpected_department_response";
    if (response.ok) {
      const receipt = await response.json();
      const [deliverable, input, evidence] = departmentBuilds[id];
      if (receipt.version === 1 && receipt.departmentId === id &&
          receipt.runbookId === row.runbookId && receipt.build?.state === "PENDING_INPUT" &&
          receipt.build.deliverable === deliverable && receipt.build.input === input &&
          receipt.build.evidence === evidence) {
        result = "PASS";
        detail = "department_build_ready";
        build = JSON.stringify(receipt.build);
      }
    } else if (response.status === 422) {
      detail = "invalid_baseline";
    }
  } catch {
    // Record a stable category without exposing provider errors or response bodies.
  }
  await env.DB.batch([
    env.DB.prepare(`
      INSERT INTO dmsp_pool_receipts (job_id, script_name, slot, result, detail, build_json, observed_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(job_id, slot) DO UPDATE SET result=excluded.result, detail=excluded.detail,
        build_json=excluded.build_json, observed_at=excluded.observed_at
      WHERE dmsp_pool_receipts.result != 'PASS' AND excluded.result = 'PASS'
    `).bind(row.job_id, row.target, slot, result, detail, build, new Date().toISOString()),
    env.DB.prepare(`
      UPDATE dmsp_worker_pool AS p
      SET pool_state = CASE WHEN r.result = 'PASS' THEN 'ACTIVE' ELSE 'DEGRADED' END,
        health_state = r.result, last_verified_at = r.observed_at
      FROM dmsp_pool_receipts AS r
      WHERE p.script_name = ? AND r.job_id = ? AND r.slot = ?
        AND p.execution_enabled = 1 AND p.pool_state != 'DISABLED'
        AND NOT EXISTS (SELECT 1 FROM dmsp_pool_receipts recent WHERE recent.job_id = r.job_id AND recent.slot > r.slot)
    `).bind(row.target, row.job_id, slot),
  ]);
}

export default {
  async fetch(request, env) {
    if (request.method !== "GET" || new URL(request.url).pathname !== "/status") {
      return Response.json({ error: "not_found" }, { status: 404 });
    }
    const { results } = await env.DB.prepare(`
      SELECT q.job_id, p.pool_state, p.health_state, p.last_verified_at, r.build_json
      FROM grid_build_queue q
      JOIN dmsp_worker_pool p ON q.target = p.script_name
      LEFT JOIN dmsp_pool_receipts r ON r.job_id = q.job_id
        AND r.slot = (SELECT max(slot) FROM dmsp_pool_receipts WHERE job_id = q.job_id)
      WHERE q.kind = ? AND p.namespace = ?
      ORDER BY q.job_id
    `).bind(KIND, NAMESPACE).all();
    const departments = results.map(row => ({
      department_id: row.job_id.slice(JOB_PREFIX.length),
      worker_state: row.pool_state,
      last_result: row.health_state,
      last_verified_at: row.last_verified_at,
      build: row.build_json ? JSON.parse(row.build_json) : null,
    }));
    const recentThreshold = Date.now() - 3 * MINUTE_MS;
    return Response.json({
      service: "DMSP + DIT department builds",
      cadence_seconds: 60,
      catalog_status_url: "https://nathan-ai-dmsp-catalog-health.nathantaboract.workers.dev/status",
      scheduled_departments: departments.length,
      active_departments: departments.filter(row => row.worker_state === "ACTIVE" &&
        Date.parse(row.last_verified_at) >= recentThreshold).length,
      departments,
    }, { headers: { "cache-control": "public, max-age=60" } });
  },

  async scheduled(controller, env) {
    const slot = Math.floor(controller.scheduledTime / MINUTE_MS);
    const { results } = await env.DB.prepare(scheduledJobs)
      .bind(JOB_PREFIX, KIND, NAMESPACE, Object.keys(departmentBuilds).length).all();
    const errors = [];
    for (let i = 0; i < results.length; i += BATCH_SIZE) {
      const outcomes = await Promise.allSettled(results.slice(i, i + BATCH_SIZE).map(row => runDepartment(env, row, slot)));
      for (const outcome of outcomes) {
        if (outcome.status === "rejected") errors.push(outcome.reason);
      }
    }
    if (slot % 60 === 0) {
      const cutoff = new Date(controller.scheduledTime - RECEIPT_RETENTION_MS).toISOString();
      await env.DB.prepare("DELETE FROM dmsp_pool_receipts WHERE observed_at < ?").bind(cutoff).run();
    }
    if (errors.length) throw new AggregateError(errors, "Failed to persist one or more department receipts");
  },
};
