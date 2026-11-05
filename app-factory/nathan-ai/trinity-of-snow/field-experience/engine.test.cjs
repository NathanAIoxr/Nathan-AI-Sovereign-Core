'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const data=require('./data.js');
const api=require('./engine.js');
test('preserve exact nineteen-level author numbering',()=>{
  assert.deepEqual(data.north,['+9','+8','+7','+6','+5','+4','+3','+2','+1']);
  assert.equal(data.center,'0');
  assert.deepEqual(data.south,['-9','-8','-7','-6','-5','-4','-3','-2','-1']);
  assert.equal(new Set([...data.north,data.center,...data.south]).size,19);
  assert.equal(api.level('0').category,'CENTER / EQUATOR / VOID');
  assert.equal(api.level('+9').category,'ABOVE / NORTH · BABEL');
  assert.equal(api.level('-9').category,'BELOW / SOUTH · INVERTED INFERNO');
});
test('0 and 9 remain boundary semantics distinct from operator positions 1–8',()=>{
  assert.deepEqual(data.operators.map(o=>o.n),[1,2,3,4,5,6,7,8]);
  assert.deepEqual(data.rows.map(r=>r.operators),[[1,2],[3,4],[5,6],[7,8]]);
  assert.deepEqual(data.channels,['Authority','Law','Lineage','Word','Stone','Memory']);
  const r=api.simulate('101100');
  assert.equal(r.steps.length,4);assert.ok(r.steps.every(s=>s.channels.length===6));
  assert.equal(r.release,'101100');assert.equal(r.returnState,'101100');assert.equal(r.cycleLength,2);
  assert.throws(()=>api.simulate('102100'),/six binary/);
});
test('source-aware offline chat never presents itself as live inference',()=>{
  const r=api.answer('What is the 1380 Judenhut manuscript?');
  assert.ok(r.sources.some(s=>s.id==='ART-KA36'));
  assert.match(r.text,/circa 1390/);
  assert.match(r.kind,/local source/);
  assert.ok(data.sources.some(s=>s.type==='Creator-authored story'));
  assert.ok(data.sources.some(s=>s.type==='Historical artifact'));
  assert.ok(data.sources.some(s=>s.type==='KJV scripture'));
  assert.ok(data.sources.some(s=>s.type==='Literary source'));
  assert.equal(api.answer('zxcvbnmlkjhgfdsa').sources.length,0);
});
test('6 educational quests and 39 distinct chapter positions',()=>{
  assert.equal(data.quests.length,6);
  assert.deepEqual(data.volumes.map(v=>v.chapters.length),[13,13,13]);
  assert.deepEqual(Object.values(data.sceneNotes).map(x=>x.length),[13,13,13]);
  assert.equal(new Set(Object.values(data.sceneNotes).flat()).size,39);
  assert.notEqual(api.chapter('V1',0).excerpt,api.chapter('V1',1).excerpt);
  for(const q of data.quests){assert.ok(data.sources.find(s=>s.id===q.source));assert.equal(api.quest(q.id,q.correct).correct,true)}
  assert.match(api.chapter('V2',12).excerpt,/source|story|symbolic/i);
  assert.match(api.exportBooks(),/39-chapter/);
  assert.match(api.exportLedger(),/ART-KA36/);
});
test('text-only static app has working mode and input hooks, no outside code loading',()=>{
  const html=fs.readFileSync(path.join(__dirname,'index.html'),'utf8');
  const app=fs.readFileSync(path.join(__dirname,'app.js'),'utf8');
  for(const mode of ['chat','game','books','study','world','field'])assert.match(html,new RegExp('id="view-'+mode+'"'));
  for(const hook of ['chat-form','quest-form','volume','chapter','study-query','matrix-form'])assert.ok(html.includes('id="'+hook+'"'));
  assert.doesNotMatch(html,/<script[^>]+src="https?:/);
  assert.doesNotMatch(app,/\binnerHTML\s*=/);
  assert.ok(fs.existsSync(path.join(__dirname,'README.md')));
});
