'use strict';
const fs=require('node:fs'),path=require('node:path'),{createHash}=require('node:crypto');
const {buildBundle,publicationTimeline,timelineMetadata}=require('./corpus.js'),{importBundle}=require('./import.cjs');
const ROOT=path.resolve(__dirname,'../..');
function recover(db){
 const dir=path.join(ROOT,'data/tabor/modern_day_bible'),read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
 const stories=read(path.join(dir,'stories_102_201.json')),kinship=read(path.join(ROOT,'data/tabor/biblical_kinship_52_entities_2026-11-14.json')),manifest=read(path.join(dir,'recovery_manifest.json')),aisles=read(path.join(dir,'aisle_labels_7.json'));
 const raw=fs.readFileSync(path.join(dir,'volume_2_102_201_original.txt')),sha=createHash('sha256').update(raw).digest('hex');if(sha!==stories.source_sha256||sha!==manifest.volume_2_recovered.original_source_sha256)throw Error('Recovered volume source hash mismatch');
 const nums=stories.records.map(r=>r.number);if(nums.length!==100||new Set(nums).size!==100||nums.some((n,i)=>n!==102+i))throw Error('Recovered story sequence must stay 102–201');
 for(const r of stories.records)if(!raw.toString('utf8').split(/\r?\n/).includes(r.original_line))throw Error('Story line does not match original source');
 const related=read(path.join(dir,'tabor_light_public_sources.json'));if(related.schema!=='one.story-sources.v1'||related.related_collection!=='TABOR LIGHT'||!Array.isArray(related.sources)||related.sources.length!==4)throw Error('Tabor Light public source catalog mismatch');
 const timeline=publicationTimeline(read(path.join(dir,'publication_timeline.json')));
 const passages=read(path.join(ROOT,'data/tabor/scripture_passage_entities_2026-11-14.json'));
 const bundle=buildBundle(stories,kinship,passages);bundle.sources.push(...related.sources,...timeline);
 const result=importBundle(db,bundle);
 db.exec('CREATE TABLE IF NOT EXISTS story_source_documents(sha256 TEXT PRIMARY KEY,path TEXT NOT NULL,body BLOB NOT NULL)');
 db.prepare('INSERT OR IGNORE INTO story_source_documents VALUES(?,?,?)').run(sha,'data/tabor/modern_day_bible/volume_2_102_201_original.txt',raw);
 const timelineRecords={};
 const versions=db.prepare("SELECT source_key,text_sha256,snapshot FROM story_source_versions WHERE source_key GLOB 'mdb-timeline-*'").all();
 for(const row of versions){
  const record=timelineMetadata(JSON.parse(row.snapshot).record);
  if(record)timelineRecords[row.source_key+':'+row.text_sha256]=record;
 }
 return {...result,numberedStories:100,numberedIndexEntries:passages.entities.length,kinshipIndex:kinship.records.length,taborLightReferences:related.sources.length,timelineRecords,missingSpans:manifest.missing_full_original_source_spans,aisles:aisles.labels,aisleProvenance:aisles.provenance};
}
if(require.main===module){const {openDatabase}=require('../app-shell/server.cjs');const dest=process.argv[2];if(!dest||!path.isAbsolute(dest)||path.resolve(dest).startsWith(ROOT+path.sep))throw Error('Supply a private absolute database path outside the repository');const db=openDatabase(dest);try{const r=recover(db);console.log(JSON.stringify({...r,evidence:undefined,timelineRecords:undefined,timelineCount:Object.keys(r.timelineRecords).length},null,2))}finally{db.close()}}
module.exports={recover};
