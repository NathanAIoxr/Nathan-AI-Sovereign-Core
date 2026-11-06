'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const R=require('./roster.js'),E=require('./engine.js');
test('13 original collections contain 118 intact identities',()=>{
 assert.equal(R.groups.length,13);assert.equal(R.characters.length,118);
 assert.deepEqual(R.groups.map(g=>g.count),[14,20,8,6,6,9,12,7,6,7,11,6,6]);
 assert.equal(R.characters[0].name,'EMPATHY ETERNAL EVE ♍️');
 assert.equal(R.characters[12].name,'POP EAGLE EYE 👁️');
 assert.equal(R.characters[117].name,'ANXIOUS AWESTRUCK ANUBIS');
 assert.equal(new Set(R.characters.map(c=>c.id)).size,118);
});
test('all 354 gates are repeatable and have exactly one valid option',()=>{
 for(const c of R.characters){
  for(let stage=0;stage<3;stage++){const q=E.challenge(c.id,stage);assert.equal(q.options.length,3);
   assert.equal(new Set(q.options).size,3,c.id+' '+stage);
   assert.ok(q.correct>=0&&q.correct<=2);assert.deepEqual(q,E.challenge(c.id,stage));}
  for(const word of E.words(c.id))assert.equal(E.reverse(E.reverse(word)),word);
 }
});
test('wrong answer does not advance, replay preserves completion',()=>{
 let s=E.fresh();let q=E.challenge(s.id,0),bad=(q.correct+1)%3;
 let r=E.answer(s,bad);assert.equal(r.state.stage,0);assert.equal(r.correct,false);s=r.state;
 for(let stage=0;stage<3;stage++){s=E.answer(s,E.challenge(s.id,stage).correct).state}
 assert.equal(s.stage,3);assert.equal(E.progress(s).figures,1);assert.equal(E.answer(s,0).accepted,false);
 s=E.replay(s);assert.equal(s.stage,0);assert.equal(E.progress(s).figures,1);
});
test('thirteen collection campaign and full 118 mastery are reachable',()=>{
 let s=E.fresh();
 for(const c of R.characters){
   s=E.select(s,c.id).state;
   for(let i=0;i<3;i++)s=E.answer(s,E.challenge(c.id,i).correct).state;
 }
 assert.equal(E.progress(s).collections,13);assert.equal(E.progress(s).figures,118);
 assert.equal(E.progress(s).parade,true);assert.equal(E.progress(s).master,true);
 const restored=E.load(E.save(s));assert.deepEqual(E.progress(restored),E.progress(s));
 const dirty=JSON.parse(E.save(s));dirty.done['LINE-999']=true;
 assert.equal(Object.keys(E.load(JSON.stringify(dirty)).done).length,118);
 assert.throws(()=>E.load('{'));assert.throws(()=>E.load('{"version":2}'));
});
