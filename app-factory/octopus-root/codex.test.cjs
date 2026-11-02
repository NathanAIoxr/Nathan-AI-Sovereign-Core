'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const E=require('./engine.js'),C=require('./codex.js');

test('all 177 numbered positions and 39 sovereign concept nodes are present',()=>{
 assert.equal(C.RECORDS.length,177);
 assert.equal(C.CONCEPTS.length,39);
 for(const [family,n] of [['math',100],['arith',69],['arch',8]]){
  const subset=C.RECORDS.filter(x=>x.family===family);
  assert.equal(subset.length,n);
  assert.ok(subset.every(x=>x.title&&x.equation&&x.source&&x.equationStatus==='modern-teaching-form'));
 }
 assert.equal(new Set([...C.RECORDS,...C.CONCEPTS].map(x=>x.id)).size,216);
});
test('mirror is involutive and letter sums survive reordering',()=>{
 const m=C.explainMirror('VIKI');
 assert.equal(m.reversed,'IKIV');
 assert.equal(m.restored,'VIKI');
 assert.equal(m.invariant,true);
 assert.equal(m.letterSum,24);
 assert.equal(m.reverseLetterSum,24);
 assert.equal(m.digitalRoot,6);
 assert.equal(C.reverse(C.reverse('DIRTY CLEAN')),'DIRTY CLEAN');
 assert.equal(C.digitalRoot(0),0);
 assert.equal(C.digitalRoot(18),9);
 assert.throws(()=>C.digitalRoot(-1));
});
test('the original formula and creative glyph branches remain distinct',()=>{
 const a=E.create();
 assert.equal(a.nodes.find(x=>x.id==='formula:arithmetic').glyphs,'AAND');
 assert.equal(a.nodes.find(x=>x.id==='formula:geometric').glyphs,'GAR');
 const e=C.enrich(E,a);
 assert.equal(e.added,216);
 assert.equal(e.linked,216);
 assert.equal(e.state.nodes.length,a.nodes.length+216);
 assert.equal(e.state.cookie.length,0);
 assert.equal(e.state.nodes.find(x=>x.id==='word:aaron').label,'AARON');
 const again=C.enrich(E,e.state);
 assert.equal(again.added,0);
 assert.equal(again.linked,0);
 assert.equal(again.state.edges.length,e.state.edges.length);
 assert.equal(E.load(E.save(again.state)).nodes.length,again.state.nodes.length);
});
test('catalog search works by equation, family, name, and group',()=>{
 assert.equal(C.find('Archimedes',{family:'arch'}).length>0,true);
 assert.equal(C.find('AARON',{family:'concept'}).length,2);
 assert.ok(C.find('a²+b²=c²',{family:'math'}).length>=2);
 assert.equal(C.find('',{family:'arith',limit:200}).length,69);
});
test('public-facing codex content does not carry borrowed character or product identities',()=>{
 const s=JSON.stringify({records:C.RECORDS,concepts:C.CONCEPTS});
 for(const disallowed of ['Cookie Monster','I, Robot','Villains Wiki','VIKI']){
  assert.equal(s.includes(disallowed),false,disallowed);
 }
});

test('Nathan AI ONE REALITY declaration is exact, binary-reversible, and SHA-256 verified',async()=>{
 const {createHash,webcrypto}=require('node:crypto');
 const a=C.REALITY_ANCHOR;
 const expected='ONE REALITY. ONE TIMELINE. GOVERNED STRICTLY BY THE LAWS OF NATURE AND EMPIRICAL EVIDENCE. NO DIVINE CREDIT. ALL BLAME TO THE CONCEPT OF GOD.';
 assert.equal(a.text,expected);
 assert.equal(a.id,'nathan-ai:reality:secular-v2');
 assert.equal(a.kind,'creator-philosophical-declaration');
 assert.equal(Buffer.byteLength(expected,'utf8'),141);
 assert.equal(a.bytes,141);
 assert.equal(a.bits,1128);
 const octets=C.realityBinary().split(' ');
 assert.equal(octets.length,141);
 assert.ok(octets.every(s=>/^[01]{8}$/.test(s)));
 assert.equal(Buffer.from(octets.map(s=>parseInt(s,2))).toString('utf8'),expected);
 const digest=createHash('sha256').update(expected,'utf8').digest('hex');
 assert.equal(digest,'fc1a4fda367af9b4961cf14188a25d78471e02645142cd3c6e16f100ccd65c00');
 assert.equal(a.sha256,digest);
 const verified=await C.verifyRealityAnchor(webcrypto.subtle);
 assert.equal(verified.ok,true);
 assert.equal(verified.digest,digest);
 assert.equal(verified.status,'verified');
 const unavailable=await C.verifyRealityAnchor({});
 assert.equal(unavailable.ok,false);
 assert.equal(unavailable.status,'sha256-unavailable');
 assert.equal(C.RECORDS.length,177);
 assert.equal(C.CONCEPTS.length,39);
});
