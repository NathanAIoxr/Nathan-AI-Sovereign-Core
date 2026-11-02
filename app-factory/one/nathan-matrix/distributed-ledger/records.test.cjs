"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const moduleUnderTest=require("./records.js");
const {SOURCE,records,sections,filter}=moduleUnderTest;
test("21 distinct sequential entries and exact seven/seven/seven grouping",()=>{
 assert.equal(records.length,21);
 assert.deepEqual(records.map(x=>x.id),Array.from({length:21},(_,i)=>i+1));
 assert.deepEqual(sections.map(s=>records.filter(r=>r.section===s.id).length),[7,7,7]);
});
test("all 21 authored titles, functions and rules are present",()=>{
 for(const r of records){assert.ok(r.title.length>5);assert.ok(r.function.length>20);assert.ok(r.rule.length>20);assert.ok(SOURCE.includes(r.title));assert.ok(SOURCE.includes(r.function));assert.ok(SOURCE.includes(r.rule));}
});
test("author source remains unmodified by technical notes",()=>{
 assert.match(SOURCE,/SYSTEM UPGRADE: THE DISTRIBUTED LEDGER/);
 assert.match(SOURCE,/THE CODE COG/);
 assert.ok(records.some(r=>r.technicalNote&&r.technicalSource));
 assert.equal(SOURCE.includes("Independent technical context"),false);
});
test("search filters sections and both source and technical layer",()=>{
 assert.equal(filter("assets").length,7);
 assert.equal(filter("hardware").length,7);
 assert.equal(filter("consensus").length,7);
 assert.deepEqual(filter("all","monero").map(x=>x.id),[7]);
 assert.deepEqual(filter("all","BE P-95").length,0);
 assert.deepEqual(filter("all","BEP-95").map(x=>x.id),[5]);
 assert.equal(filter("all","this-is-not-a-protocol").length,0);
});
test("user's exact named principle and original 21-item stage are intact",()=>{
 assert.match(SOURCE,/Bitcoin \/ BTC \(The Sovereign Store\)/);
 assert.match(SOURCE,/Halving Mechanics \(The Programmed Scarcity Clock\)/);
 assert.equal(records[0].id,1);
 assert.equal(records[20].id,21);
});
