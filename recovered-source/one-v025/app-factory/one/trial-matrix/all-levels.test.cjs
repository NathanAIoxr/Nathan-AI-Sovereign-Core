'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const g=require('./engine.js');
const profiles=require('./profile.js');
function play(s,at=1000){const h=g.hint(s);assert.ok(h,'a legal hint exists');if(s.level===23)g.step(s,{type:'phase',phase:h.phase},at);g.step(s,h,at);return h;}
test('catalog contains exactly 33 stages in three complete epochs',()=>{
 assert.deepEqual(g.LEVELS.map(d=>d.id),Array.from({length:33},(_,i)=>i+1));
 assert.deepEqual(['I','II','III'].map(e=>g.LEVELS.filter(d=>d.epoch===e).length),[11,11,11]);
 assert.equal(new Set(g.LEVELS.map(d=>d.name)).size,33);
});
for(let level=1;level<=33;level++)test('Trial '+level+': deterministic play, completion and lossless save/restore',()=>{
 const seeds=level<6?[123]:[0,1,3,7,123];
 for(const seed of seeds){
  const s=g.initial(level,seed,true,0),same=g.initial(level,seed,true,0);
  assert.deepEqual(s,same);
  if(level>=6)assert.equal(g.expansion.groups(s).length,0,'no free pre-existing matches');
  let steps=0;
  while(s.status==='playing'&&steps++<150){
   if(level!==5||g.hint(s))play(s,steps*1000);
   if(level===5&&s.status==='playing')g.step(s,{type:'tick'},steps*1000+500);
   const reloaded=g.restore(g.save(s));assert.deepEqual(reloaded,s);
  }
  assert.equal(s.status,'won','seed '+seed+' must reach its actual objective');
  assert.ok(s.progress>=g.LEVELS[level-1].goal);
  const done=structuredClone(s);g.step(s,{type:'swap',a:0,b:1},999999);assert.deepEqual(s,done,'terminal board is immutable');
 }
});
test('invalid swaps spend no moves and do not change board or random state',()=>{
 for(let level=6;level<=33;level++){
  const s=g.initial(level,12,false,0),board=structuredClone(s.board),random=s.randomState;
  g.step(s,{type:'swap',a:-1,b:99999},100);
  assert.equal(s.moves,0);assert.equal(s.stats.invalid,1);assert.deepEqual(s.board,board);assert.equal(s.randomState,random);
  assert.deepEqual(s.events,[]);
 }
});
test('hints have no side effects including random state, hidden weights and dual state',()=>{
 for(let level=1;level<=33;level++){const s=g.initial(level,24,false,0),before=structuredClone(s);if(level!==5)assert.ok(g.hint(s));else g.hint(s);assert.deepEqual(s,before);}
});
test('waterways and inverted gravity announce and apply different refill directions',()=>{
 for(const [level,direction] of [[6,'right'],[12,'up']]){const s=g.initial(level,123,false,0);play(s);assert.equal(s.board.gravity,direction);}
});
test('calendars cannot swap across their boundary, rooms cannot swap or match across rooms',()=>{
 const calendar=g.initial(7,123,false,0);g.step(calendar,{type:'swap',a:3,b:4},100);assert.equal(calendar.moves,0);
 const rooms=g.initial(10,123,false,0);g.step(rooms,{type:'swap',a:2,b:3},100);assert.equal(rooms.moves,0);
 const b=rooms.board;b.cells=Array.from({length:81},(_,i)=>(Math.floor(i/9)+i%9)%4);b.cells[1]=b.cells[2]=b.cells[3]=0;
 assert.ok(!g.expansion.groups(rooms).some(group=>group.cells.includes(1)&&group.cells.includes(3)));
});
test('memory Study is voluntary, free, and never alters underlying symbols',()=>{
 const s=g.initial(8,1,false,0),cells=s.board.cells.slice();assert.notEqual(g.expansion.presentation(s,0).text,'?');
 g.step(s,{type:'study'},10);assert.equal(g.expansion.presentation(s,0).text,'?');assert.notEqual(g.expansion.presentation(s,0,true).text,'?');
 g.step(s,{type:'study'},20);assert.deepEqual(s.board.cells,cells);assert.equal(s.moves,0);
});
test('cipher key and rotor position advance only after successful moves',()=>{
 const cipher=g.initial(9,123,false,0);play(cipher);assert.equal(cipher.board.key,1);
 const rotor=g.initial(15,123,false,0);assert.match(g.expansion.status(rotor),/column: 1/);play(rotor);assert.equal(rotor.board.turn,1);assert.match(g.expansion.status(rotor),/column: 2/);
});
test('Nash counts both sectors, local cooperation alternates credited players',()=>{
 const s=g.initial(32,123,false,0);play(s);assert.ok(s.board.contributions[0]>0);assert.equal(s.board.contributions[1],0);assert.equal(s.board.turn%2,1);
 play(s,2000);assert.ok(s.board.contributions[1]>0);
 const balance=g.initial(22,123,false,0);while(balance.status==='playing')play(balance);assert.deepEqual(balance.board.contributions,[15,15]);
});
test('dual states switch without a move, Tesseract connects all four coordinate axes',()=>{
 const dual=g.initial(23,123,false,0),light=dual.board.cells.slice();g.step(dual,{type:'phase',phase:1},100);assert.equal(dual.moves,0);assert.deepEqual(dual.board.cells,light);assert.equal(dual.board.phase,1);
 const s=g.initial(24,123,false,0);for(const b of [1,8,4,32])assert.equal(g.expansion.adjacent(s,0,b),true);assert.equal(g.expansion.adjacent(s,3,4),false);assert.equal(g.expansion.adjacent(s,0,5),false);
});
test('Stroop uses words, weights can be inspected, pillars cannot be moved',()=>{
 const stroop=g.initial(25,123,false,0);assert.match(g.expansion.presentation(stroop,0).text,/RED|BLUE|GOLD|GREEN/);assert.ok(g.expansion.presentation(stroop,0).ink);
 const weighted=g.initial(26,123,false,0);assert.match(g.expansion.presentation(weighted,0).text,/\?/);g.step(weighted,{type:'inspect'},10);assert.match(g.expansion.presentation(weighted,0).text,/[1-4]/);assert.equal(weighted.moves,0);
 const pillars=g.initial(27,123,false,0),fixed=pillars.board.cells.filter((_,i)=>[2,4].includes(i%7));while(pillars.status==='playing')play(pillars);assert.deepEqual(pillars.board.cells.filter((_,i)=>[2,4].includes(i%7)),fixed);
});
test('reserve row opens after two successful moves, bridge topology preserves voids',()=>{
 const reserve=g.initial(30,123,false,0);assert.equal(g.expansion.locked(reserve,42),true);play(reserve);assert.equal(g.expansion.locked(reserve,42),true);play(reserve,2000);assert.equal(g.expansion.locked(reserve,42),false);
 const bridges=g.initial(31,123,false,0);assert.equal(g.expansion.adjacent(bridges,2,4),true);assert.equal(g.expansion.locked(bridges,3),true);while(bridges.status==='playing')play(bridges);assert.equal(bridges.board.cells[3],null);
});
test('Zenith clears all 33 persistent seals to zero',()=>{
 const s=g.initial(33,123,false,0);assert.equal(s.board.seals.filter(Boolean).length,33);let previous=33;
 while(s.status==='playing'){play(s);const count=s.board.seals.filter(Boolean).length;assert.ok(count<=previous);assert.equal(s.progress,33-count);previous=count;}
 assert.equal(previous,0);assert.equal(s.status,'won');
});
test('earned rewards are once per stage, stars improve and free replay cannot farm balances',()=>{
 const p=profiles.initial();assert.equal(p.coins,100);assert.equal(p.gems,3);
 const s=g.initial(6,123,false,0);while(s.status==='playing')play(s);const reward=profiles.award(p,s,g.LEVELS[5]);assert.equal(reward.coins,100);assert.equal(p.completed.length,1);
 const coins=p.coins,gems=p.gems;profiles.award(p,s,g.LEVELS[5]);assert.equal(p.coins,coins);assert.equal(p.gems,gems);assert.deepEqual(profiles.validate(p),p);
 for(let level=1;level<=11;level++){if(level===6)continue;profiles.award(p,{level,status:'won',moves:3,score:100},g.LEVELS[level-1]);}
 assert.equal(p.gems,18,'ten single gems and one five-gem epoch reward plus starter gift');assert.equal(profiles.next(p),12);
});
test('corrupt import is rejected, including malformed boards, rates and objective modifiers',()=>{
 const bad=[s=>{s.level=6.5;},s=>{s.board.cells[0]=99;},s=>{s.board.weights=[];},s=>{s.board.turn=-1;},s=>{s.board.phase=1;},s=>{s.stats.calm.actions=-1;},s=>{s.board.bridges=[[0,48]];},s=>{s.status='hacked';}];
 for(const mutate of bad){const data=g.save(g.initial(6,123,false,0));mutate(data.session);assert.throws(()=>g.restore(data));}
 const p=profiles.initial();p.completed=[1];assert.throws(()=>profiles.validate(p));
});
