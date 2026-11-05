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
 assert.throws(()=>core.bookMarkdown('worth','a'.repeat(10001)));
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
