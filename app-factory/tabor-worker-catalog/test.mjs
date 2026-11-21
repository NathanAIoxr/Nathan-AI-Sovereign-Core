import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";
import { catalog, catalogBody, fleet, release, replicaKey } from "./src/registry.mjs";
import { archiveIntake } from "./scripts/archive-intake.mjs";
import { catalogFetch, withWorkerCatalog } from "./src/replica.mjs";
import { executeUtility } from "./src/utilities.mjs";

function request(path,method="GET",body){
  return new Request("https://catalog.example"+path,{method,body,headers:body?{"content-type":"application/json"}:{}});
}
test("all 101 source-numbered entries and 1,000 federation slot identities are preserved",()=>{
  assert.deepEqual(catalog.entries.map(x=>x.id),Array.from({length:101},(_,i)=>i+1));
  assert.deepEqual(catalog.categories.map(g=>[g.first,g.last]),[[1,16],[17,26],[27,39],[40,50],[51,63],[64,74],[75,84],[85,92],[93,101]]);
  assert.equal(new Set(fleet.slots).size,1000);
  assert.equal(fleet.slots[999],"node-1000");
  assert.equal(JSON.parse(archiveIntake.params[0]).length,101);
  assert.equal(createHash("sha256").update(catalogBody).digest("hex"),release.sha256);
});
test("catalog filtering, detail route and bounded method dispatch",async()=>{
  const home=await catalogFetch(request("/worker-catalog/?q=WebCrypto"));
  assert.match(await home.text(),/Hashing Microservice/);
  assert.equal((await catalogFetch(request("/worker-catalog/?category=23"))).status,400);
  assert.equal((await catalogFetch(request("/worker-catalog/projects/102"))).status,404);
  const data=await catalogFetch(request("/worker-catalog/catalog.json"));
  assert.equal(await data.text(),catalogBody);
  assert.equal(data.headers.get("x-catalog-sha256"),release.sha256);
  assert.equal((await catalogFetch(request("/worker-catalog/catalog.json","POST","{}"))).status,405);
});
test("slot responses address each stored path and verify object metadata",async()=>{
  const env={WORKER_CATALOG_REPLICAS:{
    async get(key){
      assert.equal(key,replicaKey("node-1000"));
      return {body:new Response(catalogBody).body,size:release.bytes,customMetadata:{sha256:release.sha256}};
    }
  }};
  const response=await catalogFetch(request("/v1/nodes/node-1000/worker-catalog"),env,{federation:true});
  assert.equal(response.headers.get("x-federation-slot"),"node-1000");
  assert.equal(await response.text(),catalogBody);
  assert.equal((await catalogFetch(request("/v1/nodes/node-1001/worker-catalog"),env,{federation:true})).status,404);
});
test("URL cleanup and hashing run without external access",async()=>{
  const trimmed=await executeUtility("strip-tracking",{url:"https://a.test/?utm_source=a&x=1&x=2&fbclid=z"});
  assert.deepEqual(trimmed,{url:"https://a.test/?x=1&x=2",removed:["utm_source","fbclid"]});
  await assert.rejects(executeUtility("strip-tracking",{url:"javascript:alert(1)"}),RangeError);
  const digest=await executeUtility("hash",{algorithm:"SHA-256",text:"Tabor"});
  assert.equal(digest.digest,createHash("sha256").update("Tabor").digest("hex"));
});
test("overlay preserves existing app handlers and catalog isolation",async()=>{
  const existing={fetch:()=>new Response("original"),scheduled:()=>42};
  const overlay=withWorkerCatalog(existing,{});
  assert.equal(await (await overlay.fetch(request("/api/health"))).text(),"original");
  assert.equal(overlay.scheduled(),42);
  assert.equal(await (await overlay.fetch(request("/worker-catalog/catalog.json"))).text(),catalogBody);
});
