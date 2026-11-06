'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const M=require('./matrix.js');

test('master registry records the four user-defined planes in order',()=>{
  assert.deepEqual(M.PLANES.map(p=>p.id),['geometry','logic','phonetic','deployment']);
  assert.equal(M.AXES.length,9);
  assert.equal(M.STACKS.length,11);
});
test('all destination identifiers are unique and implementation states are honest',()=>{
  const result=M.validateRegistry();
  assert.equal(result.ok,true,result.errors.join('; '));
  assert.equal(result.destinationCount,46);
  assert.equal(M.findDestination('kickstarter').status,'local-preparation');
  assert.equal(M.findDestination('kdp').status,'separate-module');
  assert.equal(M.findDestination('shopify').status,'planned');
  assert.equal(M.findDestination('dewey-verified'),null);
  assert.equal(M.DESTINATIONS.filter(x=>x.status==='externally-verified').length,0);
});
test('original source remains character-for-character unchanged in derived packet',()=>{
  const text='  SVIRS  \r\nVIRUS\nαβγ 🔬\n1+1=2\n1-1=0  ';
  const p=M.planFromSource({owner:'Nathan Tabor',source:text,sourceLabel:'Raw original',
    stack:'phonetic',plane:'phonetic',direction:'reverse',
    destinationId:'kickstarter',duoDecimal:'0 → 1',deweySuggested:'500'});
  assert.equal(p.sourceText,text);
  assert.equal(p.dimensions.stack,'phonetic');
  assert.equal(p.indexing.duoDecimal,'0 → 1');
  assert.equal(p.indexing.deweySuggested,'500');
  assert.equal(p.indexing.deweyVerified,false);
  assert.equal(p.approval.submitted,false);
  assert.equal(p.approval.approved,false);
  assert.equal(p.approval.externallyVerified,false);
});
test('missing source or unrecognized provider cannot create package',()=>{
  assert.throws(()=>M.planFromSource({source:'',destinationId:'kickstarter'}),/original source/);
  assert.throws(()=>M.planFromSource({source:'Test',destinationId:'not-real'}),/known destination/);
});
test('source may not be silently truncated',()=>{
  assert.throws(()=>M.planFromSource({source:'a'.repeat(5000001),destinationId:'kickstarter'}),/Split/);
});
test('browser interface fingerprints source locally and has no provider send code',()=>{
  const ui=fs.readFileSync(path.join(__dirname,'matrix-ui.js'),'utf8');
  const html=fs.readFileSync(path.join(__dirname,'matrix.html'),'utf8');
  assert.match(ui,/crypto\.subtle\.digest\('SHA-256'/);
  assert.match(ui,/sourceUtf8Sha256/);
  assert.match(ui,/capturedAtUtc/);
  assert.match(html,/Dewey Decimal candidate/);
  assert.doesNotMatch(ui,/\bfetch\s*\(|\bXMLHttpRequest\b|navigator\.sendBeacon/);
  assert.doesNotMatch(ui,/\.submit\s*\(/);
});
