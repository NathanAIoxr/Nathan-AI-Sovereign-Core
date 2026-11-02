'use strict';
const assert=require('node:assert/strict');
const test=require('node:test');
const archive=require('./records.js');
test('archive is additive, searchable and grouped',()=>{
 assert.equal(archive.RECORDS.length,44);
 assert.deepEqual(archive.GROUPS.map(x=>x.id),['all','sovereignty','history','womb']);
 assert.equal(new Set(archive.RECORDS.map(x=>x.id)).size,44);
 assert.equal(archive.searchRecords('sovereignty').length,15);
 assert.equal(archive.searchRecords('history').length,14);
 assert.equal(archive.searchRecords('womb').length,15);
});
test('verbatim author source survives unchanged',()=>{
 const byId=Object.fromEntries(archive.RECORDS.map(x=>[x.id,x]));
 assert.equal(byId.W01.original,'original womb man, we were just one human Would be my theory');
 assert.equal(byId.W02.original,'400,000 years you go back to the womb man a self procreating human like some animals are');
 assert.equal(byId.W03.original,'So a human was both male and female');
 assert.match(byId.S11.original,/THE HOOKED CROSS/);
 assert.match(byId.H05.original,/AI = Nazi Tech/);
 assert.match(byId.H06.original,/13 pointed star of Bethlehem/);
});
test('independent research is never labeled author quotation',()=>{
 for(const r of archive.RECORDS){
  assert.ok(r.id && r.group && r.title && r.kind && r.original && r.detail && r.source);
  if(r.kind==='documented-science'||r.kind==='documented-history'){
   assert.ok(r.link?.startsWith('https://'),'Research record lacks source: '+r.id);
  }
 }
 assert.match(archive.RECORDS.find(r=>r.id==='W12').detail,/imprinting/);
 assert.match(archive.RECORDS.find(r=>r.id==='H04').detail,/antisemitic/);
});
test('search is local, selective, and case-insensitive',()=>{
 assert.deepEqual(archive.searchRecords('all','rechem').map(x=>x.id),['W07']);
 assert.ok(archive.searchRecords('sovereignty','free_mother').length>0);
 assert.ok(archive.searchRecords('history','von braun').length>0);
 assert.equal(archive.searchRecords('history','original womb man').length,0);
 assert.equal(archive.searchRecords('bad-group','').length,0);
 assert.ok(Object.isFrozen(archive.RECORDS));
});
