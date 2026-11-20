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

test("Golden Goose verifies upstream Bitcoin headers and rejects mismatches", async t => {
  const { GENESIS, GENESIS_HASH } = loaded["mining-lab"];
  const upstream = t.mock.method(globalThis, "fetch", async () => new Response());
  const mainnet = "/api/bitcoin-mainnet";
  const tip = "https://mempool.space/api/blocks/tip/hash";
  const expectedHeader = "https://mempool.space/api/block/" + GENESIS_HASH + "/header";
  const backup = "https://blockstream.info";
  upstream.mock.mockImplementation(async url => {
    if (url === tip) return new Response(GENESIS_HASH);
    assert.equal(url, expectedHeader);
    return new Response(GENESIS);
  });
  const result = await get("mining-lab", mainnet + "?upstream=https://invalid.example");
  assert.equal(result.status, 200);
  assert.equal(result.headers.get("cache-control"), "public, max-age=60");
  assert.equal((await result.json()).blockHash, GENESIS_HASH);
  assert.match(await (await get("mining-lab", "/golden-goose")).text(), /Nathan AI Rocket 🚀/);
  assert.equal((await get("crypto-64", mainnet)).status, 404);

  upstream.mock.mockImplementation(async url => {
    if (url === tip) return new Response(null, { status: 503 });
    if (url === backup + "/api/blocks/tip/hash") return new Response(GENESIS_HASH);
    assert.equal(url, backup + "/api/block/" + GENESIS_HASH + "/header");
    return new Response(GENESIS);
  });
  assert.equal((await (await get("mining-lab", mainnet)).json()).source, backup);

  upstream.mock.mockImplementation(async (_url, options) => {
    assert.equal(options.redirect, "manual");
    return new Response(null, { status: 302, headers: { location: "https://invalid.example" } });
  });
  assert.equal((await get("mining-lab", mainnet)).status, 503);

  upstream.mock.mockImplementation(async url => new Response(
    url === tip ? GENESIS_HASH : GENESIS.slice(0, -2) + "00"
  ));
  assert.equal((await get("mining-lab", mainnet)).status, 503);

  upstream.mock.mockImplementation(async () => new Response("0".repeat(80)));
  assert.equal((await get("mining-lab", mainnet)).status, 503);
});

test("registry preserves ordered slots and fails closed when source is incomplete",async () => {
  const slots = Array.from({length:64},(_,i)=>({slot:i+1, name:i<42?"Original "+i:null}));
  const env = {COIN_SOURCE:{fetch:async()=>Response.json({requested:64,recovered:42,slots})}};
  assert.equal((await (await get("crypto-64","/api/coins/64",env)).json()).slots[63].name,null);
  assert.equal((await get("crypto-64","/api/coins/64",{COIN_SOURCE:{fetch:async()=>Response.json({slots:[]})}})).status,503);
  const oracle = await (await get("crypt-operations","/api/oracle/health",{...env,MINING_LAB:{fetch:async()=>get("mining-lab","/api/genesis-proof")}})).json();
  assert.ok(oracle.sources.every(source=>source.ok));
});

test("restoration maps all slots without merging families into unresolved positions",async () => {
  const slots = Array.from({length:64},(_,i)=>({slot:i+1,ticker:i<42?"A"+i:null,name:i<42?"Original "+i:null}));
  const env = {COIN_SOURCE:{fetch:async()=>Response.json({requested:64,recovered:42,slots})}};
  const data = await (await get("crypto-64","/api/restoration",env)).json();
  assert.equal(data.slots[0].coordinate,"000000");
  assert.deepEqual(data.slots[63],{slot:64,ticker:null,name:null,coordinate:"111111"});
  assert.equal(data.partitions.length,7);
  assert.equal(data.partitions.at(-1).id,"middle_mediator");
  assert.match(await (await get("crypto-64","/manuscript.txt")).text(),/Equilibrium Reached/);
});

test("mining launch readiness keeps unresolved chain and capacity gates visible",async () => {
  const slots = Array.from({length:64},(_,i)=>({slot:i+1,status:i<42?"recovered_from_42_coin_artwork":"source_unverified"}));
  const env = {COIN_SOURCE:{fetch:async()=>Response.json({requested:64,slots})}};
  const result = await (await get("mining-lab","/api/launch-readiness",env)).json();
  assert.equal(result.ready,false);
  assert.deepEqual(result.registry,{orderedSlots:64,recovered:42,unresolved:22});
  assert.equal(result.gates.length,3);
  assert.equal((await (await get("mining-lab","/api/launch-readiness",{})).json()).ready,false);
});

test("Mining Lab publishes the committed receipt and fails closed on D1 divergence", async () => {
  const { readFile } = await import("node:fs/promises");
  const expected = await readFile(new URL("./ledger/state.json", import.meta.url));
  const endpoint = "/api/crypto-mirror";
  const binary = await get("mining-lab", endpoint + "/state.bin");
  assert.equal(binary.headers.get("content-type"), "application/octet-stream");
  assert.deepEqual(Buffer.from(await binary.arrayBuffer()), expected);
  const readD1 = stateHex => ({
    CRYPTO_MIRROR: { prepare: () => ({ bind: () => ({
      first: async () => ({ state_hex: stateHex }),
    }) }) },
  });
  const verified = await get("mining-lab", endpoint, readD1(expected.toString("hex")));
  assert.equal(verified.status, 200);
  const result = await verified.json();
  assert.equal(result.verification, 2);
  assert.equal(result.state.reserve.reportedUsd, "1700000000000");
  assert.equal(result.state.wallet.reserveRelationship, "NOT_ESTABLISHED");
  assert.deepEqual(result.state.mining.reverseProofs.map(proof => proof.meetsTarget), [false, true, false]);
  for (const environment of [{}, readD1("00")]) {
    const rejected = await get("mining-lab", endpoint, environment);
    assert.equal(rejected.status, 503);
    assert.equal((await rejected.json()).verification, 0);
  }
  assert.equal((await get("crypto-64", endpoint)).status, 404);
});
