'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const M=require('./engine.js'),Root=require('../engine.js');
const close=(a,b,relative=2e-5)=>assert.ok(Math.abs(a-b)<=relative*Math.max(1e-18,Math.abs(a),Math.abs(b)),a+' != '+b);
test('ledger has unique original gates and a boundary for each',()=>{const a=M.audit();assert.equal(a.familyCount,5);assert.equal(a.gateCount,25);assert.equal(a.uniqueIds,true);assert.equal(a.allHaveBoundaries,true);});
test('every gate evaluates in both directions with seeded valid values',()=>{for(const g of M.GATES){let a=M.calculate(g.id,{},'forward');assert.ok(Number.isFinite(a.value),g.id);let inverse=M.calculate(g.id,{},'backward');assert.ok(Number.isFinite(inverse.value),g.id)}});
test('mathematically invertible gates round trip their forward output',()=>{const exceptions=new Set(['warp-wall','vacuum-gap','nerve-echo','pattern-pulse','choice-entropy','odd-one-out','quiet-coil','pair-mirror']);
for(const g of M.GATES){if(exceptions.has(g.id))continue;const f=M.calculate(g.id,{},'forward');const b=M.calculate(g.id,{[g.backward.key]:f.value},'backward');close(b.value,g.forward.value,0.00001);}});
test('two independent full inverse checks',()=>{
 let v=M.calculate('frequency-gate',{density:7.144949420948599e16},'forward').value;close(M.calculate('frequency-gate',{frequency:v},'backward').value,7.144949420948599e16);
 let e=M.calculate('bit-heat',{erasures:1e10,temperature:310.15},'forward').value;close(e,2.9681136706905544e-11);close(M.calculate('bit-heat',{energy:e},'backward').value,1e10);
});
test('ideal vacuum formula and ideal plasma constraint stay separate',()=>{
 close(M.calculate('vacuum-gap',{gap:1e-7},'forward').value,-4.33375257,0.00001);
 assert.throws(()=>M.calculate('wave-fade',{plasmaFrequency:1e9,waveFrequency:2e9},'forward'));
});
test('no speed above c or implied physical interface',()=>{
 assert.throws(()=>M.calculate('clock-bender',{velocity:M.C},'forward'));
 assert.throws(()=>M.calculate('bit-heat',{temperature:-1},'forward'));
 assert.throws(()=>M.calculate('tunnel-tater',{height:1,kinetic:1.5},'forward'));
});
test('inverse choice entropy and shape are numerical bounded models',()=>{
 let f=M.calculate('choice-entropy',{probability:.25},'forward').value;close(M.calculate('choice-entropy',{bits:f},'backward').value,.25);
 const u=M.calculate('warp-wall',{radius:10},'forward').value;close(M.calculate('warp-wall',{shape:u},'backward').value,10,.00002);
});
test('root graft creates and links 31 project/formula nodes, is idempotent',()=>{
 const original=Root.create(),n=original.nodes.length,e=original.edges.length;
 const first=M.graft(original,Root);
 assert.equal(first.added,31);assert.equal(first.attached,31);assert.equal(first.state.nodes.length,n+31);assert.equal(first.state.edges.length,e+31);
 assert.equal(original.nodes.length,n);
 assert.equal(first.state.cookie.length,0);
 const again=M.graft(first.state,Root);
 assert.equal(again.added,0);assert.equal(again.attached,0);
 assert.equal(again.state.nodes.length,n+31);
 const snap=Root.load(Root.save(again.state));assert.equal(snap.nodes.length,n+31);
});
test('names and label text avoid inherited third-party entertainment branding',()=>{
 const s=JSON.stringify({family:M.FAMILIES,gates:M.GATES});
 for(const term of ['lightsaber','hyperdrive','repulsorlift','star wars','the matrix','cookie monster','kyber','neo','jedi'])assert.ok(!new RegExp(term,'i').test(s),term);
});
