'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const core=require('./source-studio-core.js');
const engine=require('./engine.js');
const archiveDir=path.join(__dirname,'../../protection-of-innocence/david-exchange-2026-11-05/');
const original=JSON.parse(fs.readFileSync(path.join(archiveDir,'messages.json'),'utf8'));
const index=JSON.parse(fs.readFileSync(path.join(archiveDir,'index.json'),'utf8'));
test('source archive aligns with the four exact indexed records',()=>{
 assert.equal(core.assertArchive(original.messages),true);
 assert.deepEqual(original.messages.map(x=>x.id),core.SOURCE_IDS);
 assert.deepEqual(index.records.map(x=>x.id),core.SOURCE_IDS);
 assert.ok(original.messages[0].original_text.startsWith('Hey David\n\nYOU ARE WORTH'));
 assert.ok(original.messages[2].original_text.endsWith('YOU CHANGED MY WORDS'));
});
test('original text is not silently altered during source verification',()=>{
 const before=JSON.stringify(original.messages);
 core.assertArchive(original.messages);
 assert.equal(JSON.stringify(original.messages),before);
 assert.throws(()=>core.assertArchive(original.messages.slice(1)));
});
test('every game round has two alternatives, a determined result and source integrity learning',()=>{
 assert.equal(core.GAME_ROUNDS.length,6);
 for(const r of core.GAME_ROUNDS){
  assert.equal(r.options.length,2);
  const right=core.scoreAnswer(r.id,r.answer);
  assert.equal(right.correct,true);
  assert.ok(right.explanation.length>15);
  assert.equal(core.scoreAnswer(r.id,1-r.answer).correct,false);
 }
 assert.throws(()=>core.scoreAnswer('unknown',0));
});
test('seven source-linked book volumes export editorial markdown without modifying original records',()=>{
 assert.equal(core.VOLUMES.length,7);
 const originals=JSON.stringify(original.messages);
 for(const volume of core.VOLUMES){
  assert.ok(volume.sourceIds.every(id=>core.SOURCE_IDS.includes(id)));
  assert.equal(core.bookById(volume.id),volume);
  const md=core.bookMarkdown(volume.id,'New chapter idea');
  assert.match(md,/Editorial \/ creative development draft/);
  assert.match(md,/New chapter idea/);
  assert.ok(md.includes(volume.chapters[0]));
 }
 assert.equal(JSON.stringify(original.messages),originals);
 assert.throws(()=>core.bookMarkdown('nope',''));
 assert.throws(()=>core.bookMarkdown('worth','a'.repeat(250001)));
});
test('all five lessons are adaptations without automatic adult source text',()=>{
 assert.equal(core.LESSONS.length,5);
 assert.ok(core.LESSONS.every(x=>x.sourceIds.every(id=>core.SOURCE_IDS.includes(id))));
 const lessons=JSON.stringify(core.LESSONS);
 assert.equal(lessons.includes('CUT YOUR GODDAMN TONGUE'),false);
 assert.equal(lessons.includes('KILL ALL VILLAGE'),false);
});
test('chatbox has a direct studio route and injected five-mode panel',()=>{
 const result=engine.reply('/studio');
 assert.equal(result.kind,'studio');
 assert.ok(result.links.some(x=>x.url.endsWith('#studio-panel')));
 const html=fs.readFileSync(path.join(__dirname,'index.html'),'utf8');
 assert.ok(html.includes('id="studio-panel"'));
 assert.ok(html.includes('data-tool="studio"'));
 for(const mode of ['app','game','book','learn','archive'])assert.ok(html.includes('data-studio-view="'+mode+'"'));
 assert.ok(html.includes('source-studio-core.js'));
 assert.ok(html.includes('source-studio.js'));
 assert.ok(html.includes('source-studio.css'));
});

test('unboxed local-source importer preserves every repeated source wording, in order',()=>{
 const before=JSON.stringify(original.messages);
 const duplicateText=original.messages[0].original_text;
 const extra=[{id:'IMPORT-001',sequence:1,original_text:duplicateText,role:'user'},
             {id:'IMPORT-002',sequence:2,original_text:duplicateText,role:'user'}];
 const combined=core.appendSourcesWithoutCollapse(original.messages,extra);
 assert.equal(combined.length,6);
 assert.equal(combined[4].original_text,duplicateText);
 assert.equal(combined[5].original_text,duplicateText);
 assert.equal(core.sourceCensus(combined).records,6);
 assert.ok(core.sourceCensus(combined).repeatedWordings>=2);
 assert.equal(JSON.stringify(original.messages),before);
 const exported=JSON.parse(core.originalsExport(combined));
 assert.deepEqual(exported.messages,combined);
 assert.throws(()=>core.appendSourcesWithoutCollapse(combined,extra),/Duplicate source ID/);
 assert.throws(()=>core.appendSourcesWithoutCollapse(original.messages,[{id:'IMPORT-X',original_text:''}]),/Invalid/);
});
test('all seven books export together, including full user-written notes',()=>{
 const notes={};
 for(const v of core.VOLUMES)notes[v.id]='Notebook '+v.id+'\nRepeat this wording exactly. Repeat this wording exactly.';
 const text=core.seriesMarkdown(notes);
 assert.equal((text.match(/Editorial \/ creative development draft/g)||[]).length,7);
 for(const v of core.VOLUMES)assert.ok(text.includes(notes[v.id]));
});
test('studio removes source collapsing and silent prompt truncation',()=>{
 const js=fs.readFileSync(path.join(__dirname,'source-studio.js'),'utf8');
 const css=fs.readFileSync(path.join(__dirname,'source-studio.css'),'utf8');
 assert.doesNotMatch(js,/el\('details'\)/);
 assert.doesNotMatch(js,/String\(question\)\.slice\(0,4000\)/);
 assert.match(js,/All Seven Volumes/);
 assert.match(js,/All Five Lessons/);
 assert.match(js,/sourceCensus/);
 assert.match(js,/Export ALL original source records/);
 assert.match(css,/studio-full-sources\s*\{max-height:none;overflow:visible/);
 const archiveHtml=fs.readFileSync(path.join(archiveDir,'index.html'),'utf8');
 assert.match(archiveHtml,/id="show-all"/);
 assert.doesNotMatch(archiveHtml,/max-height:240px/);
});
