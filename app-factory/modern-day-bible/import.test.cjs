'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {openDatabase}=require('../app-shell/server.cjs');
const {importBundle,exportBundle,splitText}=require('./import.cjs'),{assemble,search}=require('./core.js');
function source(id,text){return {id,title:'Related source '+id,url:'https://example.com/'+id,kind:'story',scope:'Related source; project membership unconfirmed',text,original:{format:'text/plain',base64:Buffer.from(text).toString('base64')}}}
test('long Unicode manuscripts import losslessly, remain private, deduplicate and export original bytes',()=>{
 const db=openDatabase(':memory:');try{
 const text='An original paragraph. 🌊\n'.repeat(6000),s=source('manuscript',text),bundle={schema:'one.story-sources.v1',sources:[s,source('index','Index only')]};
 assert.ok(splitText(text).length>1);assert.equal(splitText(text).join(''),text);const first=importBundle(db,bundle);assert.equal(first.imported,2);assert.equal(first.evidence[0].textSha256,first.evidence[0].originalSha256);
 const count=db.prepare('SELECT count(*) n FROM records WHERE app_id=?').get('modern-day-bible').n;assert.equal(importBundle(db,bundle).skipped,2);assert.equal(db.prepare('SELECT count(*) n FROM records WHERE app_id=?').get('modern-day-bible').n,count);
 const rows=db.prepare('SELECT body FROM records WHERE app_id=?').all('modern-day-bible').map(r=>({data:JSON.parse(r.body)}));const sources=assemble(rows),story=sources.find(x=>x.title.includes('manuscript'));assert.equal(story.text,text);assert.equal(story.complete,true);assert.equal(search(sources,'original paragraph').length,1);
 assert.equal(assemble(rows.filter(r=>r.data.part!==2)).find(x=>x.title.includes('manuscript')).complete,false);
 const exported=exportBundle(db);assert.deepEqual(exported.sources.find(x=>x.id==='manuscript'),s);assert.equal(Buffer.from(exported.sources.find(x=>x.id==='manuscript').original.base64,'base64').toString(),text);
 const changed=source('manuscript',text+'\nNew text');assert.equal(importBundle(db,{...bundle,sources:[changed]}).imported,1);assert.equal(db.prepare('SELECT count(*) n FROM story_source_versions').get().n,3);assert.equal(exportBundle(db).sources.length,2);
 }finally{db.close()}
});
test('invalid bundles cannot partially import or overwrite unrelated app records',()=>{
 const db=openDatabase(':memory:');try{
 const a=source('good','Original'),b=source('bad','Later');b.original.base64='broken';assert.throws(()=>importBundle(db,{schema:'one.story-sources.v1',sources:[a,b]}));assert.equal(db.prepare('SELECT count(*) n FROM records').get().n,0);
 assert.throws(()=>importBundle(db,{schema:'one.story-sources.v1',sources:[a,a]}));const x=source('x','text');x.url='javascript:alert(1)';assert.throws(()=>importBundle(db,{schema:'one.story-sources.v1',sources:[x]}));
 importBundle(db,{schema:'one.story-sources.v1',sources:[a]});assert.equal(db.prepare('SELECT count(*) n FROM records WHERE app_id=?').get('god').n,0);
 }finally{db.close()}
});
test('actual recovered corpus preserves all 100 supplied lines, distinct 52-index records and missing story gaps',()=>{
 const {recover}=require('./recover.cjs'),fs=require('node:fs'),path=require('node:path');
 const db=openDatabase(':memory:');try{
 const {publicationTimeline}=require('./corpus.js');
 const timeline=publicationTimeline(require('../../data/tabor/modern_day_bible/publication_timeline.json'));
 const result=recover(db);assert.equal(result.imported,257+timeline.length);assert.equal(result.numberedStories,100);assert.equal(result.numberedIndexEntries,101);assert.equal(result.kinshipIndex,52);assert.equal(result.taborLightReferences,4);assert.equal(result.aisles.length,7);assert.deepEqual(result.missingSpans,[[1,101],[202,404]]);
 const all=exportBundle(db).sources,stories=all.filter(x=>x.kind==='numbered-story');assert.equal(stories.length,100);assert.equal(all.filter(x=>x.kind==='numbered-index').length,101);assert.ok(all.filter(x=>x.kind==='numbered-index').every(x=>x.scope.includes('original description missing')));assert.equal(all.filter(x=>x.kind==='index').length,56);assert.equal(all.filter(x=>x.id.startsWith('mdb-tabor-pub-')).length,4);assert.ok(!all.some(x=>x.id==='mdb-0202'));
 const supplied=JSON.parse(fs.readFileSync(path.resolve(__dirname,'../../data/tabor/modern_day_bible/stories_102_201.json'))).records;
 for(const r of supplied)assert.equal(stories.find(s=>s.id===r.entry_id.toLowerCase()).text,r.original_line);
 const raw=db.prepare('SELECT body FROM story_source_documents').get().body;assert.deepEqual(Buffer.from(raw),fs.readFileSync(path.resolve(__dirname,'../../data/tabor/modern_day_bible/volume_2_102_201_original.txt')));
 assert.equal(recover(db).skipped,257+timeline.length);
 const rows=db.prepare('SELECT body FROM records WHERE app_id=?').all('modern-day-bible').map(row=>({data:JSON.parse(row.body)}));
 const assembled=assemble(rows).map(source=>({...source,timeline:result.timelineRecords[source.id]}));
 assert.equal(search(assembled,'','timeline').length,timeline.length);
 assert.equal(search(assembled,'','kjv-passage').length,22);
 const study=assembled.find(source=>source.sourceId==='mdb-timeline-double-mindedness');
 const author=assembled.find(source=>source.sourceId==='mdb-timeline-double-mindedness-author');
 const verbatim=fs.readFileSync(path.resolve(__dirname,'../../data/tabor/modern_day_bible/double_mindedness_original.txt'),'utf8');
 assert.equal(author.text,verbatim);
 assert.equal(author.kind,'manuscript');
 assert.ok(author.complete);
 assert.equal(study.timeline.links.length,9);
 assert.ok(study.timeline.links.includes(author.sourceId));
 assert.ok(study.timeline.links.includes('mdb-timeline-jeb-samson'));
 assert.ok(study.timeline.links.includes('mdb-timeline-double-mindedness-ecclesiastes'));
 assert.ok(search(assembled,'300 foxes','timeline').some(source=>source.sourceId===study.sourceId));
 assert.ok(search(assembled,'2025-06-25','timeline').some(source=>source.sourceId==='mdb-timeline-copilot'));
 const book=assembled.find(source=>source.sourceId==='mdb-timeline-book-solomon');
 assert.ok(book.timeline.links.includes('mdb-timeline-solomon'));
 assert.equal(all.find(source=>source.id==='mdb-timeline-solomon').record.translation,'KJV');
 const jeb=assembled.find(source=>source.sourceId==='mdb-timeline-jeb-foxx');
 assert.ok(jeb.timeline.links.includes('mdb-timeline-foxx-ledger'));
 assert.ok(jeb.timeline.links.includes('mdb-timeline-jeb-oversight'));
 assert.ok(jeb.timeline.links.includes('mdb-timeline-jeb-daily-mail'));
 assert.ok(search(assembled,'19 transcribed interviews and depositions','timeline').some(source=>source.sourceId==='mdb-timeline-jeb-oversight'));
 assert.ok(search(assembled,'19 top officials','timeline').some(source=>source.sourceId==='mdb-timeline-jeb-daily-mail'));
 const epstein=assembled.find(item=>item.sourceId==='mdb-timeline-epstein-full-record');
 assert.equal(epstein.timeline.links.length,6);
 for(const id of epstein.timeline.links){
  const entry=all.find(item=>item.id===id);
  const filename=new URL(entry.url).pathname.split('/').pop();
  const original=fs.readFileSync(path.resolve(__dirname,'../../data/tabor/modern_day_bible',filename),'utf8');
  assert.equal(entry.original.text,original);
  const readable=assembled.find(item=>item.sourceId===id);
  assert.ok(readable.complete);
  assert.equal(readable.text,original);
 }
 assert.ok(search(assembled,'operatio','timeline').some(item=>item.sourceId==='mdb-timeline-epstein-agreement-conversation'));
 assert.ok(search(assembled,'BCCI','timeline').some(item=>item.sourceId==='mdb-timeline-epstein-reagan-review'));
 const owner={...source('mdb-timeline-test-owner','Exact owner wording'),record:{track:'Owner records',date:'2026-11-15',dateBasis:'Supplied date',evidence:'Owner statement',links:['mdb-timeline-think']}};
 importBundle(db,{schema:'one.story-sources.v1',sources:[owner]});
 const ownerProjection=Object.entries(recover(db).timelineRecords).find(([id])=>id.startsWith(owner.id+':'));
 assert.deepEqual(ownerProjection[1],owner.record);
 }finally{db.close()}
});
