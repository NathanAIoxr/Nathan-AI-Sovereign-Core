import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { replay } from "./compute.mjs";
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
