const test=require('node:test');
const assert=require('node:assert/strict');
const shop=require('./shop-core.js');

test('five named stations remain independent and disconnected',()=>{
  const s=shop.initialState();
  assert.deepEqual(s.printers.map(p=>p.matrix),['BODY','SOUL','SHADOW','MIND','SPIRIT']);
  assert.ok(s.printers.every(p=>p.connectedHardware===false));
  assert.equal(s.mode,'SIMULATION');
});

test('five educational jobs queue and assemble only in simulation',()=>{
  const s=shop.initialState();
  assert.equal(shop.queueFive(s),true);
  assert.equal(shop.queueFive(s),false);
  assert.equal(s.jobs.length,5);
  for(let i=0;i<9;i++) assert.equal(shop.advance(s),false);
  assert.equal(shop.advance(s),true);
  assert.ok(s.jobs.every(j=>j.progress===100 && j.actualFabrication===false));
  assert.equal(s.simulatedJoined,true);
});

test('pause/resume and reset are scoped to the simulation',()=>{
  const s=shop.initialState(); shop.queueFive(s); shop.advance(s);
  shop.pause(s);assert.ok(s.jobs.every(j=>j.status==='PAUSED'));
  shop.resume(s);assert.ok(s.jobs.every(j=>j.status==='SIMULATING'));
  shop.reset(s);assert.equal(s.jobs.length,0);
  assert.equal(s.simulatedJoined,false);
});

test('jewelry and gates remain separate source objects',()=>{
  const s=shop.initialState();
  const ring=shop.addArtifact(s,{id:'R1',name:'Carrying ring',objectClass:'structural_hardware',scripture:'Exodus 25:12'});
  const gate=shop.addArtifact(s,{id:'G1',name:'Visionary gate',objectClass:'visionary_gate',scripture:'Revelation 21:21',interpretations:['made_of pearl']});
  assert.notEqual(ring.objectClass,gate.objectClass);
  assert.equal(s.artifactCatalog.length,2);
  assert.throws(()=>shop.addArtifact(s,{id:'R1',name:'Repeated',objectClass:'jewelry'}),/Duplicate/);
  assert.throws(()=>shop.addArtifact(s,{name:'Wrong',objectClass:'gate_plus_jewelry'}),/Unknown/);
});
