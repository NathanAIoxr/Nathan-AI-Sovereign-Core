'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const repo=path.resolve(__dirname,'../..');
const read=rel=>fs.readFileSync(path.join(repo,rel),'utf8');
const data=JSON.parse(read('app-factory/sites/church-of-innocence/records.json'));
test('Church source index preserves 101 points and both related catalogs',()=>{
 assert.equal(data.schema,'nathan-tabor.innocence-source-index.v1');
 assert.equal(data.points.length,101);
 assert.equal(data.faithWorks.length,133);
 assert.equal(data.recoveredFamilies.length,46);
 assert.deepEqual(data.points.map(x=>x.number),Array.from({length:101},(_,i)=>i+1));
 for(const key of ['points','faithWorks','recoveredFamilies']){
   const ids=data[key].map(x=>x.id);
   assert.equal(new Set(ids).size,ids.length);
   assert.ok(data[key].every(x=>x.title&&x.category&&x.status));
 }
});
test('privacy boundary: publish only titles, stage labels and categories',()=>{
 const serialized=JSON.stringify(data);
 for(const forbidden of ['account_id=personal','gmail.com/mail','/Main Database/','private-key','seed phrase','authorization: Bearer']){
   assert.equal(serialized.includes(forbidden),false,'Public data exposed '+forbidden);
 }
 assert.match(data.publicScope,/No original manuscript bytes/);
});
test('Branded HTML entrypoints and SVG artwork exist with correct local references',()=>{
 const pages=['index.html','app-factory/nathan-ai/index.html','app-factory/nathan-ai/websites/index.html','app-factory/sites/index.html','app-factory/sites/nathan-tabor/index.html','app-factory/sites/church-of-innocence/index.html'];
 for(const page of pages){
  const html=read(page);
  assert.match(html,/nathan-tabor\.css/);
  assert.match(html,/nathan-tabor\.js/);
  const refs=[...html.matchAll(/(?:href|src)="([^"]+)"/g)].map(m=>m[1]).filter(u=>u&&!u.startsWith('#')&&!/^[a-z][a-z0-9+.-]*:/i.test(u));
  for(const u of refs){
    const dest=path.resolve(path.dirname(path.join(repo,page)),decodeURIComponent(u.split(/[?#]/)[0]));
    assert.ok(fs.existsSync(dest),page+' -> '+u);
    if(fs.statSync(dest).isDirectory())assert.ok(fs.existsSync(path.join(dest,'index.html')),page+' -> '+u+' directory lacks index');
  }
 }
 assert.match(read('branding/nathan-tabor-banner.svg'),/<svg\b/);
});
test('Branded JavaScript parses and new sites have no private intake/payment forms',()=>{
 for(const file of ['branding/nathan-tabor.js','app-factory/sites/church-of-innocence/church.js'])assert.doesNotThrow(()=>new vm.Script(read(file)));
 for(const file of ['app-factory/sites/nathan-tabor/index.html','app-factory/sites/church-of-innocence/index.html']){
   const html=read(file);
   assert.doesNotMatch(html,/<form\b|<iframe\b|stripe\.com|paypal\.com/i);
   assert.match(html,/<main\b/);
 }
});
test('Public release builder includes editable branding assets',()=>{
 assert.match(read('tools/release/build.py'),/PUBLIC_ROOTS=.*'branding\/'/);
 assert.match(read('app-factory/nathan-ai/websites/registry.js'),/sites\/church-of-innocence\/index\.html/);
 assert.match(read('README.md'),/branding\/nathan-tabor-banner\.svg/);
});
