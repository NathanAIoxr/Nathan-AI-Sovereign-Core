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
