import test from "node:test";
import assert from "node:assert/strict";
import {TOTAL_WITNESSES,witnessAt,witnessSummary} from "./witnesses.js";

test("exactly two independent 1000-witness passes",()=>{
 const s=witnessSummary();
 assert.equal(s.total,2000);assert.equal(s.passes,2);assert.equal(s.perPass,1000);
 assert.deepEqual(s.counts,{CARE:10,ARCHIVE:8,ACCOUNTABILITY:1980,MIRROR:2});
});
test("second pass matches first without changing original slots",()=>{
 for(const n of [1,2,3,4,5,6,7,8,9,10,999,1000]){
  const a=witnessAt(n),b=witnessAt(n+1000);
  assert.equal(a.slot,b.slot);assert.equal(a.tier,b.tier);assert.equal(a.code,b.code);
  assert.equal(a.pass,1);assert.equal(b.pass,2);
 }
});
test("reflection does not access camera or mutate environment",()=>{
 assert.equal(witnessAt(1000).tier,"MIRROR");assert.equal(witnessAt(2000).tier,"MIRROR");
 assert.match(witnessAt(2000).description,/no device camera/i);
 for(const bad of [0,2001,1.1,"1",NaN])assert.throws(()=>witnessAt(bad),RangeError);
});
