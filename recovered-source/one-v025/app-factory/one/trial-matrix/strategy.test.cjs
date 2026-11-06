'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const game=require('./engine.js');
const profiles=require('./profile.js');
const make=(level=6,difficulty='tactician',seed=123)=>game.initial(level,seed,false,0,{mode:'campaign',difficulty});
function play(s,at=1000){
 const move=game.analyze(s)[0],hint=game.hint(s);
 if(s.strategy.focus>=3&&!s.strategy.abilityUsed)game.step(s,{type:'ability',name:'ward'},at);
 if(hint){
  if(move&&s.strategy.forecast===null)game.step(s,{type:'forecast',symbol:move.symbols.indexOf(Math.max(...move.symbols))},at);
  if(s.level===23)game.step(s,{type:'phase',phase:hint.phase},at);
  game.step(s,hint,at);
 }
 if(s.level===5&&s.status==='playing')game.step(s,{type:'tick'},at+1);
 return hint;
}
test('v025 has a distinct strategy guide, guardian and optional contract for every stage',()=>{
 const guides=game.strategy.GUIDES;
 assert.equal(guides.length,33);assert.equal(new Set(guides.map(g=>g.guardian)).size,33);
 assert.deepEqual(guides.filter(g=>g.boss).map(g=>g.level),[11,22,33]);
 assert.equal(new Set(guides.map(g=>g.temperament)).size,4);
 for(const g of guides){assert.ok(g.contract.length>20);assert.ok(g.opening.length>30);assert.ok(g.advanced.length>40);assert.ok(g.target>0);}
});
for(let level=1;level<=33;level++)test('campaign '+level+': real Explorer and Tactician completion; exact save resume every turn',()=>{
 for(const difficulty of ['story','tactician']){
  const s=make(level,difficulty);let steps=0;
  while(s.status==='playing'&&steps++<160){play(s,steps*1000);assert.deepEqual(game.restore(game.save(s)),s);assert.ok(s.strategy.health>=0&&s.strategy.guardianHealth>=0);assert.equal(s.events.length,0);}
  assert.equal(s.status,'won',difficulty+' '+s.feedback);assert.equal(s.strategy.guardianHealth,0);assert.ok(s.progress>=game.LEVELS[level-1].goal);
  const done=structuredClone(s);game.step(s,{type:'ability',name:'ward'},999999);assert.deepEqual(s,done);
 }
});
test('analysis is side-effect free and independent of future refill randomness',()=>{
 for(let level=1;level<=33;level++){
  const s=make(level),before=structuredClone(s),moves=game.analyze(s);assert.deepEqual(s,before);
  s.randomState=(s.randomState+123456789)>>>0;assert.deepEqual(game.analyze(s),moves,'stage '+level+' must not inspect future random state');
 }
});
test('guardian picks a legal public move using its actual temperament score',()=>{
 for(let level=1;level<=33;level++){
  const s=make(level),moves=game.analyze(s);if(!moves.length){assert.equal(s.strategy.intent,null);continue;}
  assert.ok(moves.some(m=>JSON.stringify(m.action)===JSON.stringify(s.strategy.intent.action)));
  assert.equal(game.strategy.guardianScore(s,s.strategy.intent),Math.max(...moves.map(m=>game.strategy.guardianScore(s,m))));
 }
});
test('Echo preference reacts to the last cleared symbol rather than randomness',()=>{
 const s=make(20),moves=game.analyze(s);assert.equal(game.strategy.GUIDES[19].temperament,'Echo');
 const move=moves[0];s.strategy.lastSymbol=move.symbols.indexOf(Math.max(...move.symbols));const favored=game.strategy.guardianScore(s,move);
 s.strategy.lastSymbol=(s.strategy.lastSymbol+1)%4;assert.ok(game.strategy.guardianScore(s,move)<favored);
});
test('adaptive guardian executes a real shared-board move without taking hero score or focus',()=>{
 const s=make(25),action=game.hint(s),classic=game.initial(25,123,false,0);
 game.step(classic,action,1000);game.step(s,action,1000);
 assert.equal(s.strategy.heroTurns,1);assert.equal(s.strategy.guardianTurns,1);assert.equal(s.moves,2);assert.equal(s.board.turn,2);
 assert.equal(s.score,classic.score);assert.equal(s.progress,classic.progress);assert.notDeepEqual(s.board.cells,classic.board.cells);
 assert.ok(s.strategy.lastIncoming>0);assert.ok(s.strategy.focus<=5);
});
test('Ward and Gambit enforce focus cost, one ability per turn, and next-turn reset',()=>{
 const s=make();game.step(s,{type:'ability',name:'ward'},10);assert.equal(s.strategy.focus,0);assert.equal(s.strategy.shield,16);
 const before=structuredClone(s);game.step(s,{type:'ability',name:'ward'},20);assert.equal(s.strategy.shield,before.strategy.shield);assert.equal(s.strategy.focus,0);assert.equal(s.moves,0);
 game.step(s,game.hint(s),1000);assert.equal(s.strategy.abilityUsed,false);assert.ok(s.strategy.focus>0);
 const gambit=make();game.step(gambit,{type:'ability',name:'gambit'},10);assert.equal(gambit.strategy.focus,1);assert.equal(gambit.strategy.gambit,true);game.step(gambit,game.hint(gambit),1000);assert.equal(gambit.strategy.gambit,false);
});
test('transmutation respects fixed pillars and changes paired resonance tiles together',()=>{
 const pillars=make(27),board=structuredClone(pillars.board);game.step(pillars,{type:'ability',name:'transmute',slot:2},10);assert.deepEqual(pillars.board,board);assert.equal(pillars.strategy.focus,3);
 const s=make(28),left=s.board.cells[0],right=s.board.cells[4];game.step(s,{type:'ability',name:'transmute',slot:0},20);assert.equal(s.board.cells[0],(left+1)%4);assert.equal(s.board.cells[4],(right+1)%4);assert.equal(s.strategy.focus,0);assert.equal(s.moves,0);
});
test('forecast is committed once, correct calls add damage, and incorrect calls cost focus',()=>{
 const yes=make(),no=make(),move=game.analyze(yes)[0],symbol=move.symbols.indexOf(Math.max(...move.symbols));
 game.step(yes,{type:'forecast',symbol},10);game.step(yes,{type:'forecast',symbol:(symbol+1)%4},11);assert.equal(yes.strategy.forecast,symbol);
 game.step(no,{type:'forecast',symbol:(symbol+1)%4},10);game.step(yes,move.action,1000);game.step(no,move.action,1000);
 assert.equal(yes.strategy.counts.forecasts,1);assert.equal(no.strategy.counts.forecasts,0);assert.equal(yes.strategy.lastDamage-no.strategy.lastDamage,5);assert.equal(yes.strategy.forecast,null);assert.ok(yes.strategy.focus>no.strategy.focus);
});
test('hidden-memory execution records recall without exposing analysis',()=>{
 const s=make(8),move=game.analyze(s)[0];game.step(s,{type:'study'},10);assert.equal(s.board.revealed,false);assert.deepEqual(game.analyze(s),[]);assert.equal(game.hint(s),null);
 const symbol=move.symbols.indexOf(Math.max(...move.symbols));game.step(s,{type:'forecast',symbol},20);game.step(s,move.action,1000);assert.equal(s.strategy.counts.hidden,1);assert.equal(s.strategy.counts.forecasts,1);
});
test('dual phase changes and invalid moves do not spend turns, focus, or health',()=>{
 const s=make(23),before=structuredClone(s.strategy);game.step(s,{type:'phase',phase:1},10);assert.equal(s.moves,0);assert.equal(s.strategy.heroTurns,0);assert.equal(s.strategy.focus,before.focus);
 game.step(s,{type:'swap',a:-1,b:9000},20);assert.equal(s.moves,0);assert.equal(s.strategy.health,before.health);assert.equal(s.strategy.guardianTurns,0);
});
test('board-only and guardian-only completion cannot prematurely win the campaign',()=>{
 const s=make();s.strategy.guardianHealth=1;game.step(s,game.hint(s),1000);assert.equal(s.strategy.guardianHealth,0);assert.ok(s.progress<36);assert.equal(s.status,'playing');
 const boardDone=make();boardDone.progress=36;game.step(boardDone,game.hint(boardDone),1000);assert.ok(boardDone.strategy.guardianHealth>0);assert.equal(boardDone.status,'playing');
});
test('shared room, balance and seal progress stays consistent after guardian changes',()=>{
 for(const level of [10,22,33]){const s=make(level);for(let i=0;i<5&&s.status==='playing';i++){play(s,i*1000);const expected=level===10?s.board.visited.length:level===22?s.board.contributions.reduce((a,b)=>a+b,0):33-s.board.seals.filter(Boolean).length;assert.equal(s.progress,expected);}}
});
test('Concordia alternates human players even when the guardian attacks',()=>{
 const s=make(32);game.step(s,game.hint(s),1000);assert.equal(s.board.turn,1);assert.equal(s.strategy.guardianTurns,0);assert.ok(s.strategy.lastIncoming>0);game.step(s,game.hint(s),2000);assert.equal(s.board.turn,2);assert.ok(s.board.contributions[0]>0);assert.ok(s.board.contributions[1]>0);
});
test('health and campaign budgets produce real defeat outcomes',()=>{
 const s=make(25,'grandmaster');s.strategy.health=1;game.step(s,game.hint(s),1000);assert.equal(s.status,'failed');assert.equal(s.strategy.health,0);
 const limit=make();limit.strategy.heroTurns=limit.strategy.limit-1;limit.moves=limit.strategy.heroTurns;limit.board.turn=limit.moves;game.step(limit,game.hint(limit),1000);assert.equal(limit.status,'failed');assert.match(limit.feedback,/turn limit/);
});
test('boss phases and their shield change at published health thresholds',()=>{
 const s=make(33);assert.equal(game.strategy.phase(s),1);s.strategy.guardianHealth=Math.floor(s.strategy.guardianMax*2/3);assert.equal(game.strategy.phase(s),2);s.strategy.guardianHealth=Math.floor(s.strategy.guardianMax/3);assert.equal(game.strategy.phase(s),3);
});
test('daily seeds repeat exactly for matching UTC date, level and difficulty',()=>{
 const seed=game.strategy.dailySeed('2026-10-20',7,'tactician');assert.equal(seed,game.strategy.dailySeed('2026-10-20',7,'tactician'));
 assert.notEqual(seed,game.strategy.dailySeed('2026-10-21',7,'tactician'));assert.notEqual(seed,game.strategy.dailySeed('2026-10-20',7,'grandmaster'));
 const a=game.initial(7,seed,false,0,{mode:'campaign',difficulty:'tactician',daily:'2026-10-20'}),b=game.initial(7,seed,false,0,{mode:'campaign',difficulty:'tactician',daily:'2026-10-20'});assert.deepEqual(a,b);
});
test('mastery medals migrate older progress and improve without duplicate completion rewards',()=>{
 const p=profiles.initial();delete p.mastery;const migrated=profiles.validate(p);assert.deepEqual(migrated.mastery,{});
 const s=make(6,'story');while(s.status==='playing')play(s);profiles.award(migrated,s,game.LEVELS[5]);assert.equal(migrated.mastery[6].rank,1);const coins=migrated.coins;
 const higher=make(6,'tactician');while(higher.status==='playing')play(higher);profiles.award(migrated,higher,game.LEVELS[5]);assert.equal(migrated.mastery[6].rank,2);assert.equal(migrated.coins,coins);assert.deepEqual(profiles.validate(migrated),migrated);
});
test('malformed campaign imports fail before modifying running state',()=>{
 const mutations=[s=>{s.strategy.focus=99;},s=>{s.strategy.health=-1;},s=>{s.strategy.heroTurns=10000;},s=>{s.strategy.difficulty='fake';},s=>{s.strategy.collections.phases='bad';},s=>{s.strategy.intent.hits=null;},s=>{s.strategy.lastSymbol=99;},s=>{s.strategy.intent.action.a={toString:'bad'};},s=>{s.strategy.intent.action.type='rotate';}];
 for(const mutate of mutations){const data=game.save(make());mutate(data.session);assert.throws(()=>game.restore(data));}
});

test('the campaign retains the spiral’s real entropy failure without charging a player turn',()=>{
 const s=make(5);s.board.chain=Array(63).fill(1);const before=s.strategy.heroTurns;game.step(s,{type:'tick'},2000);assert.equal(s.status,'failed');assert.equal(s.board.chain.length,64);assert.equal(s.strategy.heroTurns,before);assert.deepEqual(game.restore(game.save(s)),s);
});

test('spiral planning compresses separated triples instead of waiting blindly for the void',()=>{
 const s=game.initial(5,123,false,0);s.board.chain=[0,1,2,3,0,1,2,3,0];let turns=0;
 while(s.progress===0&&turns++<10){const h=game.hint(s);assert.ok(h);game.step(s,h,turns);}
 assert.ok(s.progress>0);assert.ok(turns<=7);
});
