'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const source=fs.readFileSync(path.join(__dirname,'registry.js'),'utf8');
const context={};
vm.runInNewContext(source,context,{filename:'registry.js'});
const r=context.TaborInventions101;
test('101 source positions, exactly 52 supplied originals, 49 open',()=>{
 assert.equal(r.SCHEMA,'tabor.one.101-inventions.v1');
 assert.equal(r.RECORDS.length,101);
 assert.equal(r.SUBMITTED_COUNT,52);
 assert.equal(r.OPEN_SLOTS,49);
 assert.equal(r.BOOKS.length,13);
 assert.equal(r.CATEGORIES.length,8);
 const filled=r.RECORDS.filter(x=>x.status!=='unfilled');
 assert.equal(filled.length,52);
 assert.ok(filled.every((x,i)=>x.number===i+1&&x.title&&x.description&&x.provenance==='user-supplied-current-turn'));
 assert.ok(r.RECORDS.slice(52).every(x=>x.status==='unfilled'&&x.title===null&&x.description===null));
});
test('search preserves case and spelling, including acrostIC, HEMO and exact Book 12',()=>{
 assert.equal(r.RECORDS[10].title,'THE HEMO HOME');
 assert.ok(r.search('acrostIC')[0].description.includes('acrostIC'));
 assert.equal(r.search('Book 12: Empires Built by Vampires').length,1);
 assert.ok(r.search('Collyn').length===1);
 assert.equal(r.search('T101-101').length,0);
 assert.equal(r.search('T101-101','all',true).length,1);
});
test('unverified inventions and relevant safety reviews remain separate',()=>{
 assert.equal(r.RECORDS[0].review,'professional-safety-review-required');
 assert.equal(r.RECORDS.find(x=>x.title==='The Liquid Copper Feed Line').review,'professional-safety-review-required');
 assert.ok(r.RECORDS.slice(0,52).every(x=>x.status==='authored-description-not-independently-verified'));
});
test('Book 12 assistant draft is labelled separately from original description',()=>{
 const draft=fs.readFileSync(path.join(__dirname,'book-12-assistant-draft.md'),'utf8');
 assert.match(draft,/assistant-generated continuation/);
 assert.match(draft,/A comprehensive historical manual exposing predatory institutional structures throughout the ages/);
 assert.match(draft,/Chapter One — The First Bite/);
});
