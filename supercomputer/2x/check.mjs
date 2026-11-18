import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import worker, {verify} from "./dist.mjs";
const python = fileURLToPath(new URL("nathan_ai_supercomputer.py", import.meta.url));
const local = JSON.parse(execFileSync("python3", [python], {encoding:"utf8"})).result;
const edge = verify();
for (const field of ["ok","axioms","slayer","sleyer","redundancyFixture","hplMeasurement"]) {
  assert.deepEqual(edge[field], local[field]);
}
assert.equal(edge.workload.checksum, local.workload.checksum);
assert.equal(edge.topology.logicalSlots.flatMap(node => node.circuits).length, local.logicalSlots);
assert.equal(edge.topology.axes.flatMap(axis => axis.directions).length, local.logicalAxes);
assert.equal((await worker.fetch(new Request("https://example.test/healthz"))).status,200);

const operations = [];
const database = {
  prepare: sql => ({ bind: (...args) => ({ sql, args }) }),
  batch: async statements => operations.push(...statements)
};
const { runOperations } = await import("./dist.mjs");
const scheduledMs = Date.now();
await runOperations(database, scheduledMs, async url => {
  if (url.endsWith("/healthz")) return Response.json({ ok: true });
  if (url.endsWith("/api/coins")) throw new Error("Timed out");
  return new Response(null, { status: 503 });
});
const [write, cleanup] = operations;
assert.equal(write.args[0], scheduledMs);
assert.equal(write.args[2], 0);
assert.deepEqual(JSON.parse(write.args[3]).map(check => check.passed), [true, true, false, false, false]);
assert.match(write.sql, /ON CONFLICT\(scheduled_ms\) DO NOTHING/);
assert.match(cleanup.sql, /DELETE FROM sovereign_operations_runs/);
