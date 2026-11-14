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
