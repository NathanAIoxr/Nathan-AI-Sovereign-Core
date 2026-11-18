// Nathan AI Communications Bus. Control-plane messages only; no remote command execution.
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
    if (request.method === "GET" && path === "/v1/registry") {
      const [fleet, slots, imports] = await Promise.all([
        totals(env.FLEET_DB, "SELECT COUNT(*) AS total FROM fleet_entry"),
        totals(env.FLEET_DB, "SELECT COUNT(*) AS total FROM virtual_supercomputer_slot_v1"),
        totals(env.ATLAS_DB, "SELECT COUNT(*) AS total FROM imported_workers")
      ]);
      return reply({ fleet_catalog_entries: fleet, logical_slots: slots, imported_worker_records: imports,
        caveat: "Registry rows are not proof of runtime deployment or physical machines." });
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
      await env.EVENTS_QUEUE.send(msg);
      return reply({ accepted: true, id: msg.id, state: "queued_not_yet_processed" }, 202);
    }
    return reply({ error: "not_found" }, 404);
  },
  async scheduled(controller, env) {
    const msg = newMessage("heartbeat", "cloudflare", "github", {
      trigger: "cron", scheduled_at: new Date(controller.scheduledTime).toISOString()
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