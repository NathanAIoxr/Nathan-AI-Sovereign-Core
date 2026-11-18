// Nathan AI Communications Bus. Control-plane messages only; no remote command execution.
import { DEFAULT_POLICY, monthlyPacing, parseLocalQuota, scheduleActions } from './capacity-policy.mjs';
const KINDS = new Set(["heartbeat", "status_report", "sync_request", "registry_ping", "ack"]);
const PEERS = new Set(["cloudflare", "github", "chatgpt", "nathan-ai"]);
const BASE = { "cache-control": "no-store", "content-type": "application/json; charset=utf-8" };

function reply(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: BASE });
}
function newMessage(kind, source, destination, payload = {}) {
  return {
    id: crypto.randomUUID(),
    kind, source, destination, payload,
    created_at: new Date().toISOString()
  };
}
async function bearerAuthorized(req, env) {
  if (!env.BRIDGE_TOKEN) return false;
  const expected = new TextEncoder().encode("Bearer " + env.BRIDGE_TOKEN);
  const received = new TextEncoder().encode(req.headers.get("authorization") || "");
  if (received.length !== expected.length) return false;
  let equal = 0;
  for (let i = 0; i < expected.length; i++) equal |= expected[i] ^ received[i];
  return equal === 0;
}
async function totals(db, sql) {
  try {
    const result = await db.prepare(sql).first();
    return result?.total ?? null;
  } catch {
    return null;
  }
}
// Transactional cap on THIS ONE bus only, not a billing/account-wide kill switch.
async function takeBusSlot(env, at) {
  const day = at.toISOString().slice(0, 10);
  const limit = parseLocalQuota(env.LOCAL_QUEUE_MESSAGES_PER_DAY);
  const saved = await env.COMMS_DB.prepare(
    "INSERT INTO local_queue_daily(day_utc,accepted,last_accepted_at) VALUES (?1,1,?2) " +
    "ON CONFLICT(day_utc) DO UPDATE SET accepted=accepted+1,last_accepted_at=excluded.last_accepted_at " +
    "WHERE local_queue_daily.accepted < ?3 RETURNING accepted"
  ).bind(day, at.toISOString(), limit).first();
  return { allowed: Boolean(saved), accepted: saved?.accepted ?? null, day, limit };
}
async function dispatchGithub(env, message) {
  // Optional and disabled until a repository-scoped fine-grained secret is installed.
  if (!env.GITHUB_DISPATCH_TOKEN) return "not_configured";
  const r = await fetch("https://api.github.com/repos/NathanAIoxr/Nathan-AI-Sovereign-Core/dispatches", {
    method: "POST",
    headers: {
      "authorization": "Bearer " + env.GITHUB_DISPATCH_TOKEN,
      "accept": "application/vnd.github+json",
      "content-type": "application/json",
      "user-agent": "Nathan-AI-Communications-Bus"
    },
    body: JSON.stringify({
      event_type: "nathan-bridge-pulse",
      client_payload: { id: message.id, sent_at: message.created_at }
    })
  });
  if (!r.ok) throw new Error("GitHub dispatch failed: HTTP " + r.status);
  return "sent";
}
export default {
  async fetch(request, env) {
    const path = new URL(request.url).pathname;
    if (request.method === "GET" && path === "/v1/status") {
      const total = await totals(env.COMMS_DB, "SELECT COUNT(*) AS total FROM messages");
      const last = await env.COMMS_DB.prepare("SELECT MAX(processed_at) AS last_processed FROM messages").first();
      return reply({
        service: "nathan-ai-comms-bus", version: 1,
        ledger_records: total, last_processed: last?.last_processed ?? null,
        configured: {
          queue: Boolean(env.EVENTS_QUEUE),
          ledger: Boolean(env.COMMS_DB),
          github_to_cloudflare: Boolean(env.BRIDGE_TOKEN),
          cloudflare_to_github: Boolean(env.GITHUB_DISPATCH_TOKEN)
        }
      });
    }
    if (request.method === "GET" && path === "/v1/capacity") {
      const now = new Date();
      const day = now.toISOString().slice(0, 10);
      const policy = parseLocalQuota(env.LOCAL_QUEUE_MESSAGES_PER_DAY);
      const [local, recent, latestUsage] = await Promise.all([
        env.COMMS_DB.prepare("SELECT accepted FROM local_queue_daily WHERE day_utc=?").bind(day).first(),
        env.COMMS_DB.prepare(
          "SELECT bucket_utc,action,state,observed_at FROM scheduler_receipts ORDER BY observed_at DESC LIMIT 4"
        ).all(),
        env.COMMS_DB.prepare(
          "SELECT observed_at,provenance,workers_requests,workers_cpu_ms,queue_operations " +
          "FROM usage_observations ORDER BY observed_at DESC LIMIT 1"
        ).first()
      ]);
      return reply({
        service: "nathan-ai-comms-bus",
        schedule: { cron: "* * * * *", sample_every_minutes: 5, heartbeat_every_minutes: 15 },
        local_bus_quota: {
          day_utc: day, accepted_messages: local?.accepted ?? 0, daily_cap: policy,
          scope: "this Worker only; not account-wide"
        },
        pacing_reference: monthlyPacing({ days: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth()+1, 0)).getUTCDate() }),
        recorded_scheduler_receipts: recent.results || [],
        billing_observation: latestUsage || null,
        billing_permission: "unverified_or_unavailable; no assumption of actual spend",
        warning: "Do not create traffic to meet quotas. No billing usage, cross-worker spending, or zero-overage guarantee is implied."
      });
    }
    if (request.method === "GET" && path === "/v1/registry") {
      const [fleet, slots, imports] = await Promise.all([
        totals(env.FLEET_DB, "SELECT COUNT(*) AS total FROM fleet_entry"),
        totals(env.FLEET_DB, "SELECT COUNT(*) AS total FROM virtual_supercomputer_slot_v1"),
        totals(env.ATLAS_DB, "SELECT COUNT(*) AS total FROM imported_workers")
      ]);
      return reply({ fleet_catalog_entries: fleet, logical_slots: slots, imported_worker_records: imports,
        caveat: "Registry rows are not proof of runtime deployment or physical machines." });
    }
    if (request.method === "GET" && path === "/v1/open-source") {
      const u = new URL(request.url);
      const offset = Number(u.searchParams.get("offset") || "0");
      const safeOffset = Number.isSafeInteger(offset) && offset >= 0 && offset <= 10000 ? offset : 0;
      const category = u.searchParams.get("category");
      let query;
      if (category && category.length <= 100) {
        query = env.ATLAS_DB.prepare(
          "SELECT repo,name,category,url,status FROM global_atlas_public_repos WHERE category=? ORDER BY repo LIMIT 50 OFFSET ?"
        ).bind(category, safeOffset);
      } else {
        query = env.ATLAS_DB.prepare(
          "SELECT repo,name,category,url,status FROM global_atlas_public_repos ORDER BY category,repo LIMIT 50 OFFSET ?"
        ).bind(safeOffset);
      }
      const result = await query.all();
      const counts = await env.ATLAS_DB.prepare(
        "SELECT status,COUNT(*) AS count FROM global_atlas_public_repos GROUP BY status"
      ).all();
      return reply({
        source: "existing_cloudflare_d1_global_atlas_public_repos",
        offset: safeOffset, page_size: 50, entries: result.results || [],
        statuses: counts.results || [],
        caveat: "Open-source references are discovery leads, not installed or authorized remote computers."
      });
    }
    if (path === "/v1/messages" && !await bearerAuthorized(request, env)) {
      return reply({ error: env.BRIDGE_TOKEN ? "unauthorized" : "inbound_token_not_configured" },
        env.BRIDGE_TOKEN ? 401 : 503);
    }
    if (request.method === "GET" && path === "/v1/messages") {
      const rows = await env.COMMS_DB.prepare(
        "SELECT id, kind, source, destination, created_at, processed_at FROM messages ORDER BY processed_at DESC LIMIT 25"
      ).all();
      return reply({ messages: rows.results || [] });
    }
    if (request.method === "POST" && path === "/v1/messages") {
      const raw = await request.text();
      if (raw.length > 4096) return reply({ error: "payload_too_large" }, 413);
      let body;
      try { body = JSON.parse(raw); } catch { return reply({ error: "invalid_json" }, 400); }
      if (!KINDS.has(body.kind) || !PEERS.has(body.source) ||
          !PEERS.has(body.destination) || !body.payload ||
          typeof body.payload !== "object" || Array.isArray(body.payload) ||
          JSON.stringify(body.payload).length > 2048) {
        return reply({ error: "invalid_control_plane_message" }, 400);
      }
      const msg = newMessage(body.kind, body.source, body.destination, body.payload);
      const budget = await takeBusSlot(env, new Date());
      if (!budget.allowed) return reply({
        error: "local_bus_daily_budget_exhausted", day_utc: budget.day, daily_cap: budget.limit
      }, 429);
      await env.EVENTS_QUEUE.send(msg);
      return reply({ accepted: true, id: msg.id, state: "queued_not_yet_processed" }, 202);
    }
    return reply({ error: "not_found" }, 404);
  },
  async scheduled(controller, env) {
    // Called every minute, intentionally no D1/Queue/API work on four out of five ticks.
    const at = new Date(controller.scheduledTime);
    const actions = scheduleActions(controller.scheduledTime);
    if (!actions.sample) return;
    const bucket = at.toISOString().slice(0, 16);
    await env.COMMS_DB.prepare(
      "INSERT OR IGNORE INTO scheduler_receipts(bucket_utc,observed_at,action,state) VALUES (?,?,?,?)"
    ).bind(bucket, new Date().toISOString(), actions.heartbeat ? "heartbeat" : "sample", "scheduled").run();
    if (at.getUTCHours() === 0 && at.getUTCMinutes() === 0) {
      // Retain source messages and catalog records; only prune this new derived telemetry.
      await env.COMMS_DB.prepare(
        "DELETE FROM scheduler_receipts WHERE observed_at < datetime('now','-30 days')"
      ).run();
      await env.COMMS_DB.prepare(
        "DELETE FROM local_queue_daily WHERE day_utc < date('now','-30 days')"
      ).run();
    }
    if (!actions.heartbeat) return;
    const budget = await takeBusSlot(env, at);
    if (!budget.allowed) return; // Preserve headroom instead of generating more work.
    const msg = newMessage("heartbeat", "cloudflare", "github", {
      trigger: "cron", scheduled_at: at.toISOString(), scope: "local_bus"
    });
    await env.EVENTS_QUEUE.send(msg);
    await dispatchGithub(env, msg);
  },
  async queue(batch, env) {
    for (const item of batch.messages) {
      try {
        const msg = item.body;
        if (!msg || !KINDS.has(msg.kind) || !PEERS.has(msg.source) ||
            !PEERS.has(msg.destination) || typeof msg.id !== "string") {
          item.ack(); // Reject malformed messages; never execute their contents.
          continue;
        }
        await env.COMMS_DB.prepare(
          "INSERT OR IGNORE INTO messages (id,kind,source,destination,created_at,payload_json,processed_at) VALUES (?,?,?,?,?,?,?)"
        ).bind(msg.id, msg.kind, msg.source, msg.destination, msg.created_at,
          JSON.stringify(msg.payload ?? {}), new Date().toISOString()).run();
        item.ack();
      } catch {
        item.retry();
      }
    }
  }
};