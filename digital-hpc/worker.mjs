import { architecture, digest, expectedSum, fixture, scale, systems, termsPerShard, vote } from "./model.mjs";

const headers = { "cache-control": "no-store", "x-content-type-options": "nosniff" };
const json = (data, status = 200) => Response.json(data, { status, headers });
const systemMap = new Map(systems.map((system) => [system.id, system]));
const checkpoint = "fixtures/v1/checkpoint.json";

async function run(executor, count) {
  const start = Date.now();
  const parts = await Promise.all(Array.from({ length: count }, async (_, index) => {
    const result = await executor.fetch(`https://digital-hpc-executor.internal/shard/${index}`);
    if (!result.ok) throw new Error("Executor did not complete shard");
    const row = await result.json();
    if (row.index !== index || row.terms !== termsPerShard || row.sum !== expectedSum(index)) {
      throw new Error("Shard validation failed");
    }
    return row;
  }));
  return {
    shards: count, terms: count * termsPerShard, algorithmOperations: count * termsPerShard * 2,
    sum: parts.reduce((sum, part) => sum + part.sum, 0), wallMs: Date.now() - start, parts, verified: true
  };
}

async function readD1(env) {
  const query = (db) => db.prepare("SELECT codec, body FROM checkpoint WHERE key = ?").bind(checkpoint).first();
  const [warm, archive] = await Promise.all([query(env.CHECKPOINTS), query(env.ARCHIVE)]);
  if (warm?.codec !== "json" || archive?.codec !== "gzip-base64") return null;
  const compressed = Uint8Array.from(atob(archive.body), (c) => c.charCodeAt(0));
  return { canonical: warm.body, compressed, storage: "separate D1 databases" };
}

async function readR2(env) {
  const [warm, archive] = await Promise.all([env.WARM_OBJECTS.get(checkpoint), env.COLD_OBJECTS.get(checkpoint + ".gz")]);
  if (!warm || !archive) return null;
  const [canonical, bytes] = await Promise.all([warm.text(), archive.arrayBuffer()]);
  return { canonical, compressed: new Uint8Array(bytes), storage: "Cloudflare R2",
    classes: { checkpoint: warm.storageClass, archive: archive.storageClass } };
}

async function restore(env, storage) {
  if (storage !== "r2" && storage !== "d1") return json({ error: "Unknown checkpoint storage" }, 400);
  const copies = storage === "r2" ? await readR2(env) : await readD1(env);
  if (!copies) return json({ error: "Checkpoint copy missing" }, 503);
  const { canonical, compressed, ...details } = copies;
  const stream = new Blob([compressed]).stream().pipeThrough(new DecompressionStream("gzip"));
  const restoredText = await new Response(stream).text();
  const expected = await digest(fixture);
  const sha256 = await digest(restoredText);
  if (sha256 !== expected || await digest(canonical) !== expected) {
    return json({ error: "Checkpoint integrity verification failed" }, 503);
  }
  return json({ verified: true, sha256, compressedBytes: compressed.byteLength, checkpoint,
    ...details, restored: JSON.parse(restoredText) });
}

function home() {
  const systemLinks = systems.map(({ id, name }) => `<li><a href="/api/systems/${id}">${name}</a></li>`).join("");
  return new Response(`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Nathan Tabor Digital HPC</title><style>body{font:17px/1.55 system-ui;background:#0c1722;color:#ebf4ff;margin:clamp(1rem,6vw,4rem);max-width:76rem}a{color:#8ae9d3}section{padding:1rem 0;border-top:1px solid #30475d}h1{font-size:clamp(2rem,5vw,4rem);margin:.25em 0}li{margin:.4em 0}</style>
<h1>Nathan Tabor Digital HPC</h1><p>Run the same checked FP64 kernel at one or ten shards. Verify a checkpoint restored from archive and recover a synthetic corrupted register.</p>
<ul><li><a href="/api/compare">Run the 1× and 10× comparison</a></li><li><a href="/api/restore">Verify the archive restore</a></li><li><a href="/api/fault">Run the bit-flip recovery</a></li><li><a href="/api/architecture">View the hardware-to-digital architecture</a></li></ul>
<section><h2>Supercomputer attachment profiles</h2><ul>${systemLinks}</ul></section></html>`, { headers: { ...headers, "content-type": "text/html; charset=utf-8" } });
}

export default {
  async fetch(request, env) {
    if (request.method !== "GET") return json({ error: "Method not allowed" }, 405);
    const url = new URL(request.url);
    const { pathname } = url;
    if (pathname === "/") return home();
    if (pathname === "/health") return json({ ready: Boolean(env.EXECUTOR && env.WARM_OBJECTS && env.COLD_OBJECTS && env.CHECKPOINTS && env.ARCHIVE), systems: systems.length });
    if (pathname === "/api/architecture") return json({ architecture, publicReference: "https://www.nas.nasa.gov/hecc/services/supercomputing_systems_service.html" });
    if (pathname === "/api/systems") return json({ systems });
    if (pathname === "/api/fault") return json(vote());
    const system = systemMap.get(pathname.slice("/api/systems/".length));
    if (pathname.startsWith("/api/systems/") && system) {
      return json({ ...system, integration: "shared workload attachment profile", compare: "/api/compare?system=" + system.id, restore: "/api/restore", fault: "/api/fault" });
    }
    try {
      if (pathname === "/api/restore") return await restore(env, url.searchParams.get("storage") ?? "r2");
      if (pathname === "/api/compare") {
        const id = url.searchParams.get("system");
        if (id !== null && !systemMap.has(id)) return json({ error: "Unknown supercomputer profile" }, 400);
        const baseline = await run(env.EXECUTOR, 1);
        const expanded = await run(env.EXECUTOR, scale);
        const { wallMs: baselineWall, ...baselineReceipt } = baseline;
        const { wallMs: expandedWall, ...expandedReceipt } = expanded;
        const receipt = { system: id, executionHost: "tabor-digital-hpc-executor", baseline: baselineReceipt, expanded: expandedReceipt, workFactor: expanded.terms / baseline.terms };
        return json({ ...receipt, timingMs: { baseline: baselineWall, expanded: expandedWall }, sha256: await digest(JSON.stringify(receipt)) });
      }
    } catch {
      return json({ error: "Workload could not be verified" }, 503);
    }
    return json({ error: "Route not found" }, 404);
  }
};
