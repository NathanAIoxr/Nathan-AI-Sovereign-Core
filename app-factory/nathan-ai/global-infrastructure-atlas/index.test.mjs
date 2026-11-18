import test from "node:test";
import assert from "node:assert/strict";
import worker,{LAYERS,COMPONENTS,EDGES,SOURCES} from "./index.mjs";
test("18 layers and reference-only components",()=>{assert.equal(LAYERS.length,18);assert.ok(COMPONENTS.length>=180);assert.ok(COMPONENTS.every(x=>x.status==="public_reference_only"));assert.ok(EDGES.length>=18);assert.ok(SOURCES.length>=10)});
test("read-only endpoints",async()=>{
 const health=await(await worker.fetch(new Request("https://atlas.example/health"))).json();
 assert.equal(health.deployed_nodes_from_seed,0);
 const items=await(await worker.fetch(new Request("https://atlas.example/api/components?layer=L01"))).json();
 assert.ok(items.items.some(x=>/OpenBMC/.test(x.name)));assert.ok(items.items.every(x=>x.layer==="L01"));
 const response=await worker.fetch(new Request("https://atlas.example/api/components",{method:"POST"}));
 assert.equal(response.status,405);
});