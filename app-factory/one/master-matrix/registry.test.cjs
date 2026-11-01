'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const dir=__dirname;
const json=JSON.parse(fs.readFileSync(path.join(dir,'registry.json'),'utf8'));
function parsedLines(s){return s.split(/\r?\n/).filter(x=>/^•\s*\d+\.\s/.test(x));}
test('all 202 authored entries are distinct and consecutively numbered',()=>{
 assert.equal(json.schema,'tabor.one.master-matrix-registry.v1');
 assert.deepEqual(json.collections.map(x=>x.count),[101,101]);
 assert.equal(json.collections.length,2);
 for(const col of json.collections){
  assert.equal(col.entries.length,101);
  assert.equal(new Set(col.entries.map(e=>e.title)).size,101);
  assert.ok(col.entries.every((e,i)=>e.number===i+1&&e.title&&e.description&&e.claimStatus==='authored-description-unverified'));
 }
});
test('raw source lines are preserved verbatim in structured record fields',()=>{
 for(const [i,col] of json.collections.entries()){
  const raw=fs.readFileSync(path.join(dir,col.sourceFile),'utf8');
  const lines=parsedLines(raw);assert.equal(lines.length,101);
  for(let n=0;n<101;n++){
   const line=lines[n],entry=col.entries[n],source=i===0?
    '• '+(n+1)+'. '+entry.title+': '+entry.description:
    '• '+(n+1)+'. '+entry.title+' – '+entry.description;
   assert.equal(line,source,'Mismatch in '+col.id+' position '+(n+1));
  }
 }
});
test('collections stay independently named and original punctuation persists',()=>{
 const a=json.collections[0],b=json.collections[1];
 assert.equal(a.entries[0].title,'THE THINKER Anti-Ransomware Layer');
 assert.equal(a.entries[100].title,'The Sovereign Monad Network Blueprint');
 assert.equal(b.entries[0].title,'EVOL Alignment');
 assert.equal(b.entries[100].title,'The Absolute Baseline Mirror Reset');
 assert.ok(b.entries.find(x=>x.number===17).title.includes('52-Week'));
});
test('offline list caches index, both source originals and runtime data but not credentials',()=>{
 const sw=fs.readFileSync(path.join(dir,'../../sw.js'),'utf8');
 for(const name of ['one/master-matrix/index.html','one/master-matrix/registry.json','one/master-matrix/infrastructures-original.txt','one/master-matrix/reversals-original.txt'])assert.ok(sw.includes(name),name);
 assert.match(sw,/request\.headers\.has\('authorization'\)/);
 assert.match(sw,/url\.search/);
 assert.match(sw,/URLS\.has\(url\.pathname\)/);
});
