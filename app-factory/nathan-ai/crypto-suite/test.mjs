import test from "node:test";
import assert from "node:assert/strict";
import { bundle } from "./build.mjs";
const ids = ["crypto-64","mining-lab","cryptology","crypt-operations","crypto-dmsp-dit","cryptozoology"];
const loaded = Object.fromEntries(await Promise.all(ids.map(async id => [id,await import("data:text/javascript;base64,"+Buffer.from(bundle(id)).toString("base64"))])));
const get = (id, path, env) => loaded[id].default.fetch(new Request("https://suite.test"+path),env);

for (const id of ids) test(id+" renders independently",async () => {
  const home = await get(id,"/");
  assert.equal(home.status,200);
  assert.match(await home.text(),new RegExp('data-app="'+id+'"'));
  assert.deepEqual(await (await get(id,"/healthz")).json(),{app:id,ok:true});
  assert.equal((await get(id,"/missing")).status,404);
  const javascript = await (await get(id,"/app.js")).text();
  assert.match(javascript,/async function headerProof/);
  assert.match(javascript,/document\.body\.dataset\.app/);
});

test("Bitcoin genesis header meets its target",async () => {
  const mining = loaded["mining-lab"];
  const data = await (await get("mining-lab","/api/genesis-proof")).json();
  assert.equal(data.hash,mining.GENESIS_HASH);
  assert.equal(data.meetsTarget,true);
  await assert.rejects(mining.headerProof("00"),/80 bytes/);
  const modified = await mining.headerProof(mining.GENESIS.slice(0,-2)+"00");
  assert.equal(modified.meetsTarget,false);
});

test("registry preserves ordered slots and fails closed when source is incomplete",async () => {
  const slots = Array.from({length:64},(_,i)=>({slot:i+1, name:i<42?"Original "+i:null}));
  const env = {COIN_SOURCE:{fetch:async()=>Response.json({requested:64,recovered:42,slots})}};
  assert.equal((await (await get("crypto-64","/api/coins/64",env)).json()).slots[63].name,null);
  assert.equal((await get("crypto-64","/api/coins/64",{COIN_SOURCE:{fetch:async()=>Response.json({slots:[]})}})).status,503);
  const oracle = await (await get("crypt-operations","/api/oracle/health",{...env,MINING_LAB:{fetch:async()=>get("mining-lab","/api/genesis-proof")}})).json();
  assert.ok(oracle.sources.every(source=>source.ok));
});
