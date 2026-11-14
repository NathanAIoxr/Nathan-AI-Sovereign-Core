'use strict';
const fs=require('node:fs'),path=require('node:path');
const {createHash,randomUUID}=require('node:crypto');
const {openDatabase,checkApp,checkRecord}=require('../app-shell/server.cjs');
const APP_ID='modern-day-bible';
const fields=[['title','Title','text'],['text','Original text','text'],['source','Source URL','text'],['kind','Source type','text'],['source-id','Source ID','text'],['part','Part','number'],['parts','Parts','number'],['sha256','Full text SHA-256','text'],['scope','Collection status','text']].map(([key,label,type])=>({key,label,type}));
const manifest={id:APP_ID,name:'Modern Day Bible · Stories',description:'A private, source-preserving library of related manuscripts, stories and scripture references.',entry:'app-factory/modern-day-bible/index.html',appearance:{skin:'parchment',font:'serif',width:'reading'},fields};
const digest=text=>createHash('sha256').update(text,'utf8').digest('hex');
function splitText(text){const out=[];let at=0;while(at<text.length){let end=Math.min(at+9000,text.length);if(end<text.length&&/[\uD800-\uDBFF]/.test(text[end-1]))end--;out.push(text.slice(at,end));at=end}return out}
function validateBundle(bundle){
 if(!bundle||bundle.schema!=='one.story-sources.v1'||!Array.isArray(bundle.sources)||!bundle.sources.length||bundle.sources.length>100)throw Error('Expected 1–100 source records in one.story-sources.v1');
 const keys=new Set();for(const s of bundle.sources){
  if(!s||typeof s.id!=='string'||!s.id.length||s.id.length>200||keys.has(s.id))throw Error('Missing or duplicate source ID');keys.add(s.id);
  for(const [key,max]of [['title',500],['text',1000000],['url',2000],['kind',100],['scope',2000]])if(typeof s[key]!=='string'||!s[key].trim()||s[key].length>max)throw Error('Invalid source '+key);
  const u=new URL(s.url);if(!['https:','local:'].includes(u.protocol)||u.username||u.password)throw Error('Source links must be HTTPS or local source references');
  if(!s.original||typeof s.original!=='object')throw Error('Original source snapshot required');
  if(s.original.base64!==undefined){if(typeof s.original.base64!=='string'||s.original.base64.length>4000000||Buffer.from(s.original.base64,'base64').toString('base64')!==s.original.base64)throw Error('Invalid original source bytes')}
  else if(typeof s.original.text!=='string'||s.original.text.length>2000000)throw Error('Original source text required');
 }return bundle;
}
function importBundle(db,input){
 const bundle=validateBundle(input),app=checkApp(manifest);
 db.exec('CREATE TABLE IF NOT EXISTS story_source_versions(source_key TEXT NOT NULL, text_sha256 TEXT NOT NULL, original_sha256 TEXT NOT NULL, snapshot TEXT NOT NULL, imported_at TEXT NOT NULL, PRIMARY KEY(source_key,text_sha256))');
 let imported=0,skipped=0,parts=0;const evidence=[];
 db.exec('BEGIN IMMEDIATE');try{
  db.prepare('INSERT OR IGNORE INTO apps VALUES(?,?)').run(app.id,JSON.stringify(app));
  const stored=JSON.parse(db.prepare('SELECT body FROM apps WHERE id=?').get(APP_ID).body);
  for(const source of bundle.sources){
   const sha=digest(source.text);if(db.prepare('SELECT 1 FROM story_source_versions WHERE source_key=? AND text_sha256=?').get(source.id,sha)){skipped++;continue}
   const original=source.original.base64?Buffer.from(source.original.base64,'base64'):Buffer.from(source.original.text,'utf8');
   const originalSha=createHash('sha256').update(original).digest('hex'),chunks=splitText(source.text),at=new Date().toISOString();
   // Preserve the entire source and raw snapshot; chunk only its searchable app projection.
   db.prepare('INSERT INTO story_source_versions VALUES(?,?,?,?,?)').run(source.id,sha,originalSha,JSON.stringify(source),at);
   chunks.forEach((text,i)=>{const record=checkRecord(stored,{title:source.title,text,source:source.url,kind:source.kind,'source-id':source.id,part:i+1,parts:chunks.length,sha256:sha,scope:source.scope});db.prepare('INSERT INTO records VALUES(?,?,?,?)').run(randomUUID(),APP_ID,JSON.stringify(record),at)});
   imported++;parts+=chunks.length;evidence.push({sourceId:source.id,title:source.title,textSha256:sha,originalSha256:originalSha,characters:source.text.length,originalBytes:original.length,parts:chunks.length});
  }
  db.exec('COMMIT');return {appId:APP_ID,imported,skipped,parts,evidence};
 }catch(e){db.exec('ROLLBACK');throw e}
}
function exportBundle(db){
 const rows=db.prepare('SELECT source_key,snapshot FROM story_source_versions ORDER BY imported_at DESC,rowid DESC').all(),seen=new Set(),sources=[];
 for(const row of rows){if(seen.has(row.source_key))continue;seen.add(row.source_key);sources.push(JSON.parse(row.snapshot))}
 return {schema:'one.story-sources.v1',collection:'Modern Day Bible — related sources',recentProjectLocated:false,sources};
}
if(require.main===module){
 const [dbPath,bundlePath]=process.argv.slice(2);if(!dbPath||!bundlePath)throw Error('Usage: node import.cjs /private/one-shell.sqlite /private/source-bundle.json');
 const repo=path.resolve(__dirname,'../..'),resolved=path.resolve(dbPath);if(resolved===repo||resolved.startsWith(repo+path.sep))throw Error('Keep the database outside this public repository');
 if(fs.statSync(bundlePath).size>8*1024*1024)throw Error('Import file exceeds 8 MB');const db=openDatabase(dbPath);try{console.log(JSON.stringify(importBundle(db,JSON.parse(fs.readFileSync(bundlePath,'utf8'))),null,2))}finally{db.close()}
}
module.exports={importBundle,exportBundle,splitText,validateBundle,manifest};
