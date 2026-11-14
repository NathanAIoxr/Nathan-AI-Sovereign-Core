'use strict';
const fs=require('node:fs'),path=require('node:path'),{createHash}=require('node:crypto');
const {buildBundle}=require('./corpus.js'),{importBundle}=require('./import.cjs');
const ROOT=path.resolve(__dirname,'../..');
function recover(db){
 const dir=path.join(ROOT,'data/tabor/modern_day_bible'),read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
 const stories=read(path.join(dir,'stories_102_201.json')),kinship=read(path.join(ROOT,'data/tabor/biblical_kinship_52_entities_2026-11-14.json')),manifest=read(path.join(dir,'recovery_manifest.json')),aisles=read(path.join(dir,'aisle_labels_7.json'));
 const raw=fs.readFileSync(path.join(dir,'volume_2_102_201_original.txt')),sha=createHash('sha256').update(raw).digest('hex');if(sha!==stories.source_sha256||sha!==manifest.volume_2_recovered.original_source_sha256)throw Error('Recovered volume source hash mismatch');
 const nums=stories.records.map(r=>r.number);if(nums.length!==100||new Set(nums).size!==100||nums.some((n,i)=>n!==102+i))throw Error('Recovered story sequence must stay 102–201');
 for(const r of stories.records)if(!raw.toString('utf8').split(/\r?\n/).includes(r.original_line))throw Error('Story line does not match original source');
 const result=importBundle(db,buildBundle(stories,kinship));
 db.exec('CREATE TABLE IF NOT EXISTS story_source_documents(sha256 TEXT PRIMARY KEY,path TEXT NOT NULL,body BLOB NOT NULL)');
 db.prepare('INSERT OR IGNORE INTO story_source_documents VALUES(?,?,?)').run(sha,'data/tabor/modern_day_bible/volume_2_102_201_original.txt',raw);
 return {...result,numberedStories:100,kinshipIndex:kinship.records.length,missingSpans:manifest.missing_full_original_source_spans,aisles:aisles.labels,aisleProvenance:aisles.provenance};
}
if(require.main===module){const {openDatabase}=require('../app-shell/server.cjs');const dest=process.argv[2];if(!dest||!path.isAbsolute(dest)||path.resolve(dest).startsWith(ROOT+path.sep))throw Error('Supply a private absolute database path outside the repository');const db=openDatabase(dest);try{const r=recover(db);console.log(JSON.stringify({...r,evidence:undefined},null,2))}finally{db.close()}}
module.exports={recover};
