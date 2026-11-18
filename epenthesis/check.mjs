import assert from "node:assert/strict";
import {execFileSync} from "node:child_process";
const rows = execFileSync("python3", ["build_epenthesis_matrix.py"], {encoding:"utf8"}).trim().split("\n").map(JSON.parse);
const {default:worker} = await import("./src/index.mjs");
for (const row of rows) {
  const r = await worker.fetch(new Request("https://example.test/api/matrix?axis=" + row.axis + "&next=always"));
  const data = await r.json();
  assert.equal(data.nodes.length,3);
  assert.equal(data.agent,row.agent);
  assert.equal(data.nodes[2].intrusive_r_bridge,row.intrusive_r_bridge);
  assert.equal(data.nodes[2].paragogic_s,row.paragogic_s_node);
}
assert.equal((await worker.fetch(new Request("https://example.test/?axis=__proto__"))).status,400);
