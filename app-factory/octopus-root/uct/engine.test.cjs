'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const U=require('./engine.js'),R=require('../engine.js');
test('7 sovereign branches, formulas, and cross-franchise scene records are present',()=>{
 const p=U.build();assert.equal(p.branches.length,7);
 assert.equal(new Set(p.nodes.map(n=>n.id)).size,p.nodes.length);
 assert.ok(p.nodes.length>=120);
 assert.ok(p.ledger.length>=15);
 for(const b of p.branches){assert.equal(b.concepts.length,11);assert.ok(b.forward&&b.backward&&b.scenes.length)}
 assert.ok(p.edges.some(e=>e.from==='uct:unknown'&&e.to==='uct:machine'));
});
test('UCT installs into actual Octopus Root without overwriting its originals',()=>{
 const base=R.create(),count=base.nodes.length,root=U.install(R,base);
 assert.equal(root.conflicts.length,0,root.conflicts.join('; '));
 assert.ok(root.addedNodes>=120);
 assert.equal(root.addedEdges,U.build().edges.length);
 assert.equal(root.state.nodes.length,count+root.addedNodes);
 assert.equal(root.state.cookie.length,0);
 assert.equal(base.nodes.length,count);
 assert.equal(root.state.nodes.find(n=>n.id==='formula:arithmetic').glyphs,'AAND');
 assert.equal(root.state.nodes.find(n=>n.id==='word:dirty').label,'DIRTY CLEAN');
});
test('repeat install idempotent and preserves manually grown nodes',()=>{
 const a=U.install(R,R.create()).state;
 const g=R.grow(a,'word:dirty',2).state,b=U.install(R,g);
 assert.equal(b.addedNodes,0);assert.equal(b.addedEdges,0);
 assert.equal(b.state.nodes.length,g.nodes.length);
 assert.deepEqual(b.state.cookie,g.cookie);
});
test('forward and backward recover synthetic anomaly without noise',()=>{
 for(const r of U.sweep(150)){
  assert.ok(Math.abs(r.recovered-r.anomaly)<1e-10);
  assert.ok(r.scriptedRisk>0&&r.scriptedRisk<1);
 }
 assert.throws(()=>U.sweep(2001));
 assert.throws(()=>U.forward(-1));
});
test('uncertainty and fiction boundaries remain labeled',()=>{
 const p=U.build();
 assert.equal(p.ledger.find(x=>x.id==='phasing.phase').status,'established-math');
 assert.equal(p.ledger.find(x=>x.id==='unknown.scalar').status,'hypothetical');
 assert.ok(p.ledger.every(x=>x.source&&x.limitation));
 const a=U.reviewClaim({status:'fictional',source:'Owner supplied'});
 assert.equal(a.accepted,true);assert.match(a.reason,/does not independently verify/i);
 assert.equal(U.reviewClaim({status:'established-math',source:'x'}).route,'cookie-monster-review');
});
test('Arduino original foam threshold is mathematically unreachable',()=>{
 const a=U.hardwareAudit();
 assert.equal(a.triggerReachable,false);
 assert.ok(a.maxOriginalToyFoam<a.trigger);
 assert.match(a.interpretation,/cannot detect dark energy/i);
});
test('legacy root snapshots load after mounting and retain Cookie Monster behavior',()=>{
 const mounted=U.install(R,R.create()).state,loaded=R.load(R.save(mounted));
 assert.equal(loaded.nodes.length,mounted.nodes.length);
 const invalid=R.attach(loaded,{from:'uct:warp',to:'uct:shield',type:'exact'});
 assert.equal(invalid.ok,false);assert.equal(invalid.state.cookie.length,1);
 assert.equal(invalid.state.nodes.length,mounted.nodes.length);
});
