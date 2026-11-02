"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const {records,groups,getRecords,miningScenario}=require("./records.js");
test("exactly 21 unique numbered positions and 7 in each original section",()=>{
 assert.equal(records.length,21);
 assert.deepEqual(records.map(r=>r.n),Array.from({length:21},(_,i)=>i+1));
 assert.equal(new Set(records.map(r=>r.n)).size,21);
 for(const group of groups) assert.equal(records.filter(r=>r.group===group).length,7);
});
test("original titles and author-defined epithets remain distinct",()=>{
 assert.equal(records[0].epithet,"The Sovereign Store");
 assert.equal(records[6].epithet,"The Absolute Anonymity Vector");
 assert.equal(records[20].epithet,"The Programmed Scarcity Clock");
 assert.notEqual(records[0].note,records[0].summary);
});
test("filter searches group, number, source note and title",()=>{
 assert.equal(getRecords("Mining Rigs").length,7);
 assert.equal(getRecords("All","privacy").length>=1,true);
 assert.deepEqual(getRecords("Asset Layer","BNB").map(r=>r.n),[5]);
 assert.equal(getRecords("Consensus & Architecture","GPU").length,0);
});
test("proof-of-work expected-value scenario accounts for power and fees",()=>{
 const base={hashrateTH:100,difficultyT:100000,watts:3200,electricityUSD:0.1,btcPriceUSD:60000,poolFeePct:2,feesPerBlockBTC:0,subsidyBTC:3.125};
 const r=miningScenario(base);
 assert.ok(Math.abs(r.blocksPerDay-(100*86400/(100000*2**32)))<1e-15);
 assert.equal(r.powerKWh,76.8);
 assert.ok(Math.abs(r.electricUSD-7.68)<1e-12);
 assert.ok(Math.abs(r.btcPerDay-r.blocksPerDay*3.125*.98)<1e-15);
 assert.ok(Math.abs(r.netAfterElectricUSD-(r.revenueUSD-r.electricUSD))<1e-12);
 assert.equal(miningScenario({...base,hashrateTH:0}).btcPerDay,0);
});
test("rejects missing, negative, nonnumeric, zero difficulty and fee >100",()=>{
 const base={hashrateTH:10,difficultyT:100000,watts:3000,electricityUSD:.12,btcPriceUSD:60000,poolFeePct:1,feesPerBlockBTC:0,subsidyBTC:3.125};
 for(const bad of [{difficultyT:0},{hashrateTH:-1},{watts:"oops"},{poolFeePct:101},{btcPriceUSD:""},{electricityUSD:Infinity}]) assert.throws(()=>miningScenario({...base,...bad}));
});
test("links to protocol documentation are https",()=>{
 for(const rec of records){assert.match(rec.source,/^https:\/\//);assert.ok(rec.note.length>25)}
});
