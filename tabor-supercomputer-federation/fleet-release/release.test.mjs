import assert from "node:assert/strict";
import test from "node:test";
import {DatabaseSync} from "node:sqlite";
import {catalogDigest,catalogText} from "./bundle.mjs";
import {engines} from "./engines.mjs";
import {batchReceipts,fleetRoute,localReplica,oneReplica} from "./release.mjs";

function sqlite() {
  const db=new DatabaseSync(":memory:");
  return {
    db,
    exec(stmt,...params) {
      if (stmt.startsWith("SELECT")) return {toArray:()=>db.prepare(stmt).all(...params)};
      db.prepare(stmt).run(...params);
    },
  };
}

test("keeps every catalog count, preserves IDs, and rejects corrupt stored bytes",async()=>{
  const sql=sqlite();
  assert.equal(await localReplica(sql),catalogText);
  assert.equal(await localReplica(sql),catalogText);
  assert.equal(sql.db.prepare("SELECT COUNT(*) AS n FROM tabor_public_fleet_releases").get().n,1);
  assert.deepEqual(Object.values(JSON.parse(catalogText).counts),[505,505,101,101,15,7]);
  sql.exec("UPDATE tabor_public_fleet_releases SET payload = ?",catalogText.replace("Tabor","XXXXX"));
  await assert.rejects(localReplica(sql),/digest mismatch/);
});

test("ONE persists and reads the same package",async()=>{
  const db=sqlite().db;
  const d1={prepare(stmt){return {stmt,args:[],bind(...args){return {...this,args}}}},async batch(batch){
    return batch.map(({stmt,args})=>{
      if (stmt.startsWith("SELECT")) return {results:db.prepare(stmt).all(...args)};
      db.prepare(stmt).run(...args);
      return {results:[]};
    });
  }};
  assert.equal(await oneReplica(d1),catalogText);
  assert.equal(await oneReplica(d1),catalogText);
});

test("runs every local example and checks exact results and rejection",async()=>{
  for (const [id,tool] of engines) {
    const result=await tool.run(tool.example);
    assert.ok(result,id);
  }
  assert.equal(engines.get(420).run(engines.get(420).example).balanced,true);
  assert.equal(engines.get(422).run({...engines.get(422).example,moves:["invalid"]}).valid,false);
  assert.deepEqual(engines.get(425).run(engines.get(425).example).missing,[20]);
  assert.equal(engines.get(426).run({seed:123,trials:5000,probability:1}).successes,5000);
  assert.equal(engines.get(431).run(engines.get(431).example).expression,"C");
  const wav=engines.get(435).run(engines.get(435).example);
  assert.equal(Buffer.from(await wav.arrayBuffer()).subarray(0,4).toString(),"RIFF");
  assert.equal(engines.get(436).run(engines.get(436).example).bins[2].magnitude,1);
  assert.equal(engines.get(445).run({code:"- .- -... --- .-."}).text,"TABOR");
  assert.deepEqual(engines.get(447).run({model:"closed-pipe",length:1,waveSpeed:340,harmonics:3}).harmonicsHz,[85,255,425]);
  assert.deepEqual(engines.get(448).run({hex:"#FF0000"}).hsl,[0,100,50]);
  const diff=engines.get(450).run({original:"🐉Tab",edited:"🐉Tabôr"});
  assert.equal(diff.edits.filter(e=>e.operation!=="delete").map(e=>e.text).join(""),"🐉Tabôr");
  assert.throws(()=>engines.get(436).run({samples:[1,2,3],sampleRate:8000}),RangeError);
});

test("serves node package and per-node tools, rejects methods and unknown tools",async()=>{
  const sql=sqlite(), prefix="/v1/nodes/node-001/fleet";
  async function run(suffix,payload,opts={}) {
    const init=payload?{method:"POST",body:JSON.stringify(payload),headers:{"content-type":"application/json"}}:{};
    const req=new Request("https://worker.example"+prefix+suffix,{...init,...opts});
    return fleetRoute(req,"node-001",prefix,suffix,"node_sqlite",()=>localReplica(sql));
  }
  const data=await run("/package.json");
  assert.equal(data.headers.get("x-tabor-package-sha256"),catalogDigest);
  assert.equal(await data.text(),catalogText);
  const receipt=await (await run("/receipt")).json();
  assert.equal(receipt.entries,1234);
  assert.equal(receipt.node,"node-001");
  assert.equal((await (await run("/capabilities")).json()).tools.length,11);
  const native=await run("/tools/425",engines.get(425).example);
  assert.equal(native.headers.get("x-tabor-fleet-node"),"node-001");
  assert.deepEqual((await native.json()).missing,[20]);
  assert.equal((await run("/tools/425")).status,405);
  assert.equal((await run("/tools/405",{})).status,404);
  assert.equal((await run("/tools/450",{original:"x".repeat(50000)})).status,413);
  assert.equal(await (await run("/receipt",undefined,{method:"HEAD"})).text(),"");
});

test("batch receipt page fails closed for unmatched node identity",async()=>{
  const req=new Request("https://worker.example/v1/fleet/receipts?start=999&limit=2");
  const res=await batchReceipts(req,String,node=>Response.json({node:"different",sha256:catalogDigest,verified:true}),1000);
  assert.equal(res.status,503);
  assert.deepEqual((await res.json()).entries.map(e=>[e.node,e.verified]),[["999",false],["1000",false]]);
});
