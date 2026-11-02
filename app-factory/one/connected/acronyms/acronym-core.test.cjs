'use strict';const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),lib=require('./acronym-core.js');
test('original 007 archive format preserves exact authored text without requiring the private source',()=>{
 const source={meta:{title:'TABOR TOTALITY ARCHIVE — MASTER EXPANSION 007'},records:[
   {id:'EX007-0136',title:'SIN',description:'Saving Innocence Now',group:'Acronyms & authored expansions',stage:'authored_expansion',source:'authored source'},
   {id:'EX007-0143',title:'WRATH',description:'Weilding Righteousness Almightily Towards Harm',group:'Acronyms & authored expansions',stage:'authored_expansion',source:'authored source'},
   {id:'EX007-0001',title:'Different source',description:'Excluded from acronym group',group:'Original ciphers & code engines'}]};
 const records=lib.jsonRecords(source);
 assert.equal(records.length,2);
 assert.ok(records.some(x=>x.term==='SIN'&&x.definition==='Saving Innocence Now'));
 assert.ok(records.some(x=>x.term==='WRATH'&&x.definition.startsWith('Weilding')));
});
test('Airtable CSV retains duplicate labels with separate source keys',()=>{
 const csv='Acronym / Label,Record Key,Exact Expansion / Meaning,Department,Definition Type\nSIN,X1,"Saving Innocence Now",Creative,author\nSIN,X2,"Sovereign Invariant Network",Coin,author\n';
 const r=lib.csvRecords(csv);assert.equal(r.length,2);
 assert.equal(lib.merge([],r).records.length,2);
 assert.equal(lib.merge(r,r).duplicates,2);
});
test('quoted CSV fields preserve unusual original spelling and punctuation',()=>{
 const csv='Acronym / Label,Record Key,Exact Expansion / Meaning\nWRATH,1,"Weilding Righteousness, Almightily Towards Harm"\n';
 assert.equal(lib.csvRecords(csv)[0].definition,'Weilding Righteousness, Almightily Towards Harm');
});
test('coin registry design never implies an online miner or balance',()=>{
 const x={schema:'nathan-ai.sovereign-coin-matrix.v1',coins:[{ticker:'SIN',number:1,name:'Sovereign Invariant Network',definition:'Core governance matrix ledger asset'}]};
 const r=lib.jsonRecords(x);assert.equal(r.length,1);assert.match(r[0].mining,/not live asset/);
});
test('reject unknown schemas and too-large file bodies',()=>{
 assert.throws(()=>lib.parse('a.json','{}'),/Unrecognized/);
 assert.throws(()=>lib.parse('a.json',' '.repeat(lib.MAX_FILE_BYTES+1)),/too large/);
});
test('A–Z/Z–A search and source-name collisions remain independent',()=>{
 const records=[{id:'1',term:'SIN',definition:'Saving Innocence Now',context:'Creative',kind:'author',mining:''},{id:'2',term:'SIN',definition:'Sovereign Invariant Network',context:'Sovereign Coins',kind:'author',mining:'Coin design'},{id:'3',term:'BAT',definition:'Brilliance and Transformation',context:'Creative',kind:'author',mining:''}];
 assert.equal(lib.search(records,'SIN').length,2);
 assert.equal(lib.search(records,'','mining').length,1);
 assert.equal(lib.search(records,'','all',true)[2].term,'BAT');
});

test('117-record private recovery schema imports all variants with source and status preserved',()=>{
 const data={title:'NATHAN AI — Three-Year Acronym / Acrostic Recovery',
  range_start:'2023-11-02',range_end:'2026-11-02',record_count:3,records:[
  {term:'JNT',expansion:'Justice Node Tracker',status:'user_defined_recalled',source:'2025 source',collection:'Supplementary retrieval',source_id:''},
  {term:'JNT',expansion:'Justice Nullification Threshold',status:'user_defined_recalled',source:'2025 source',collection:'Supplementary retrieval',source_id:''},
  {term:'NATHAN [fictional]',expansion:'Assistant-invented expansion',status:'assistant_origin_fiction',source:'assistant response',collection:'Totality Expansion 007',source_id:'EX007-123'}]};
 const rows=lib.jsonRecords(data);
 assert.equal(rows.length,3);
 assert.equal(lib.merge([],rows).records.length,3);
 assert.equal(rows[0].id,'ACR-20261102-0001');
 assert.equal(rows[1].id,'ACR-20261102-0002');
 assert.equal(rows[2].kind,'assistant_origin_fiction');
 assert.equal(rows[2].sourceId,'EX007-123');
 assert.equal(lib.search(rows,'JNT').length,2);
 assert.throws(()=>lib.jsonRecords({...data,record_count:4}),/count mismatch/);
});