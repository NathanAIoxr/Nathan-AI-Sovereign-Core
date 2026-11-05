const test=require("node:test"),assert=require("node:assert/strict");
const m=require("./topology.js"),dogs=require("./engine.js");
test("macro has governance, registry, store, pubsub, local runtime, micro and edge",()=>{
 assert.equal(m.NODES.length,8);assert.equal(m.LINKS.length,8);
 for(const id of ["user","registry","store","events","runtime","gate","workflow","device"])assert.ok(m.NODES.some(x=>x.id===id));
});
test("invariants use exact arithmetic within supported whole numbers",()=>{
 assert.equal(m.build(1,1),2);assert.equal(m.clear(1,1),0);
 assert.throws(()=>m.build(1.5,1),/safe integer/);
});
test("DATA ATAD reverses text without inventing a deception finding",()=>{
 const r=m.inspect("DATA");assert.equal(r.backward,"ATAD");assert.equal(r.roundTripMatches,true);
 assert.equal(r.structuralGate,1);assert.equal(r.evidenceGate,0);
 assert.match(r.limits,/not truth/);
});
test("unicode grapheme roundtrip and palindrome independent of evidence",()=>{
 const r=m.inspect("a🌀e\u0301",{reference:"source-1",status:"supported"});
 assert.equal(r.roundTrip,"a🌀e\u0301");assert.equal(r.evidenceGate,1);
 assert.equal(m.inspect("level").palindrome,true);
 assert.equal(m.inspect("no").palindrome,false);
});
test("unverified data is held for review, never purged",()=>{
 const r=m.inspect("DECEPTION_DETECTED");
 assert.equal(r.evidenceGate,0);assert.equal(r.forward,"DECEPTION_DETECTED");
 const original={text:"I own this",other:1};
 assert.throws(()=>m.clearDraft(original,"NO"),/confirmation/);
 const result=m.clearDraft(original,"CLEAR_LOCAL_DRAFT");
 assert.equal(original.text,"I own this");assert.equal(result.text,"");assert.equal(result.other,1);
});
test("event-sourced graph updates active step and dashboard",()=>{
 let g=m.emptyGraph();
 g=m.applyEvent(g,{type:"STAGE_SELECTED",step:5});
 assert.equal(m.macroView(g).stage,6);
 assert.equal(m.macroView(g).revision,1);
 assert.equal(m.macroView(g).latestEvent.type,"STAGE_SELECTED");
 assert.equal(dogs.STEPS[m.macroView(g).stage-1].name,"BONE");
});
test("registry accepts typed assets but not executable commands",()=>{
 let g=m.emptyGraph();
 g=m.applyEvent(g,{type:"ASSET_REGISTERED",id:"book-1",kind:"document"});
 assert.equal(m.macroView(g).assets,1);
 assert.equal(m.macroView(g).latestEvent.asset,"book-1");
 assert.throws(()=>m.applyEvent(g,{type:"ASSET_REGISTERED",id:"secret",kind:"unrestricted"}),/Unsupported/);
 assert.throws(()=>m.applyEvent(g,{type:"NOT_AN_EVENT"}),/Unsupported/);
});
test("event graph does not mutate old snapshot",()=>{
 const g=m.emptyGraph(),g2=m.applyEvent(g,{type:"STAGE_SELECTED",step:2});
 assert.equal(g.sequence,0);assert.equal(g2.sequence,1);
 assert.equal(g.activeStep,0);assert.equal(g2.activeStep,2);
});
test("pubsub is explicit, reversible, local only",()=>{
 const b=m.createEventBus();const got=[];
 const unsubscribe=b.subscribe("six-dogs:stage",v=>got.push(v));
 assert.equal(b.publish("six-dogs:stage",{step:3}),1);
 unsubscribe();assert.equal(b.publish("six-dogs:stage",{step:4}),0);
 assert.deepEqual(got,[{step:3}]);
});
test("memory adapter supports independent read/write/remove",()=>{
 const p=m.createMemoryPort();
 assert.equal(p.read("demo"),null);assert.equal(p.write("demo","saved"),true);
 assert.equal(p.read("demo"),"saved");assert.deepEqual(p.keys(),["demo"]);
 assert.equal(p.remove("demo"),true);assert.equal(p.read("demo"),null);
});
test("invalid stage and unconfirmed clear are blocked",()=>{
 const g=m.emptyGraph();
 assert.throws(()=>m.applyEvent(g,{type:"STAGE_SELECTED",step:6}),/Stage outside/);
 assert.throws(()=>m.applyEvent(g,{type:"LOCAL_DRAFT_CLEARED"}),/confirmation/);
});
test("event history remains bounded and preserves latest",()=>{
 let g=m.emptyGraph();
 for(let i=0;i<141;i++)g=m.applyEvent(g,{type:"STAGE_SELECTED",step:i%6});
 assert.equal(m.macroView(g).eventCount,128);
 assert.equal(m.macroView(g).revision,141);
});
