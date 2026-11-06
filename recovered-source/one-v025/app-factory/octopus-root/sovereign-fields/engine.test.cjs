'use strict';
const test=require('node:test'), assert=require('node:assert/strict'), crypto=require('node:crypto');
const E=require('./engine.js'), Root=require('../engine.js');
const near=(a,b,tol=1e-9)=>assert.ok(Math.abs(a-b)<=tol*Math.max(1,Math.abs(a),Math.abs(b)),a+' != '+b);
test('original branch is finite, namespaced and provenance-labelled',()=>{
  const ids=E.catalog.map(n=>n.id);assert.equal(new Set(ids).size,ids.length);
  assert.ok(ids.length>=25);assert.ok(E.catalog.every(n=>n.id.startsWith('field:')));
  assert.ok(E.catalog.some(n=>n.status==='FICTION'));assert.ok(E.catalog.some(n=>n.status==='LAW'));
});
test('backward and forward root installation preserve old nodes and are idempotent',()=>{
  const a=Root.create(),r=E.install(Root,a);
  assert.equal(a.nodes.length,15);assert.equal(r.added,E.catalog.length);
  assert.equal(r.linked,E.catalog.length);assert.deepEqual(r.conflicts,[]);
  assert.equal(r.state.nodes.length,a.nodes.length+E.catalog.length);
  assert.ok(r.state.edges.some(x=>x.from==='core:middle'&&x.to==='field:sovereign'));
  const r2=E.install(Root,r.state);assert.equal(r2.added,0);assert.equal(r2.linked,0);
  assert.deepEqual(r2.conflicts,[]);
  assert.equal(Root.load(Root.save(r.state)).nodes.length,r.state.nodes.length);
});
test('invalid node conflicts remain recoverable without overwrite',()=>{
  const a=Root.create(),r=Root.addNode(a,{id:'field:space',label:'CUSTOM USER LABEL',kind:'project',origin:'owner'});
  const out=E.install(Root,r.state);
  assert.equal(out.state.nodes.find(x=>x.id==='field:space').label,'CUSTOM USER LABEL');
  assert.ok(out.conflicts.includes('field:space'));
});
test('metric tensor interval uses coordinate contraction without claiming warp',()=>{
 const flat=[[1,0,0,0],[0,-1,0,0],[0,0,-1,0],[0,0,0,-1]];
 near(E.interval(flat,[10,3,4,0]),75);
 assert.throws(()=>E.interval([],[]));
});
test('time ratio has correct zero and relativistic limit',()=>{near(E.clock(0).gamma,1);near(E.clock(.6).gamma,1.25);assert.throws(()=>E.clock(1))});
test('visible culling and free packet spread are monotonic',()=>{assert.equal(E.visibleWork(10,20),200);assert.ok(E.gaussianWidth(1e-6,1e-6,1e-25)>1e-6)});
test('ideal pair game always needs classical correction information',()=>{
 const r=E.pairedWhisper();assert.equal(r.outcomes.reduce((a,b)=>a+b),1);
 assert.equal(r.classicalBits,2);assert.equal(r.physicalTransfer,false);
});
test('voltage gated currents implement the specified terms',()=>{
 near(E.membrane({v:5,m:1,h:1,n:0,gNa:2,gK:3,gL:0,eNa:1,eK:0,eL:0}),8);
 assert.throws(()=>E.membrane({v:5,m:2,h:1,n:0,gNa:1,gK:1,gL:1,eNa:1,eK:1,eL:1}));
});
test('synthetic FFT identifies a known tone',()=>{
 const bins=E.spectrum(Array.from({length:64},(_,i)=>Math.sin(2*Math.PI*8*i/64)),64);
 const peak=bins.reduce((best,b)=>b.amplitude>best.amplitude?b:best);
 near(peak.hz,8);near(peak.amplitude,1);
 assert.throws(()=>E.spectrum([1,2],64));
});
test('game practice tensor never implies brain uploading',()=>{
 near(E.practiceWeight(10,5,5,2),10);assert.ok(E.practiceWeight(10,0,5,2)<10);
});
test('bit erasure floor and binary information gate',()=>{
 near(E.bitToll(1e10,310.15),2.968e-11,0.005);
 near(E.entropy01(.5),1);near(E.entropy01(0),0);near(E.entropy01(1),0);
 assert.ok(E.informationGate(.25).holevoBoundBits<1);
});
test('ideal pinch scales as square root of line density',()=>{
 const one=E.plasmaCircle(10000,10000,1e16);
 near(E.plasmaCircle(10000,10000,4e16)/one,2);
 assert.throws(()=>E.plasmaCircle(-1,1,1));
});
test('ideal cold plasma cutoff respects propagation condition',()=>{
 const a=E.lightFence(1e16,1e9),b=E.lightFence(1e16,1e6);
 assert.equal(a.propagates,true);assert.ok(a.refractiveIndex>0&&a.refractiveIndex<1);
 assert.equal(b.propagates,false);assert.equal(b.refractiveIndex,null);
});
test('hover static balance and virtual Faraday sign',()=>{
 near(E.floatBalance(1,1).forceNewtons,9.80665);
 near(E.fluxTurn(10,2),-20);assert.throws(()=>E.floatBalance(1,0));
});
test('matrix anomaly and bounded optimization',()=>{
 near(E.patternSentinel([[1,2]],[[1,4]]),2);
 near(E.slope(10,.25,0),5);assert.throws(()=>E.slope(10,2));
 assert.throws(()=>E.patternSentinel([[1,2]],[[1]]));
});
test('SHA-256 seal is integrity metadata, not identity authentication',async()=>{
 const d=await E.handoffSeal('abc',crypto.webcrypto.subtle);
 assert.equal(d,'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
 await assert.rejects(E.handoffSeal('abc',null));
});
test('no unsafe control pathway exists in the field engine',()=>{
 for(const banned of ['triggerRelay','stimulateNerve','pulseEmitter','powerPlasma','drivePropulsion']){
   assert.equal(Object.hasOwn(E,banned),false);
 }
});