"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const T=require("./engine.js"),R=require("../../engine.js"),UCT=require("../engine.js"),Radix=require("../../../radix-ladder/engine.js");
test("all UCT source receptors, equations, scenes and edges retain independent three-lens conversions",()=>{
 const book=T.codebook(),raw=UCT.build();
 assert.equal(book.records.length,raw.nodes.length);assert.equal(book.links.length,raw.edges.length);
 assert.equal(book.records.length,140);assert.equal(book.links.length,148);
 assert.equal(book.claims.length,raw.ledger.length);
 assert.equal(new Set(book.records.map(r=>r.source.id)).size,raw.nodes.length);
 for(const record of book.records){
  const original=raw.nodes.find(n=>n.id===record.source.id);
  assert.equal(record.source.label,original.label);
  assert.equal(record.source.kind,original.kind);
  assert.equal(record.source.origin,original.origin);
  assert.ok(record.numerology.radix.length>=11);
  assert.equal(T.decodeEgyptian(record.hieroglyphics.ordinal).value,record.numerology.ordinal);
  assert.ok(Number.isFinite(record.geometry.x)&&Number.isFinite(record.geometry.y));
 }
 for(const edge of book.links){assert.ok(edge.source&&edge.target);assert.ok(Number.isFinite(edge.length));}
});
test("correct additive Egyptian numbers with seven powers and explicit non-number zero",()=>{
 const cases=[1,2,7,10,11,42,100,108,1000,1234,4622,2026,10000,100000,1000000,9999999];
 for(const value of cases){const x=T.encodeEgyptian(value);assert.equal(T.decodeEgyptian(x.text).value,value);assert.equal(x.groups.reduce((s,g)=>s+g.value*g.quantity,0),value);}
 assert.equal(T.encodeEgyptian(1).text,"𓏺");
 assert.equal(T.encodeEgyptian(10).text,"𓎆");
 assert.equal(T.encodeEgyptian(100).text,"𓍢");
 assert.equal(T.encodeEgyptian(1000).text,"𓆼");
 assert.equal(T.encodeEgyptian(10000).text,"𓂭");
 assert.equal(T.encodeEgyptian(100000).text,"𓆐");
 assert.equal(T.encodeEgyptian(1000000).text,"𓁨");
 assert.equal(T.encodeEgyptian(0).text,"");
 assert.equal(T.decodeEgyptian("").ok,false);
 assert.equal(T.decodeEgyptian("𓏺𓎆").ok,false);
 assert.equal(T.decodeEgyptian("𓏺".repeat(10)).ok,false);
 assert.throws(()=>T.encodeEgyptian(-2));
 assert.throws(()=>T.encodeEgyptian(10000000));
});
test("letter ciphers are modern explicit rules, not Greek/Egyptian translation",()=>{
 const mid=T.scoreText("MIDDLE C");
 assert.equal(mid.a1z26,50);assert.equal(mid.cycleNine,32);assert.equal(mid.digitalRoot,5);
 assert.equal(T.scoreText("ΑΒΓ𓏺").a1z26,0);
 assert.equal(T.scoreText("A+B=AB").a1z26,6);
 assert.equal(T.digitRoot(0),0);assert.equal(T.digitRoot(69),6);
 assert.deepEqual(T.scoreText("UCT 123.45").numberTokens,["123.45"]);
 assert.throws(()=>T.scoreText("a".repeat(10001)));
});
test("geometry assigns sovereign heptagon branch placements and bounded rings",()=>{
 const b=T.codebook(),original=UCT.build();
 const mains=original.branches.map(x=>b.records.find(r=>r.source.id==="uct:"+x.id));
 assert.equal(mains.length,7);assert.ok(mains.every(x=>x.geometry.shape==="heptagon"));
 for(let i=1;i<mains.length;i++){
  const angle=mains[i].geometry.thetaDeg-mains[i-1].geometry.thetaDeg;
  assert.ok(Math.abs(angle-360/7)<.001);
 }
 assert.equal(b.records.find(x=>x.source.id==="uct:continuum").geometry.radius,0);
 const concepts=b.records.filter(x=>/-c\d+$/.test(x.source.id));
 assert.ok(concepts.every(c=>c.geometry.shape==="circle"&&c.geometry.radius===226));
 assert.equal(T.polygonVertices(7).length,7);
 assert.throws(()=>T.polygonVertices(2));
});
test("existing TABOR Radix Ladder remains the canonical 1–69 numeric formatter",()=>{
 const code=T.codebook().records.find(x=>x.source.id==="uct:continuum");
 for(const item of code.numerology.radix){assert.equal(Radix.decode(item.encoded,item.base),BigInt(code.numerology.a1z26));}
 assert.deepEqual(T.BASES,[2,3,7,9,10,12,13,17,21,33,69]);
});
test("install adds 25 durable lens roots on top of complete UCT source with no destructive writes",()=>{
 const before=R.create(),old=R.save(before),first=T.install(R,before);
 assert.equal(first.ok,true,first.reason);assert.equal(before.nodes.length,15);
 assert.equal(R.save(before),old);
 assert.equal(first.sourceNodes,140);assert.equal(first.virtualProjections,420);
 assert.equal(first.addedNodes,165);
 assert.equal(first.state.nodes.find(n=>n.id==="formula:arithmetic").glyphs,"AAND");
 assert.equal(first.state.nodes.filter(n=>n.id.startsWith("uctlens:")).length,25);
 assert.equal(first.state.cookie.length,0);
 const again=T.install(R,first.state);
 assert.equal(again.ok,true);assert.equal(again.addedNodes,0);assert.equal(again.addedEdges,0);
 assert.deepEqual(again.state.nodes,first.state.nodes);
});
test("at capacity, import safely declines without source loss or cookie destruction",()=>{
 const state=R.create();
 while(state.nodes.length>R.LIMIT-10)break;
 for(let i=state.nodes.length;i<R.LIMIT-1;i++)state.nodes.push({id:"filler:"+i,label:"test",kind:"symbol",origin:"unit-test"});
 const saved=JSON.stringify(state);const result=T.install(R,state);
 assert.equal(result.ok,false);assert.equal(result.state,state);assert.equal(saved,JSON.stringify(state));
});
