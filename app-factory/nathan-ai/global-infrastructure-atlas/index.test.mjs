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

test("full archive is searchable and only serves fixed downloads", async () => {
 const data = {as_of:"2026-11-18",counts:{components:2},nodes:[
  {id:"N0001",name:"Example Agent",layers:["L11","L06"]},
  {id:"N0002",name:"Example Worker",layers:["L06"]},
 ]};
 const requestedKeys = [];
 const zipped = new Uint8Array([80,75,3,4]);
 const bucket = {
  async get(key) {
   requestedKeys.push(key);
   if (key.endsWith("/catalog.json.gz")) {
    return {body:new Response(JSON.stringify(data)).body.pipeThrough(new CompressionStream("gzip"))};
   }
   return {body:zipped,size:zipped.length};
  },
  async head(key) {
   requestedKeys.push(key);
   return {size:zipped.length};
  },
 };
 const run = (path, method = "GET") =>
  worker.fetch(new Request(`https://atlas.example${path}`, {method}), {ATLAS_ARCHIVE:bucket});
 const summary = await (await run("/api/archive/summary")).json();
 assert.equal(summary.counts.components,2);
 const rows = await (await run("/api/archive/components?layer=L06&q=EXAMPLE&limit=1")).json();
 assert.equal(rows.count,2);
 assert.equal(rows.items[0].id,"N0001");
 assert.equal(rows.next_offset,1);
 const second = await (await run("/api/archive/components?limit=1&offset=1")).json();
 assert.equal(second.items[0].id,"N0002");
 assert.equal(second.next_offset,null);
 const head = await run("/archive/download","HEAD");
 assert.equal(head.headers.get("content-length"),"4");
 assert.equal(await head.text(),"");
 const zip = await run("/archive/download");
 assert.deepEqual(new Uint8Array(await zip.arrayBuffer()),zipped);
 const gets = requestedKeys.length;
 assert.equal((await run("/archive/private-file.zip")).status,404);
 assert.equal((await run("/archive/download","PUT")).status,405);
 assert.equal(requestedKeys.length,gets);
 assert.equal((await worker.fetch(new Request("https://atlas.example/api/archive/summary"))).status,503);
});
