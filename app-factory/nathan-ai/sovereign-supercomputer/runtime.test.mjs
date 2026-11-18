import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { replay, sha256 } from "./compute.mjs";
import { advanceTerms, FABRIC_SHARD_TERMS, FABRIC_TERMS, runFabric } from "./fabric.mjs";
import fabricExecutor from "./fabric-executor.mjs";
import { archiveSnapshot, auditSnapshot } from "./ledger.mjs";
import { browser } from "./site.mjs";

const require = createRequire(new URL("../../sovereign-hub/cloudflare/package.json", import.meta.url));
const { Miniflare } = require("miniflare");
const root = fileURLToPath(new URL(".", import.meta.url));
const token = "runtime-tests-owner-key-placeholder";

test("runs the eight-shard workload and D1 mirror, including concurrent retries", async t => {
  let returnIncorrectShard = false;
  const runtime = new Miniflare({
    modules: true, scriptPath: root + "worker.mjs", modulesRoot: root, compatibilityDate: "2026-08-06",
    bindings: { OWNER_TOKEN: token }, d1Databases: ["SOVEREIGN_DB"], r2Buckets: ["VAULT_R2"],
    serviceBindings: { EXECUTOR: async request => {
      const shard = await request.json();
      assert.equal(request.url, "https://executor.internal/execute");
      assert(shard.index < 4 && shard.count + shard.offset <= 16384);
      const { checksum } = replay(shard.start, shard.count);
      return Response.json({ ...shard, checksum: checksum + Number(returnIncorrectShard),
        kernel: "fp64-dot-lcg32-v1", operations: shard.count * 2, invocation: crypto.randomUUID() });
    } },
  });
  t.after(() => runtime.dispose());
  const db = await runtime.getD1Database("SOVEREIGN_DB");
  const migration = await readFile(new URL("./migrations/0001_sovereign_core.sql", import.meta.url), "utf8");
  const statements = migration.trim().replace(/;$/, "").split(/;\n/).map(sql => db.prepare(sql.trim()));
  await db.batch(statements);
  await db.batch(statements);
  const get = path => runtime.dispatchFetch("http://localhost" + path);
  const post = (path, body, authorized = true) => runtime.dispatchFetch("http://localhost" + path, {
    method: "POST", headers: authorized ? { authorization: "Bearer " + token } : {},
    body: JSON.stringify(body),
  });
  assert.equal((await get("/")).status, 200);
  assert.equal((await get("/godtabor")).status, 200);
  new Function(browser);
  const run = await (await get("/api/fp64/run")).json();
  assert.equal(run.receipt.checksum, 8600491170);
  assert.equal(run.receipt.operations, 65536);
  assert.equal(run.receipt.shard_count, 8);
  assert.equal(run.receipt.bank_count, 2);
  assert.equal((await get("/api/fp64/run?shards=1")).status, 400);
  for (const [terms, shards] of [[64, 1], [65, 8], [16383, 4], [16385, 2], [32767, 7]]) {
    const { receipt } = await (await get(`/api/fp64/run?seed=4294967295&terms=${terms}&shards=${shards}`)).json();
    assert.equal(receipt.checksum, replay(4294967295, terms).checksum);
    assert.equal(receipt.shards.length, shards);
  }
  returnIncorrectShard = true;
  const rejected = await get("/api/fp64/run");
  assert.equal(rejected.status, 503);
  const registry = await (await get("/api/registry")).json();
  assert.deepEqual([registry.families.length, registry.clover_nodes, registry.council.length, registry.apps.length],
    [172, 1382, 24, 14]);
  assert.deepEqual(await (await get("/api/route?from=Wheel&to=Wheel")).json(), { route: ["Wheel"], reverse: ["Wheel"], identity: true });
  const timeline = await (await get("/api/rhythm")).json();
  assert.deepEqual(timeline.events.filter(item => item.cycles.length === 2).map(item => item.year), [2024, 2245]);
  const text = "  é 🧑🏾‍🚀\tWheel  ";
  const preview = await (await post("/api/words", { text }, false)).json();
  assert.equal(preview.exact_preserved, text);
  assert.equal(preview.reverse_mirror, "  leehW\t🧑🏾‍🚀 é  ");
  assert.equal(preview.first_letter_extraction, "é🧑🏾‍🚀W");
  assert.equal((await post("/api/intake", { text }, false)).status, 401);
  assert.equal((await post("/api/intake", { operation: "1-1=0" }).then(r => r.json())).writes, 0);
  assert.equal((await post("/api/intake", { text, noise: true }).then(r => r.json())).writes, 0);
  const queued = await (await post("/api/intake", { text })).json();
  assert.equal((await (await post("/api/intake", { text })).json()).id, queued.id);
  const bad = await (await post("/api/intake", { text: "Other" })).json();
  await db.prepare("UPDATE axis_dual_bus SET payload = 'changed' WHERE id = ?").bind(bad.id).run();
  const results = await Promise.all([auditSnapshot(db), auditSnapshot(db)]);
  const audited = results.find(item => item.status === "AUDITED");
  assert.equal(audited.verified, 1);
  assert.equal(audited.quarantined, 1);
  assert.equal(results.filter(item => item.status === "AUDITED").length, 1);
  assert.equal((await auditSnapshot(db)).status, "IDLE_ZERO_WRITES");
  const bucket = await runtime.getR2Bucket("VAULT_R2");
  const archived = await archiveSnapshot(db, bucket, audited.snapshot_id);
  const object = await bucket.get(archived.r2_key);
  assert.equal((await object.json()).root_hash, audited.root_hash);
  const registered = await (await post("/api/supernodes/claim", { record_id: queued.id })).json();
  assert.equal(registered.status, "REGISTERED");
  const status = await (await get("/api/mirror/status")).json();
  assert.equal(status.latest_snapshot.r2_key, archived.r2_key);
  assert(!JSON.stringify(status).includes("changed"));
});

test("routes and verifies the full FP64 fabric workload through a private Worker", async t => {
  const compatibilityDate = "2026-08-06";
  const runtime = new Miniflare({ workers: [
    {
      name: "sovereign", modules: true, scriptPath: root + "worker.mjs", modulesRoot: root,
      compatibilityDate, serviceBindings: { FABRIC_EXECUTOR: "fabric" },
    },
    {
      name: "fabric", modules: true, scriptPath: root + "fabric-executor.mjs", modulesRoot: root,
      compatibilityDate,
    },
  ] });
  t.after(() => runtime.dispose());
  const get = path => runtime.dispatchFetch("http://localhost" + path);
  const manifest = await (await get("/api/architecture")).json();
  assert.deepEqual(manifest.fp64.fabric, { terms: 2097152, shards: 16, terms_per_shard: 131072 });
  assert.equal(manifest.aggregate_hpl_reference.eflop_s, 19.70);
  const response = await get("/api/fp64/run?profile=fabric&seed=73");
  assert.equal(response.status, 200);
  const { receipt, sha256: digest } = await response.json();
  assert.equal(receipt.profile, "fabric");
  assert.equal(receipt.terms, 2097152);
  assert.equal(receipt.operations, 4194304);
  assert.equal(receipt.shard_count, 16);
  assert.equal(receipt.checksum, 549043171266);
  assert.equal(receipt.replay_verified, true);
  assert.equal(receipt.comparable_hpl, false);
  assert.equal(digest, await sha256(JSON.stringify(receipt)));

  let serialState = 73;
  let total = 0;
  const invocations = new Set();
  for (const [index, shard] of receipt.shards.entries()) {
    assert.equal(shard.index, index);
    assert.equal(shard.global_offset, index * FABRIC_SHARD_TERMS);
    assert.equal(shard.count, FABRIC_SHARD_TERMS);
    assert.equal(shard.start, serialState);
    const serial = replay(serialState, shard.count);
    assert.equal(shard.next_state, serial.state);
    assert.equal(shard.checksum, serial.checksum);
    serialState = serial.state;
    total += serial.checksum;
    invocations.add(shard.invocation);
  }
  assert.equal(total, receipt.checksum);
  assert.equal(invocations.size, 16);

  const uneven = await get("/api/fp64/run?profile=fabric&seed=4294967295&terms=65&shards=16");
  assert.equal(uneven.status, 200);
  const { receipt: small } = await uneven.json();
  assert.equal(small.checksum, replay(0xffffffff, 65).checksum);
  assert.equal(small.shards.at(-1).global_offset + small.shards.at(-1).count, 65);
  const invalid = [
    "profile=fabric&terms=63", "profile=fabric&terms=2097153",
    "profile=fabric&shards=17", "profile=fabric&shards=0",
    "profile=fabric&terms=131073&shards=1", "profile=fabric&seed=4294967296",
    "profile=fabric&profile=classic", "profile=unknown",
  ];
  for (const query of invalid) {
    assert.equal((await get("/api/fp64/run?" + query)).status, 400, query);
  }
});

test("matches affine skip to serial states and rejects altered shard boundaries", async () => {
  for (const seed of [0, 73, 0xffffffff]) {
    for (const terms of [0, 1, 65, 1048583, FABRIC_TERMS]) {
      assert.equal(advanceTerms(seed, terms), replay(seed, terms).state);
    }
  }
  const tampered = {
    async fetch(url, options) {
      const response = await fabricExecutor.fetch(new Request(url, options));
      const result = await response.json();
      return Response.json({ ...result, next_state: (result.next_state + 1) >>> 0 });
    },
  };
  await assert.rejects(runFabric(tampered, { seed: 73, terms: 64, shards: 1 }),
    /shard receipt failed validation/);
});
