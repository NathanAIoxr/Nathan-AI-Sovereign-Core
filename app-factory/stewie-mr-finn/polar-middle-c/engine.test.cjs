'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const game=require('./engine.js');

test('parent engine is reused and all ancient entries are present',()=>{
  assert.equal(game.ARCHIVE.length,16);
  assert.equal(game.HEARD.length,12);
  assert.equal(game.STAGES.length,3);
  for(const e of game.ARCHIVE){assert.match(e.source,/^https:\/\//);assert.ok(e.detail.length>25);assert.ok(e.culture.length>2)}
});
test('every one of the first 300 bridges gives three complete and unambiguous questions',()=>{
  const seen=new Set();
  for(let level=1;level<=300;level++)for(let stage=0;stage<3;stage++){
    const p=game.puzzle(level,stage);assert.equal(p.choices.length,4);
    assert.equal(new Set(p.choices.map(x=>x.label)).size,4);
    assert.equal(p.choices.filter(c=>c.id===p.correctId).length,1);
    assert.ok(p.explanation);seen.add(p.kind);
  }
  assert.deepEqual([...seen].sort(),['archive','listen','mirror']);
});
test('a bridge runs Above C, Below C, Middle C and awards one star',()=>{
  let s=game.newGame(1);
  for(let stage=0;stage<3;stage++){
    assert.equal(s.stage,stage);
    const p=game.puzzle(s.level,s.stage);
    const r=game.answer(s,p.correctId);assert.equal(r.correct,true);
    s=r.state;assert.equal(s.locked,true);
    assert.throws(()=>game.answer(s,p.correctId),/already answered/i);
    s=game.advance(s);
  }
  assert.equal(s.level,2);assert.equal(s.stage,0);
  assert.equal(s.stars,1);assert.equal(s.score,300);assert.equal(s.solved,3);
});
test('wrong guesses give helpful feedback and can still advance',()=>{
  const p=game.puzzle(3,1),bad=p.choices.find(c=>c.id!==p.correctId);
  let s=game.newGame(3);s.stage=1;
  const a=game.answer(s,bad.id);
  assert.equal(a.correct,false);assert.equal(a.state.stars,0);
  assert.equal(a.answer,p.answer);s=game.advance(a.state);
  assert.equal(s.stage,2);
});
test('mirror side preserves exact codepoint spelling',()=>{
  const word=game.puzzle(1,1).symbol;
  assert.equal(game.puzzle(1,1).answer,[...word].reverse().join(''));
});
test('all 16 ancient gates and all 12 heard prompts appear during 16 bridges',()=>{
  const cultures=new Set(),sounds=new Set();
  for(let i=1;i<=16;i++){cultures.add(game.puzzle(i,2).evidence);sounds.add(game.puzzle(i,0).symbol)}
  assert.equal(cultures.size,16);assert.equal(sounds.size,12);
});
test('save state is JSON round-trippable without network or accounts',()=>{
  const s=game.answer(game.newGame(),game.puzzle(1,0).correctId).state;
  assert.deepEqual(game.validate(JSON.parse(JSON.stringify(s))),s);
  const html=fs.readFileSync(path.join(__dirname,'index.html'),'utf8');
  assert.ok(html.includes('localStorage'));assert.ok(!html.includes('fetch('));
  assert.ok(html.includes('../../middle-c/game.js'));
});
test('decoder separates literal reverse and creative readings',()=>{
  const d=game.decode('HO HO HO');
  assert.equal(d.literal,'OH OH OH');
  assert.match(d.symbolism,/not automatically historical/);
  assert.throws(()=>game.decode(''));assert.throws(()=>game.decode('X'.repeat(121)));
});
test('determinism and invalid level safety',()=>{
  assert.deepEqual(game.puzzle(485,0),game.puzzle(485,0));
  assert.throws(()=>game.puzzle(0,0));assert.throws(()=>game.puzzle(1,3));
  assert.throws(()=>game.newGame(Infinity));
  assert.throws(()=>game.advance(game.newGame()),/Finish/);
  assert.throws(()=>game.answer(game.newGame(),'fake'),/Unknown/);
});
