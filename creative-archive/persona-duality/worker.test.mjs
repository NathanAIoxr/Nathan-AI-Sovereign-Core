import test from "node:test";
import assert from "node:assert/strict";
import worker,{batchForTime,recordTick} from "./worker.mjs";
import {NODES,EDGES,TASKS,INTEGRATIONS,CANON_NOTE} from "./registry.mjs";
test("stable and source-separated identities",()=>{
 assert.equal(new Set(NODES.map(x=>x.id)).size,NODES.length);
 assert.ok(NODES.some(x=>x.id==="supmalg"));
 assert.ok(NODES.some(x=>x.id==="supmals"));
 assert.ok(CANON_NOTE.includes("Preserve both"));
 for(const edge of EDGES){assert.ok(NODES.some(x=>x.id===edge.from));assert.ok(NODES.some(x=>x.id===edge.to));}
 assert.ok(INTEGRATIONS.some(x=>x.value==="creative-archive/nexus-mas-spirit/canon.json"));
});
test("scheduled batches are bounded and do not execute tasks",()=>{
 assert.equal(batchForTime(Date.parse("2026-11-18T21:00:00Z")).length,3);
 assert.equal(new Set(batchForTime(Date.now()).map(x=>x.id)).size,3);
 assert.ok(TASKS.every(x=>x.dispatch===false&&x.status==="pending_review"));
});
test("public graph and HTML routes work",async()=>{
 let r=await worker.fetch(new Request("https://example.test/api/graph"),{});
 assert.equal(r.status,200);
 const graph=await r.json();assert.equal(graph.nodes.length,NODES.length);
 r=await worker.fetch(new Request("https://example.test/"),{});
 assert.equal(r.status,200);assert.match(await r.text(),/Tabor Persona Atlas/);
 r=await worker.fetch(new Request("https://example.test/api/health"),{});
 assert.equal((await r.json()).dispatch,false);
 r=await worker.fetch(new Request("https://example.test/api/graph",{method:"POST"}),{});
 assert.equal(r.status,405);
});
test("scheduled receipt is persisted without network or external dispatch",async()=>{
 const values=new Map();
 const env={RECEIPTS:{
   async put(key,value){values.set(key,value);},
   async get(key,kind){const v=values.get(key);return kind==="json"&&v?JSON.parse(v):v;}
 }};
 const event={scheduledTime:Date.parse("2026-11-18T21:15:00Z")};
 const receipt=await recordTick(event,env);
 assert.equal(receipt.receipt_saved,true);
 assert.equal(receipt.task_ids.length,3);
 assert.equal(receipt.external_dispatch,false);
 const r=await worker.fetch(new Request("https://example.test/api/receipts"),env);
 assert.deepEqual((await r.json()).latest.task_ids,receipt.task_ids);
});

test("Sovereignty OS assigns all 20 systems and keeps the original source wording", async () => {
  const base = "https://example.test";
  const catalog = await (await worker.fetch(new Request(base + "/api/os-roles"), {})).json();
  assert.deepEqual(catalog.terminology, { MSP: "DAEMON", IT: "ANGEL" });
  assert.equal(catalog.game_assignments.systems.length, 20);
  assert.equal(catalog.alignment.noise.authority, "none");
  assert.equal(catalog.alignment.creator_words[2], "God = noise, delete it all");
  assert.equal(catalog.roles.find(role => role.label === "Satan").plane, "BELOW");
  assert.equal(catalog.deployment.work_dispatch, false);
  const page = await worker.fetch(new Request(base + "/sovereignty-roles"), {});
  assert.equal(page.status, 200);
  assert.match(await page.text(), /20 independent game and puzzle systems/);
});

test("arithmetic corrects the rejected decimal equation and clears labeled overlays", async () => {
  const url = "https://example.test/api/os-roles/align?";
  const align = async (expression, options = {}) => {
    const query = new URLSearchParams({ expression, ...options });
    const result = await worker.fetch(new Request(url + query), {});
    assert.equal(result.status, 200);
    return result.json();
  };
  const corrected = await align("1=1=10");
  assert.deepEqual([corrected.action, corrected.challenger, corrected.verified_by, corrected.active_output],
    ["REPLACE", "Satan", "ANGEL", "1+1=2"]);
  assert.equal(corrected.exact_input.expression, "1=1=10");
  const binary = await align("1 + 1 = 10", { radix: "2" });
  assert.deepEqual([binary.action, binary.active_output], ["VERIFY", "1+1=10"]);
  assert.equal((await align("1=1=10", { radix: "2" })).action, "HOLD");
  for (const origin of ["god-laid", "man-laid"]) {
    const cleared = await align(" 1+1=2 ", { origin });
    assert.deepEqual([cleared.action, cleared.operator, cleared.active_output, cleared.exact_input.expression],
      ["CLEAR", "1-1=0", null, " 1+1=2 "]);
  }
  const duplicate = await worker.fetch(new Request(url + "expression=1%3D1%3D10&radix=2&radix=10"), {});
  assert.equal(duplicate.status, 400);
});
