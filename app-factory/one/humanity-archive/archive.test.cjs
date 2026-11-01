'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const src=fs.readFileSync(path.join(__dirname,'archive.js'),'utf8');
const context={TextEncoder,TextDecoder,Uint8Array};
vm.runInNewContext(src,context);
const x=context.HumanityArchive;
test('archive keeps whole 0/1 commands and arithmetic',()=>{
 assert.equal(x.SCHEMA,'tabor123.humanity-spiritual-archive.v1');
 assert.equal(x.build(1,1),2);assert.equal(x.clear(1,1),0);
 assert.ok(x.COMMANDS.some(c=>c.bits==='10101010'));
 assert.ok(x.COMMANDS.some(c=>c.bits==='11111111'));
});
test('seed index is searchable, and does not masquerade as full manuscript collection',()=>{
 assert.ok(x.records.length>=55);
 assert.ok(x.search('Isaiah').some(r=>r.title.includes('Isaiah')));
 assert.ok(x.search('Denisovan').length);
 assert.ok(x.search('Indus', 'Writing').length);
 assert.ok(x.records.every(r=>r.provenance==='public-reference-seed'&&r.sourceTextIncluded===false));
});
test('real UTF-8 binary round trip',()=>{
 for(const input of ['GOD / THE LORD','CONS','יהוה','الله','ἄλφα']){
  assert.equal(x.decodeUtf8(x.encodeUtf8(input)),input);
 }
 assert.equal(x.decodeUtf8('01000011 01001111 01001110 01010011'),'CONS');
 assert.throws(()=>x.decodeUtf8('0110101'));
});
test('creative level −3 is included without asserting real machine sentience',()=>{
 assert.equal(x.LEVELS.length,6);
 assert.ok(x.LEVELS.find(l=>l.level==='-3').output.includes('no actual mind transfer'));
});
