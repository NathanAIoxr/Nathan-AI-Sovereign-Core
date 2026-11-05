'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const E=require('./engine.js');
const catalog=JSON.parse(fs.readFileSync(path.join(__dirname,'catalog.json'),'utf8'));
test('entire current source atlas has valid jobs and distinct identity records',()=>{
 const check=E.validateCatalog(catalog);
 assert.equal(check.recordCount,357);
 assert.equal(check.jobCount,12);
 assert.equal(catalog.recordKinds['source-component'],107);
 assert.equal(catalog.recordKinds['historical-title'],92);
 assert.equal(catalog.recordKinds['architecture-module'],54);
 assert.equal(catalog.recordKinds['browser-entrypoint'],76);
 assert.equal(catalog.recordKinds['operation-spec'],13);
 assert.equal(catalog.recordKinds['private-archive-anchor'],14);
 assert.equal(catalog.recordKinds['recovered-historical-source'],1);
 assert.equal(Object.values(E.summarize(catalog).kind).reduce((a,b)=>a+b,0),357);
 assert.equal(catalog.records.filter(x=>x.kind==='browser-entrypoint'&&!x.sourceUrl).length,0);
 assert.ok(catalog.records.every(x=>x.nextTask));
});
test('historical Hack D Hack and branch-only Hall of Mirrors stay separate and not marked deployed',()=>{
 const a=catalog.records.find(x=>x.name==='NATHAN AI Hack D Hack / Glyphstream Breach Engine');
 const b=catalog.records.find(x=>x.name==='THE NATHAN TABOR HALL OF MIRRORS');
 assert.equal(a.kind,'historical-title');
 assert.equal(a.status,'locate-original');
 assert.equal(a.job,'defense');
 assert.equal(b.kind,'recovered-historical-source');
 assert.equal(b.job,'defense');
 assert.match(b.sourceUrl,/tree\/main\/app-factory\/one\/hall-of-mirrors/);assert.match(b.historicalSourceUrl,/feat\/hall-mirrors/);
 assert.ok(!catalog.records.some(r=>r.status==='complete'||r.status==='verified-live'));
});
test('case insensitive functional search and kind/job/status filters',()=>{
 const a=E.filterRecords(catalog.records,{q:'HACK D HACK'});
 assert.ok(a.some(x=>x.name.includes('Hack D Hack')));
 const b=E.filterRecords(catalog.records,{job:'defense',kind:'historical-title',status:'locate-original'});
 assert.ok(b.some(x=>x.name.includes('GUARDRAILAI')));
 assert.ok(b.every(x=>x.job==='defense'&&x.kind==='historical-title'&&x.status==='locate-original'));
 const z=E.filterRecords(catalog.records,{q:'this will never match'});
 assert.equal(z.length,0);
});
test('completion requires all five owner-reported gates and recorded evidence',()=>{
 const r=E.blankReview('legacy:REF-AI -003');
 let p=E.gateProgress(r);assert.deepEqual(p,{passed:0,blocked:0,total:5,ownerReportedComplete:false,percent:0});
 for(const gate of E.GATES){r.gates[gate.id]={status:'passed',evidence:'Owner reviewed and manually checked '+gate.id};}
 p=E.gateProgress(r);assert.equal(p.ownerReportedComplete,true);assert.equal(p.percent,100);
 r.gates.tests.evidence='';
 assert.throws(()=>E.gateProgress(r),/evidence note/);
 r.gates.tests={status:'blocked',evidence:'Missing original tests'};
 assert.equal(E.gateProgress(r).ownerReportedComplete,false);
});
test('owner reviews export and re-import with schema and ID safety',()=>{
 const id=catalog.records[0].id;const review=E.blankReview(id);
 review.notes='Need owner-provided private source';
 review.gates.source={status:'blocked',evidence:'Original private file is not accessible'};
 const pack=E.reviewExport(catalog,{[id]:review});
 assert.equal(pack.reviewStatus,'owner-reported-not-independent-verification');
 const imported=E.reviewImport(catalog,pack);
 assert.equal(imported[id].gates.source.status,'blocked');
 assert.throws(()=>E.reviewImport(catalog,{schema:'unknown',reviews:{}}),/Invalid review import/);
 const injection=structuredClone(pack);injection.reviews[id].id='different';
 assert.throws(()=>E.reviewImport(catalog,injection),/identity mismatch/);
});
test('CSV guards against spreadsheet formula injection',()=>{
 const data=E.exportCsv([{id:'x',kind:'historical-title',name:'=HYPERLINK("evil","bad")',job:'defense',status:'locate-original',nextTask:'A'}]);
 assert.match(data,/'=HYPERLINK/);
 assert.match(data,/""evil""/);
 assert.ok(data.includes("'=HYPERLINK"));
});
test('the current job plans exist for every record without declaring completion',()=>{
 const map=new Map(catalog.jobs.map(j=>[j.id,j]));
 for(const rec of catalog.records){const tasks=E.tasksFor(rec,map.get(rec.job));assert.ok(tasks.length>=5);assert.ok(tasks.some(x=>x.toLowerCase().includes('original')||x.toLowerCase().includes('source')));}
});
