'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const g=require('./engine.js');

test('PAWS SWAP is the true involutive reversal',()=>{
  assert.equal(g.reverse('PAWS'),'SWAP');assert.equal(g.reverse('SWAP'),'PAWS');
  for(const w of g.WORDS){const r=g.reverse(w.word);assert.equal(g.reverse(r),w.word);assert.equal(g.invariant(w.word,r).sameCharacters,true);}
});
test('all three phase puzzles have four unique choices at 1000 indexed bridges',()=>{
  for(let level=1;level<=1000;level++)for(let phase=0;phase<3;phase++){
    const p=g.puzzle(level,phase);
    assert.equal(p.choices.length,4);assert.equal(new Set(p.choices.map(o=>o.label)).size,4);
    assert.equal(p.choices.filter(o=>o.id===p.correctId).length,1);
    assert.equal(p.choices.find(o=>o.id===p.correctId).label,p.answer);
  }
});
test('one complete bridge rewards a single star at middle C',()=>{
  let s=g.newGame();for(let phase=0;phase<3;phase++){
    assert.equal(s.phase,phase);const p=g.puzzle(s.level,s.phase);
    s=g.choose(s,p.correctId).state;assert.throws(()=>g.choose(s,p.correctId),/already answered/);
    s=g.next(s);
  }
  assert.equal(s.level,2);assert.equal(s.stars,1);assert.equal(s.correctCount,3);
});
test('a wrong answer does not falsely award correct progress',()=>{
  const p=g.puzzle(1,2),bad=p.choices.find(x=>x.id!==p.correctId);let s=g.newGame();s.phase=2;
  const result=g.choose(s,bad.id);assert.equal(result.correct,false);assert.equal(result.state.stars,0);
  s=g.next(result.state);assert.equal(s.level,2);
});
test('torque sum sets angular acceleration but not existing angular velocity',()=>{
  const a=g.mechanics(4,-4,2,2,0);
  assert.equal(a.netTorque,0);assert.equal(a.angularAcceleration,0);assert.equal(a.atRest,true);
  const moving=g.mechanics(4,-4,2,2,1);
  assert.equal(moving.angularAcceleration,0);assert.equal(moving.angularVelocity,1);
  assert.equal(moving.atRest,false);assert.equal(moving.angle,2);
  const unbalanced=g.mechanics(4,-3,2,2,0);
  assert.equal(unbalanced.netTorque,1);assert.equal(unbalanced.angularAcceleration,.5);
  assert.equal(unbalanced.angularVelocity,1);assert.equal(unbalanced.angle,1);
});
test('physics rejects impossible parameters and invalid levels',()=>{
  assert.throws(()=>g.mechanics(NaN,0));assert.throws(()=>g.mechanics(1,-1,0));
  assert.throws(()=>g.mechanics(1,-1,1,-1));assert.throws(()=>g.newGame(0));
  assert.throws(()=>g.puzzle(1,3));assert.throws(()=>g.next(g.newGame()));
  assert.throws(()=>g.choose(g.newGame(),'not-a-real-option'));
});
test('user-entered text is bounded and not treated as an etymology',()=>{
  const p=g.inspect('HO HO HO');assert.equal(p.reversed,'OH OH OH');
  assert.equal(p.sameLength,true);assert.equal(p.doubleReverse,true);
  assert.match(p.note,/not on its own prove/);
  assert.throws(()=>g.inspect(''));assert.throws(()=>g.inspect('a'.repeat(81)));
});
test('native resources match browser and reuse the existing Middle C core',()=>{
 const orig=__dirname,native=path.join(orig,'../../Resources/PolarMiddleC/mirror-bridge');
 const web=fs.readFileSync(path.join(orig,'index.html'),'utf8');
 const nativeHTML=fs.readFileSync(path.join(native,'index.html'),'utf8');
 assert.equal(nativeHTML,web.split('<!-- Material Worlds shared presentation and optional consumer modes -->')[0].replaceAll('../../../middle-c/game.js','../middle-c-game.js'));
 assert.equal(fs.readFileSync(path.join(native,'engine.js'),'utf8'),fs.readFileSync(path.join(orig,'engine.js'),'utf8'));
 assert.ok(web.includes('PawMirrorBridge'));
});
test('new game contains no licensed film-specific content or remote media',()=>{
 const text=[fs.readFileSync(path.join(__dirname,'index.html'),'utf8'),fs.readFileSync(path.join(__dirname,'engine.js'),'utf8')].join('\n');
 assert.doesNotMatch(text,/\bVIKI\b|\bIKIV\b|\bI,\s*Robot\b/i);
 assert.doesNotMatch(text,/<iframe\b|<img[^>]*https?:|<script[^>]*https?:/i);
 assert.doesNotMatch(text,/https?:\/\/[^ "'<]+/);
});
