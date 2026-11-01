const test=require("node:test");
const assert=require("node:assert/strict");
const w=require("./wiring.js");

test("A–Z owner labels indexed additively, W as new engine",()=>{
  assert.equal(w.REGISTERS.length,11);
  assert.deepEqual(w.REGISTERS.map(r=>r.code),["A","B&D","C","H","J","L","P","R","V","Z","W"]);
  assert.ok(w.REGISTERS.every(r=>r.kind && r.domain));
});
test("1+1=2 BUILD and 1-1=0 CLEAR; integers only",()=>{
  assert.equal(w.build(1,1),2n); assert.equal(w.clear(1,1),0n);
  assert.throws(()=>w.build(0.5,0.5),TypeError);
});
test("Above/below alphabet midpoint stays exact",()=>{
  assert.deepEqual(w.middleHearing(),{above:"HKQ",middle:"ILT",below:"JMW",interpretation:"I LISTEN TO (author-defined)"});
});
test("Nonclinical, nonactuating three-stage routing",()=>{
  const r=w.processSignal({type:"speech",severity:"info",note:"demonstration"});
  assert.equal(r.route,"OBSERVE"); assert.equal(r.phases.length,3);
  assert.equal(r.actionExecuted,false); assert.equal(r.diagnosticConclusion,null);
  assert.equal(r.contextStored,false); assert.ok(!JSON.stringify(r).includes("demonstration\"}"));
});
test("Urgent state is never silently purged or bypassed",()=>{
  for(const type of w.SIGNALS) assert.equal(w.processSignal({type,severity:"urgent"}).route,"PAUSE");
});
test("Pain stays attended even at info severity",()=>{
  assert.equal(w.processSignal({type:"pain",severity:"info"}).route,"ATTEND");
  assert.equal(w.processSignal({type:"pain",severity:"warning"}).route,"ATTEND");
});
test("Warning inputs require review",()=>{
  assert.equal(w.processSignal({type:"motor",severity:"warning"}).route,"REVIEW");
});
test("Reject bad or overlong user input; no storage",()=>{
  assert.throws(()=>w.processSignal({type:"invented",severity:"info"}),RangeError);
  assert.throws(()=>w.processSignal({type:"sensory",severity:"other"}),RangeError);
  assert.throws(()=>w.processSignal({type:"sensory",severity:"info",note:"x".repeat(241)}),RangeError);
});
