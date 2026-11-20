// Nathan Tabor Autonomous Sovereign Engine · node template and receipt store.
export function createNodeTemplate() {
  const base = "/api/node-template";
  const operatorBase = "/cheironomer/operator/node-template";
  const operations = Object.freeze({
    ingestion: "Self-Populating",
    creation: "Self-Creating",
    "ci-repair": "Self-Healing",
    "defensive-validation": "Self-Testing",
    benchmark: "Self-Optimizing",
    provenance: "Self-Documenting",
  });
  // SQL identifiers are fixed here. A caller supplies only a bound record ID.
  const sources = Object.freeze({
    runtime: ["NODE_FLEET_READ", "owned_runtime_registry", "record_key", "state", "state <> 'missing'"],
    fleet: ["NODE_FLEET_READ", "fleet_entry", "id", "source_state", "source_state <> 'awaiting_source'"],
    supernode: ["NODE_CORE_READ", "supernode_registry", "logical_address", "'registered'", "1"],
    compute: ["NODE_COMPUTE_READ", "tabor_compute_fleet", "node_id", "verification_state", "1"],
    infrastructure: ["NODE_COMPUTE_READ", "tabor_infrastructure_nodes", "node_id", "operational_status", "1"],
    "rotational-agent": ["NODE_COMPUTE_READ", "nathan_rotational_agents", "id", "state", "1"],
    backend: ["NODE_COMPUTE_READ", "nathan_backends", "id", "CASE enabled WHEN 1 THEN 'enabled' ELSE 'disabled' END", "enabled = 1"],
    supercomputer: ["NODE_COMPUTE_READ", "supercomputer_registry", "id", "status", "1"],
  });
  const version = "1.0.0";
  const shaPattern = /^[0-9a-f]{64}$/;
  const revisionPattern = /^[0-9a-f]{40}$/;
  const idPattern = /^[A-Za-z0-9][A-Za-z0-9:_./@-]{0,199}$/;
  const eventPattern = /^[A-Za-z0-9][A-Za-z0-9:_-]{0,79}$/;
  const keyPrefix = "node-template/pending/v1/";
  const encoder = new TextEncoder();
  const decoder = new TextDecoder("utf-8", { fatal: true });
  const hash = async value => Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", encoder.encode(value))),
    byte => byte.toString(16).padStart(2, "0")).join("");

  function normalize(input) {
    if (!input || typeof input !== "object" || Array.isArray(input)) return null;
    const { source, node, event_id, operation, outcome, evidence, revision = null } = input;
    if (Object.keys(input).some(key => !["source", "node", "event_id", "operation", "outcome", "evidence", "revision"].includes(key))
      || typeof source !== "string" || !Object.hasOwn(sources, source)
      || typeof node !== "string" || !idPattern.test(node)
      || typeof event_id !== "string" || !eventPattern.test(event_id)
      || typeof operation !== "string" || !Object.hasOwn(operations, operation)
      || !["verified", "discarded", "review-required"].includes(outcome)
      || typeof evidence !== "string" || !shaPattern.test(evidence)
      || revision !== null && (typeof revision !== "string" || !revisionPattern.test(revision))) return null;
    return { source, node, event_id, operation, outcome, evidence, revision };
  }

  function roster(env, source) {
    const [binding, table, column, state, where] = sources[source];
    return { db: env[binding], table, column, state, where };
  }

  async function lookup(env, { source, node }) {
    const { db, table, column, state, where } = roster(env, source);
    if ((source === "fleet" || source === "supernode") && !/^[1-9][0-9]{0,8}$/.test(node)) return null;
    return db.prepare(`SELECT ${state} AS state FROM ${table} WHERE ${column} = ? AND (${where})`).bind(node).first();
  }

  async function status(env) {
    await Promise.all(Object.keys(sources).map(source => {
      const { db, table, column } = roster(env, source);
      return db.prepare(`SELECT ${column} FROM ${table} LIMIT 0`).all();
    }));
    await env.LEDGER.prepare("SELECT event_id FROM node_template_receipts LIMIT 0").all();
    if (!env.AUDIT || typeof env.AUDIT.put !== "function") throw Error("overflow_unbound");
  }

  async function persist(env, receipt, digest) {
    const { source, node, event_id, operation, outcome, evidence, revision } = receipt;
    const result = await env.LEDGER.prepare(`INSERT INTO node_template_receipts
      (source,node,event_id,digest,operation,outcome,evidence,revision) VALUES (?,?,?,?,?,?,?,?)
      ON CONFLICT(source,node,event_id) DO NOTHING`).bind(source,node,event_id,digest,operation,outcome,evidence,revision).run();
    if (result.meta.changes) return { status: 201, body: { state: "recorded", digest } };
    const prior = await env.LEDGER.prepare("SELECT digest FROM node_template_receipts WHERE source=? AND node=? AND event_id=?")
      .bind(source,node,event_id).first();
    return prior?.digest === digest ? { status: 200, body: { state: "replayed", digest } }
      : { status: 409, body: { error: "event_id_conflict" } };
  }

  async function overflow(env, receipt, digest) {
    const identity = await hash(JSON.stringify([receipt.source, receipt.node, receipt.event_id]));
    const key = keyPrefix + identity + "/" + digest + ".json";
    // A digest-keyed write is retryable even under concurrent delivery. The ledger owns event-ID conflict decisions.
    const object = await env.AUDIT.put(key, JSON.stringify(receipt), {
      onlyIf: { etagDoesNotMatch: "*" },
      httpMetadata: { contentType: "application/json" },
    });
    if (!object && !await env.AUDIT.head(key)) throw Error("overflow_unconfirmed");
    return { status: 202, body: { state: "pending", digest, key } };
  }

  function signingKey(env, use) {
    const secret = env.NODE_TEMPLATE_SIGNING_KEY;
    if (typeof secret !== "string" || secret.length < 32) throw Error("node_signing_unbound");
    return crypto.subtle.importKey("raw", encoder.encode(secret), {name: "HMAC", hash: "SHA-256"}, false, [use]);
  }

  async function issue(env, source, node, now) {
    const expires = now + 3600;
    const data = encoder.encode(JSON.stringify({source,node,expires}));
    const encoded = btoa(String.fromCharCode(...data)).replace(/=+$/, "").replaceAll("+","-").replaceAll("/","_");
    const signature = await crypto.subtle.sign("HMAC", await signingKey(env,"sign"), encoder.encode("node-template/v1." + encoded));
    const suffix = Array.from(new Uint8Array(signature), byte => byte.toString(16).padStart(2,"0")).join("");
    return { bearer: encoded + "." + suffix, expires };
  }

  async function nodeCredential(request, env, input) {
    const token = request.headers.get("authorization")?.match(/^Bearer ([a-zA-Z0-9_-]{1,512})\.([a-f0-9]{64})$/);
    if (!token || !input) return false;
    try {
      const [, encoded, signature] = token;
      const sig = Uint8Array.from(signature.match(/../g), value => parseInt(value, 16));
      const ok = await crypto.subtle.verify("HMAC", await signingKey(env,"verify"),sig,encoder.encode("node-template/v1." + encoded));
      if (!ok) return false;
      const data = Uint8Array.from(atob(encoded.replaceAll("-","+").replaceAll("_","/")), ch => ch.charCodeAt(0));
      const {source,node,expires} = JSON.parse(decoder.decode(data));
      return source === input.source && node === input.node && Number.isSafeInteger(expires) && expires > Date.now()/1000;
    } catch { return false; }
  }

  function response(request, data, status = 200) {
    const options = { status, headers: { "cache-control": "no-store", "x-content-type-options": "nosniff", "content-type": "application/json" } };
    return new Response(request.method === "HEAD" ? null : JSON.stringify(data), options);
  }

  async function route(request, env, path, { operator, limitedBody }) {
    if (!path.startsWith(base + "/") && !path.startsWith(operatorBase + "/")) return null;
    if (request.method === "GET" || request.method === "HEAD") {
      if (path === base + "/contract") return response(request, { version, architect: 'John "Nathan" Tabor',
        loops: operations, registries: Object.keys(sources), coordinates: ["1 + 1 = 2", "1 - 1 = 0", "1 × 1 = 1", "1 ÷ 1 = 1"],
        submit: base + "/receipts", issueCredential: operatorBase + "/credential", replay: operatorBase + "/replay", releaseGate: "/api/release-gate/evaluate" });
      if (path === base + "/health") {
        try { await status(env); await signingKey(env,"verify"); return response(request, { version, ready: true, registrySources: Object.keys(sources) }); }
        catch { return response(request, { version, ready: false }, 503); }
      }
    }
    const operatorRoute = [operatorBase + "/receipts", operatorBase + "/replay", operatorBase + "/credential"].includes(path);
    if (!operatorRoute && path !== base + "/receipts") {
      return response(request, { error: "not_found" }, 404);
    }
    if (request.method !== "POST") return response(request, { error: "method_not_allowed" }, 405);
    if (operatorRoute && !await operator(request, env)) return response(request, { error: "operator_required" }, 401);
    if (request.headers.get("content-type")?.split(";")[0].trim().toLowerCase() !== "application/json") {
      return response(request, { error: "expected_json" }, 415);
    }
    let input;
    try { input = JSON.parse(decoder.decode(await limitedBody(request, 4096))); }
    catch (error) { return response(request, { error: error instanceof RangeError ? "too_large" : "invalid_json" },
      error instanceof RangeError ? 413 : 400); }
    try {
      if (!operatorRoute && !await nodeCredential(request, env, input)) {
        return response(request, { error: "node_credential_required" }, 401);
      }
      if (path.endsWith("/credential")) {
        const {source,node} = input ?? {};
        if (typeof source !== "string" || !Object.hasOwn(sources,source) || typeof node !== "string" || !idPattern.test(node)) {
          return response(request, { error: "invalid_node" }, 400);
        }
        if (!await lookup(env, {source,node})) return response(request, { error: "registered_node_required" }, 422);
        return response(request, await issue(env,source,node,Math.floor(Date.now()/1000)), 201);
      }
      const replay = path.endsWith("/replay");
      let receipt;
      let key;
      if (replay) {
        key = input?.key;
        if (typeof key !== "string" || !/^node-template\/pending\/v1\/[a-f0-9]{64}\/[a-f0-9]{64}\.json$/.test(key)) {
          return response(request, { error: "invalid_key" }, 400);
        }
        const obj = await env.AUDIT.get(key);
        if (!obj) return response(request, { error: "pending_not_found" }, 404);
        if (obj.size > 4096) return response(request, { error: "invalid_pending_receipt" }, 422);
        receipt = normalize(await obj.json());
      } else {
        receipt = normalize(input);
      }
      if (!receipt) return response(request, { error: "invalid_receipt" }, 400);
      const digest = await hash(JSON.stringify(receipt));
      if (replay) {
        const identity = await hash(JSON.stringify([receipt.source, receipt.node, receipt.event_id]));
        if (key !== keyPrefix + identity + "/" + digest + ".json") return response(request, { error: "pending_digest_mismatch" }, 422);
      }
      if (!await lookup(env, receipt)) return response(request, { error: "registered_node_required" }, 422);
      let result;
      try { result = await persist(env, receipt, digest); }
      catch (error) {
        if (replay || !/quota|limit|overload|temporar|timeout|busy|unavailable|D1_ERROR.*(?:internal|reset)/i.test(String(error))) throw error;
        result = await overflow(env, receipt, digest);
      }
      return response(request, result.body, result.status);
    } catch {
      return response(request, { error: "temporarily_unavailable" }, 503);
    }
  }
  return { normalize, route, version };
}

export const nodeTemplate = createNodeTemplate();
