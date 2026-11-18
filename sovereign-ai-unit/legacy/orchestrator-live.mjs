var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// ../shared/protocol.ts
var model = "@cf/meta/llama-3.1-8b-instruct-fp8";
var clearingEquation = "1 - 1 = 0";
var compoundingEquation = "1 + 1 = 2";
var requestIdPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
function json(data, status = 200, headers = {}) {
  return Response.json(data, {
    status,
    headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff", ...headers }
  });
}
__name(json, "json");
function cleared(error, status, headers) {
  return json({ box: 0, equation: clearingEquation, error }, status, headers);
}
__name(cleared, "cleared");
async function digest(text) {
  return crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
}
__name(digest, "digest");
async function sha256(text) {
  return Array.from(new Uint8Array(await digest(text)), (byte) => byte.toString(16).padStart(2, "0")).join("");
}
__name(sha256, "sha256");

// tensor-edge.ts
async function infer(ai, input) {
  const output = await ai.run(model, { prompt: input, max_tokens: 512 });
  if (output === null || typeof output !== "object" || !("response" in output) || typeof output.response !== "string" || !output.response.trim()) {
    throw new Error("The inference result did not contain text.");
  }
  return output.response;
}
__name(infer, "infer");

// ../will-wheel-way/will-wheel-way.ts
var wTriplet = ["Will", "Wheel", "Way"];
var relationships = [
  ["Will", "Wheel", "Resolve intent to a supported execution mechanism."],
  ["Will", "Way", "Resolve intent to the allowed service route."],
  ["Wheel", "Will", "Feed execution telemetry back as a proposal for a later directive."],
  ["Wheel", "Way", "Associate the selected mechanism with its service route."],
  ["Way", "Will", "Feed route outcomes back as evidence for a later directive."],
  ["Way", "Wheel", "Resolve an available route to its supported mechanism."],
  ["Will", "Will", "Bind the directive to the request ID and its input hash."],
  ["Wheel", "Wheel", "Bind execution to the selected backend and model."],
  ["Way", "Way", "Bind the request to the selected private service route."]
];
var wMatrix = relationships.map(([from, to, meaning]) => ({
  from,
  to,
  equation: `${from} = ${to}`,
  meaning
}));
var route = [
  ["Will", "Will", "Anchor the directive"],
  ["Will", "Wheel", "Select the compute mechanism"],
  ["Wheel", "Way", "Associate the mechanism with its route"],
  ["Way", "Way", "Check the selected route"],
  ["Way", "Wheel", "Resolve the available compute mechanism"],
  ["Wheel", "Wheel", "Confirm the chosen backend"],
  ["Wheel", "Will", "Return compute evidence"],
  ["Way", "Will", "Return route evidence"],
  ["Will", "Way", "Carry the directive into the execution path"]
];
var wCycle = route.map(([from, to, purpose], order) => ({
  step: order + 1,
  from,
  to,
  equation: `${from} = ${to}`,
  purpose
}));
function wPlan(requestId, inputHash, backend, route2) {
  return {
    Will: { request_id: requestId, input_hash: inputHash },
    Wheel: { backend },
    Way: { route: route2 }
  };
}
__name(wPlan, "wPlan");

// ../will-wheel-way/mill-mheel-may.ts
var mirrors = { Will: "Mill", Wheel: "Mheel", Way: "May" };
var mTriplet = wTriplet.map((name) => mirrors[name]);
var meanings = {
  Mill: "Grinding grits. Prepare and fingerprint the normalized input.",
  Mheel: "My Heel in the door. Hold the compute slot with an expiring reservation.",
  May: "May showers, spring flowers, and May I? Check admission before execution."
};
var mMatrix = wMatrix.map(({ from, to }) => {
  const source = mirrors[from];
  const target = mirrors[to];
  return { from: source, to: target, equation: `${source} = ${target}` };
});
var mCycle = wCycle.map(({ step, from, to }) => {
  const source = mirrors[from];
  const target = mirrors[to];
  return { step, from: source, to: target, equation: `${source} = ${target}` };
});
var mRoles = mTriplet.map((name) => ({ name, meaning: meanings[name] }));
function wToM(text) {
  return text.replace(/[Ww]/g, (letter) => letter === "W" ? "M" : "m");
}
__name(wToM, "wToM");
function mayI(inputHash, leaseExpiresAt, checkedAt) {
  const checks = {
    mill: /^[0-9a-f]{64}$/.test(inputHash),
    mheel: Number.isSafeInteger(leaseExpiresAt) && checkedAt < leaseExpiresAt
  };
  const reason = !checks.mill ? "invalid_input_hash" : "lease_expired";
  return {
    question: "May I?",
    allowed: checks.mill && checks.mheel,
    checks,
    checked_at: checkedAt,
    reason: checks.mill && checks.mheel ? null : reason
  };
}
__name(mayI, "mayI");

// ../will-wheel-way/cycle.ts
var version = "1.0";
var twinCycle = [
  { from: "Will", to: "Mill", meaning: "Prepare the input bound to the directive." },
  { from: "Mill", to: "Mheel", meaning: "Pair the prepared input with its reserved compute slot." },
  { from: "Mheel", to: "Wheel", meaning: "Carry the reservation into the selected execution mechanism." },
  { from: "Wheel", to: "Way", meaning: "Use the private route associated with the mechanism." },
  { from: "Way", to: "May", meaning: "Check admission on the route before running the job." },
  { from: "May", to: "Will", meaning: "Send the execution outcome and output hash back to the directive's receipt." }
].map(({ from, to, meaning }, index) => ({
  step: index + 1,
  from,
  to,
  equation: `${from} = ${to}`,
  meaning
}));
var architecture = {
  contract: "Will = Wheel = Way / Mill = Mheel = May",
  version,
  implementation: "Software orchestration",
  w_engine: { triplet: wTriplet, matrix: wMatrix, cycle: wCycle },
  m_engine: { triplet: mTriplet, matrix: mMatrix, cycle: mCycle, roles: mRoles, letter_shift: wToM("WILL / WHEEL / WAY") },
  twins: wTriplet.map((node) => ({ w: node, m: mirrors[node] })),
  unified_cycle: twinCycle,
  box_0: { equation: "1 - 1 = 0", responsibilities: ["authentication", "rate limit", "input preparation", "temporary state"] },
  box_1: { equation: "1 + 1 = 2", responsibilities: ["reservation", "May I?", "inference", "ledger receipt"] },
  preview: { accepted: "/will-wheel-way/preview", expired: "/will-wheel-way/preview?case=expired-lease" }
};
function prepareCycle(options) {
  const { requestId, inputHash, backend, route: route2, leaseExpiresAt, checkedAt } = options;
  return {
    contract_version: version,
    w: wPlan(requestId, inputHash, backend, route2),
    m: {
      Mill: { normalized_input_hash: inputHash },
      Mheel: { request_id: requestId, lease_expires_at: leaseExpiresAt },
      May: mayI(inputHash, leaseExpiresAt, checkedAt)
    }
  };
}
__name(prepareCycle, "prepareCycle");
function finishCycle(plan, outputHash, finishedAt) {
  return {
    ...plan,
    outcome: { output_hash: outputHash, finished_at: finishedAt }
  };
}
__name(finishCycle, "finishCycle");

// orchestrator.ts
var leaseMs = 10 * 60 * 1e3;
async function readLedger(db, requestId) {
  return db.prepare(`SELECT request_id, axiom AS equation, input_hash, output_hash,
    model, output_payload AS result, created_at, will_wheel_way_receipt
    FROM sovereign_ledger WHERE request_id = ?`).bind(requestId).first();
}
__name(readLedger, "readLedger");
function replay(saved, expectedHash) {
  if (saved.input_hash !== expectedHash) return cleared("This request UUID belongs to a different input.", 409);
  const { will_wheel_way_receipt: receipt, ...record } = saved;
  return json({
    box: 1,
    ...record,
    source: "ledger",
    ...receipt ? { will_wheel_way: JSON.parse(receipt) } : {}
  });
}
__name(replay, "replay");
async function compute({ input, requestId }, { BOX_1_LEDGER: db, AI }) {
  const inputHash = await sha256(input);
  const existing = await readLedger(db, requestId);
  if (existing) return replay(existing, inputHash);
  const token = crypto.randomUUID();
  const start = Date.now();
  const leaseExpiresAt = start + leaseMs;
  const claim = await db.prepare(`INSERT INTO compute_leases (request_id, lease_token, expires_at)
      SELECT ?, ?, ? WHERE NOT EXISTS (SELECT 1 FROM sovereign_ledger WHERE request_id = ?)
      ON CONFLICT (request_id) DO UPDATE SET lease_token = excluded.lease_token, expires_at = excluded.expires_at
      WHERE compute_leases.expires_at <= ?`).bind(requestId, token, leaseExpiresAt, requestId, start).run();
  if (claim.meta.changes === 0) {
    const saved = await readLedger(db, requestId);
    return saved ? replay(saved, inputHash) : cleared("The request is in progress. Retry with the same UUID.", 409, { "Retry-After": "2" });
  }
  const release = db.prepare("DELETE FROM compute_leases WHERE request_id = ? AND lease_token = ?").bind(requestId, token);
  try {
    const plan = prepareCycle({
      requestId,
      inputHash,
      backend: model,
      route: "Box 0 \u2192 Box 1 via service binding",
      leaseExpiresAt,
      checkedAt: Date.now()
    });
    if (!plan.m.May.allowed) {
      await release.run();
      return cleared("May I? denied the compute reservation. Retry with the same UUID.", 503);
    }
    const output = await infer(AI, input);
    const outputHash = await sha256(output);
    const createdAt = Date.now();
    const receipt = finishCycle(plan, outputHash, createdAt);
    const [commit] = await db.batch([
      db.prepare(`INSERT INTO sovereign_ledger (request_id, input_hash, output_hash, output_payload, model, created_at, will_wheel_way_receipt)
        SELECT request_id, ?, ?, ?, ?, ?, ? FROM compute_leases
        WHERE request_id = ? AND lease_token = ? AND expires_at > ?
        ON CONFLICT (request_id) DO NOTHING`).bind(inputHash, outputHash, output, model, createdAt, JSON.stringify(receipt), requestId, token, createdAt),
      release
    ]);
    if (commit.meta.changes === 0) {
      const saved = await readLedger(db, requestId);
      return saved ? replay(saved, inputHash) : cleared("Compute reservation expired. Retry with the same UUID.", 503);
    }
    return json({
      box: 1,
      equation: compoundingEquation,
      request_id: requestId,
      input_hash: inputHash,
      output_hash: outputHash,
      model,
      result: output,
      created_at: createdAt,
      will_wheel_way: receipt
    }, 201);
  } catch {
    try {
      await release.run();
    } catch {
      console.warn(JSON.stringify({ event: "lease_release_failed", request_id: requestId }));
    }
    throw new Error("Compute or ledger commit failed.");
  }
}
__name(compute, "compute");
var orchestrator_default = {
  async fetch(request, env) {
    const { origin, pathname } = new URL(request.url);
    if (origin !== "https://box-one") return cleared("Route not found.", 404);
    try {
      if (request.method === "GET" && pathname === "/health") {
        await env.BOX_1_LEDGER.batch([
          env.BOX_1_LEDGER.prepare("SELECT request_id, will_wheel_way_receipt FROM sovereign_ledger LIMIT 1"),
          env.BOX_1_LEDGER.prepare("SELECT request_id FROM compute_leases LIMIT 1")
        ]);
        return json({ status: "ready", model });
      }
      if (request.method === "POST" && pathname === "/maintenance") {
        const deleted = await env.BOX_1_LEDGER.prepare(`DELETE FROM compute_leases
          WHERE request_id IN (SELECT request_id FROM compute_leases WHERE expires_at <= ?
            ORDER BY expires_at LIMIT 1000)`).bind(Date.now()).run();
        return json({ expired_leases_cleared: deleted.meta.changes });
      }
      if (request.method === "POST" && pathname === "/compute") {
        const value = await request.json();
        if (!value || typeof value.requestId !== "string" || !requestIdPattern.test(value.requestId) || typeof value.input !== "string" || !value.input.trim() || value.input.length > 4e3) {
          return cleared("Invalid internal compute request.", 400);
        }
        return await compute(value, env);
      }
      return cleared("Route not found.", 404);
    } catch {
      console.error(JSON.stringify({ event: "compute_worker_error", method: request.method, route: pathname }));
      return cleared("Compute service unavailable. Retry with the same UUID.", 503);
    }
  }
};
export {
  orchestrator_default as default
};

