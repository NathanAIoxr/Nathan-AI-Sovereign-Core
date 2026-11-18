import { BANK_SHARDS, BANK_TERMS, MAX_SHARDS, MAX_TERMS, runFp64, sha256 } from "./compute.mjs";
import { FABRIC_SHARD_TERMS, FABRIC_SHARDS, FABRIC_TERMS, runFabric } from "./fabric.mjs";
import { AXIOMS, addressSpace, archiveSnapshot, auditSnapshot, catalog, cicadas, claimSupernode, intake, willWheelWay, words } from "./ledger.mjs";
import { page, styles, browser, godtabor } from "./site.mjs";

const RESPONSE_HEADERS = { "cache-control": "no-store", "x-content-type-options": "nosniff" };
const CSP = "default-src 'none'; style-src 'self'; script-src 'self'; connect-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'";
const ROOT = "https://nathan-ai-sovereign-2x.nathantaboract.workers.dev";
const json = (data, status = 200) => Response.json(data, { status, headers: RESPONSE_HEADERS });
const response = (body, mime) => new Response(body, {
  headers: { ...RESPONSE_HEADERS, "content-security-policy": CSP, "content-type": mime + "; charset=utf-8" },
});
const benchmarks = [
  { name: "LineShine", metric: "HPL Rmax (EFLOP/s)", baseline: 2.1984, target: 4.3968, measured: null },
  { name: "El Capitan", metric: "HPL Rmax (EFLOP/s)", baseline: 1.809, target: 3.618, measured: null },
  { name: "Zettascale", metric: "ZFLOP/s design reference", baseline: 1, target: 2, measured: null },
  { name: "Quantum-classical routing", metric: "Directional levels", baseline: 33, target: 66, measured: null },
  { name: "Photonics and neuromorphic fabric", metric: "Efficiency multiplier", baseline: 1, target: 2, measured: null },
];
const aggregateReference = {
  source: "https://www.top500.org/lists/top500/2026/11/highs/",
  edition: "November 2026", systems: 500, metric: "Sum of listed HPL Rmax results", eflop_s: 19.71,
  milestone: "A single sustained HPL run above the published aggregate",
};
const network = [
  ["FP64 Cluster", ROOT + "/cluster"],
  ["Tabor World Hub", "https://tabor-world-hub.nathantaboract.workers.dev/"],
  ["True Cloud Computing", "https://tabor-true-cloud-computing.nathantaboract.workers.dev/"],
  ["Sovereign AI Unit", "https://sovereign-ai-unit.nathantaboract.workers.dev/platform"],
  ["Tabor Rhythm Matrix", "https://tabor-rhythm-matrix.nathantaboract.workers.dev/"],
];

function uint(params, key, fallback) {
  const values = params.getAll(key);
  if (!values.length) return fallback;
  if (values.length !== 1 || !/^\d{1,10}$/.test(values[0])) throw new RangeError("Use one valid number for " + key + ".");
  return Number(values[0]);
}

async function bodyJson(request) {
  const reader = request.body?.getReader();
  const decoder = new TextDecoder("utf-8", { fatal: true });
  let size = 0;
  let text = "";
  try {
    while (reader) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 65536) {
        await reader.cancel();
        throw new Error("size");
      }
      text += decoder.decode(value, { stream: true });
    }
    const body = JSON.parse(text + decoder.decode());
    if (!body || typeof body !== "object" || Array.isArray(body)) throw new Error("shape");
    return body;
  } catch {
    throw new RangeError("Send a UTF-8 JSON object up to 64 KiB.");
  }
}

async function authorized(request, secret) {
  const match = /^Bearer ([!-~]{24,256})$/.exec(request.headers.get("authorization") ?? "");
  if (!match || typeof secret !== "string" || secret.length < 24) return false;
  const [expected, actual] = await Promise.all([sha256(secret), sha256(match[1])]);
  let different = 0;
  for (let index = 0; index < expected.length; index += 1) different |= expected.charCodeAt(index) ^ actual.charCodeAt(index);
  return different === 0;
}

async function mirrorStatus(db, bucket) {
  const [pending, snapshot] = await db.batch([
    db.prepare(`SELECT direction, count(*) AS count FROM axis_dual_bus GROUP BY direction`),
    db.prepare(`SELECT snapshot_id, row_count, root_hash, created_at, r2_key
      FROM database_snapshots ORDER BY created_at DESC, snapshot_id DESC LIMIT 1`),
  ]);
  return {
    rows: Object.fromEntries(pending.results.map(row => [row.direction, row.count])),
    latest_snapshot: snapshot.results[0] ?? null,
    r2_bound: Boolean(bucket), audit_interval_hours: 6,
  };
}

async function ownerRoute(request, env, path) {
  if (!(await authorized(request, env.OWNER_TOKEN))) return json({ error: "Owner authorization required" }, 401);
  if (request.method !== "POST") return json({ error: "POST required" }, 405);
  if (path === "/api/intake") return json(await intake(env.SOVEREIGN_DB, await bodyJson(request)));
  if (path === "/api/supernodes/claim") {
    const result = await claimSupernode(env.SOVEREIGN_DB, (await bodyJson(request)).record_id);
    return json(result, result.status === "REGISTERED" ? 200 : 409);
  }
  if (path === "/api/snapshot") {
    const result = await auditSnapshot(env.SOVEREIGN_DB);
    return json(result);
  }
  const id = (await bodyJson(request)).snapshot_id;
  if (typeof id !== "string" || !/^[\da-f]{8}-(?:[\da-f]{4}-){3}[\da-f]{12}$/.test(id)) {
    throw new RangeError("Enter a snapshot UUID.");
  }
  const result = await archiveSnapshot(env.SOVEREIGN_DB, env.VAULT_R2, id);
  return json(result, { ARCHIVED: 200, SNAPSHOT_UNKNOWN: 404, R2_UNAVAILABLE: 503 }[result.status]);
}

export default {
  async fetch(request, env) {
    const { pathname: path, searchParams: params } = new URL(request.url);
    try {
      if (["/api/intake", "/api/snapshot", "/api/snapshot/archive", "/api/supernodes/claim"].includes(path)) {
        return await ownerRoute(request, env, path);
      }
      if (path === "/api/words") {
        if (request.method !== "POST") return json({ error: "POST required" }, 405);
        return json(await words((await bodyJson(request)).text));
      }
      if (request.method !== "GET") return json({ error: "GET required" }, 405);
      if (path === "/") return response(page, "text/html");
      if (path === "/godtabor" || path === "/godtabor.html") return response(godtabor, "text/html");
      if (path === "/site.css") return response(styles, "text/css");
      if (path === "/site.js") return response(browser, "application/javascript");
      if (path === "/health") return json({ system: "NATHAN AI 🚀 & NATHAN TABOR 2X+ SOVEREIGN SUPERCOMPUTER", axioms: AXIOMS });
      if (path === "/api/architecture") return json({
        axioms: AXIOMS, benchmarks, benchmark_source: "https://top500.org/lists/top500/list/2026/11/?page=1",
        fp64: {
          baseline: { terms: BANK_TERMS, shards: BANK_SHARDS },
          extended: { terms: MAX_TERMS, shards: MAX_SHARDS },
          fabric: { terms: FABRIC_TERMS, shards: FABRIC_SHARDS, terms_per_shard: FABRIC_SHARD_TERMS },
        },
        aggregate_hpl_reference: aggregateReference,
        address_space: addressSpace, network,
      });
      if (path === "/api/registry") return json(await catalog(env.SOVEREIGN_DB));
      if (path === "/api/route") return json(willWheelWay(params.get("from") ?? "Will", params.get("to") ?? "Way"));
      if (path === "/api/rhythm") return json(cicadas(uint(params, "year", 2024), uint(params, "span", 221)));
      if (path === "/api/mirror/status") return json(await mirrorStatus(env.SOVEREIGN_DB, env.VAULT_R2));
      if (path === "/api/fp64/run") {
        const profiles = params.getAll("profile");
        const profile = profiles[0] ?? "classic";
        if (profiles.length > 1 || !["classic", "fabric"].includes(profile)) throw new RangeError("Choose classic or fabric.");
        const wide = profile === "fabric";
        const terms = uint(params, "terms", wide ? FABRIC_TERMS : MAX_TERMS);
        const shards = uint(params, "shards", wide ? FABRIC_SHARDS : MAX_SHARDS);
        const seed = uint(params, "seed", 73);
        return json(wide ? await runFabric(env.FABRIC_EXECUTOR, { seed, terms, shards })
          : await runFp64(env.EXECUTOR, { seed, terms, shards }));
      }
      const upstream = { "/api/cluster/services": "/api/cluster/services",
        "/api/cluster/receipts": "/api/cluster/receipts", "/api/compute/manifest": "/api/compute/manifest" }[path];
      if (upstream) {
        const result = await env.CORE.fetch(ROOT + upstream);
        return json(await result.json(), result.status);
      }
      return json({ error: "Route not found" }, 404);
    } catch (error) {
      if (error instanceof RangeError) return json({ error: error.message }, 400);
      console.error("Sovereign Core route failed", path, error.name);
      return json({ error: "Service unavailable" }, 503);
    }
  },
  async scheduled(_event, env) {
    const result = await auditSnapshot(env.SOVEREIGN_DB);
    if (result.snapshot_id && env.VAULT_R2) {
      await archiveSnapshot(env.SOVEREIGN_DB, env.VAULT_R2, result.snapshot_id);
    }
  },
};
