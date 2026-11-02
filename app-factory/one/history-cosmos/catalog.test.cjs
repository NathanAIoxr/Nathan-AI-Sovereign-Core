'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const api=require('./catalog.js');
const page=fs.readFileSync(path.join(__dirname,'index.html'),'utf8');
test('independent public collections and stable source-status labels',()=>{
 assert.equal(api.SCHEMA,'nathan-one.humanity-tabor-cosmos.v1');
 assert.equal(api.GROUPS.length,6);
 assert.ok(api.RECORDS.length>=60);
 assert.equal(new Set(api.RECORDS.map(r=>r.id)).size,api.RECORDS.length);
 for(const r of api.RECORDS){
  assert.ok(api.GROUPS.some(g=>g.id===r.group),r.id);
  assert.ok(api.STATUS[r.kind],r.id);
  for(const key of ['title','source','period','summary'])assert.ok(typeof r[key]==='string'&&r[key].length>3,r.id+' '+key);
 }
});
test('search, collection, evidence-kind and archive export are real controls',()=>{
 assert.ok(api.filter('Taborites').some(r=>r.id==='T05'));
 assert.ok(api.filter('Nephilim').some(r=>r.id==='U04'));
 assert.ok(api.filter('DNA','micro-macro').some(r=>r.id==='M10'));
 assert.equal(api.filter('anything','tabor','creative-fiction').every(r=>r.group==='tabor'&&r.kind==='creative-fiction'),true);
 assert.ok(api.filter('','tabor').every(r=>r.group==='tabor'));
 assert.ok(api.filter('','all','creative-fiction').every(r=>r.kind==='creative-fiction'));
 const p=api.exportPack('Taborites');
 assert.equal(p.scope,'public_derived_index_only');
 assert.equal(p.records.length,api.filter('Taborites').length);
 assert.deepEqual(p.taborTrinity,['THE TABORIC LIGHT (Field)','THE LIGHT OF TABOR (Particle)','THE TABOR LIGHT CIPHER (Wave)']);
 assert.ok(!JSON.stringify(p).includes('file_00000000'));
});
test('distinct historically grounded organizations and fictional material never merge',()=>{
 const byId=id=>api.RECORDS.find(x=>x.id===id);
 assert.equal(byId('T05').kind,'documented');
 assert.equal(byId('T10').kind,'documented');
 assert.notEqual(byId('T05').title,byId('T10').title);
 assert.equal(byId('U07').kind,'creative-fiction');
 assert.equal(byId('B02').kind,'creative-fiction');
 assert.equal(byId('T03').kind,'research-lead');
 assert.equal(byId('M07').kind,'authored-framework');
});
test('browser UI accessible, linked to ONE and safe local-only export',()=>{
 for(const href of ['../index.html','../humanity-archive/index.html','../nathan-matrix/index.html','../../nathan-ai/index.html','./catalog.js']){
  assert.ok(page.includes('href="'+href+'"')||page.includes('src="'+href+'"'),href);
 }
 assert.match(page,/type="search"/);
 assert.match(page,/id="group"/);
 assert.match(page,/id="kind"/);
 assert.match(page,/id="export"/);
 assert.match(page,/textContent/);
 assert.doesNotMatch(page,/<iframe|fetch\(|XMLHttpRequest|navigator\.sendBeacon/i);
});
