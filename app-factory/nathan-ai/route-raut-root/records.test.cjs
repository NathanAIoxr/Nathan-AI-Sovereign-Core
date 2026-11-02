'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const r=require('./records.js');

test('additive registry is complete, unique and source-attributed',()=>{
 assert.equal(r.SCHEMA,'nathan-one-route-raut-root.v1');
 assert.equal(r.MIRRORS.length,6);
 assert.equal(r.VOWELS.length,5);
 assert.equal(r.STATES.length,4);
 assert.equal(r.ORIGINAL_EXCERPTS.length,10);
 assert.equal(r.LINKS.length,12);
 assert.equal(r.searchRecords('').length,37);
 assert.equal(new Set(r.ORIGINAL_EXCERPTS.map(x=>x.id)).size,10);
 assert.ok(r.ORIGINAL_EXCERPTS.every(x=>x.original&&x.source&&x.kind));
 assert.equal(r.searchRecords('PĒS','original').length,2);
 assert.ok(r.searchRecords('babel','connections').length>0);
});
test("author's literal strings and orthography remain intact",()=>{
 const by=Object.fromEntries(r.ORIGINAL_EXCERPTS.map(x=>[x.id,x.original]));
 assert.equal(by.Q02,'route it and root it and Raut it in binary code');
 assert.equal(by.Q03,'piece and peace - both come from the root word /pēs/');
 assert.match(by.Q04,/PES with a dash over the E/);
 assert.equal(by.Q05,'# TABOR BINARY CODE CONNECTION (RAUT ROOT ROUTE MASTER KEY)');
 assert.equal(by.Q08,'1(30) Human Form');
 assert.equal(by.Q09,'Drop the Label → Extract Attribute & Function → Ancient Linguistic Deep-Dive (Hebrew, Greek, Arabic, Latin) → Restore the Label → KJV Alignment');
});
test('true mirror transformations are separate from symbolic CARDINAL / DRACULA association',()=>{
 assert.deepEqual(r.MIRRORS.map(x=>[x.word,x.reverse]),[['ROOT','TOOR'],['ROUTE','ETUOR'],['RAUTE','ETUAR'],['PYTHON','NOHTYP'],['CARDINAL','LANIDRAC'],['DRACULA','ALUCARD']]);
 for(const x of r.MIRRORS){assert.equal(r.reverseWord(x.word),x.reverse);assert.equal(r.reverseWord(x.reverse),x.word)}
 assert.equal(r.reverseWord('אבג'),'גבא');
 assert.equal(r.reverseWord(''),'');
});
test('binary states are four whole-number 2-bit values, not fractional guesses',()=>{
 assert.deepEqual(r.binaryPairs().map(x=>x.binary),['00','01','10','11']);
 assert.deepEqual(r.binaryPairs().map(x=>x.decimal),[0,1,2,3]);
 for(const x of r.STATES)assert.equal(parseInt(x.binary,2),x.decimal);
 assert.equal(r.VOWELS.map(x=>x.forward).join(' '),'RA RE RI RO RU');
 assert.equal(r.VOWELS.map(x=>x.reverse).join(' '),'AR ER IR OR UR');
});
test('search respects record sections and does not change original source',()=>{
 const before=JSON.stringify(r.ORIGINAL_EXCERPTS);
 assert.equal(r.searchRecords('route','vowels').length,0);
 assert.equal(r.searchRecords('RuAcH','vowels').length,2);
 assert.equal(r.searchRecords('DNA','original').length,0);
 assert.ok(r.searchRecords('original','nonexistent').length===0);
 assert.equal(JSON.stringify(r.ORIGINAL_EXCERPTS),before);
 assert.ok(Object.isFrozen(r.VOWELS));
});
