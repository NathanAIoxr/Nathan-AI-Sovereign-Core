import assert from 'node:assert/strict';
import {EXPEDITIONS,GEAR,REWARD,TIERS} from './public/roster.mjs';
import {actionArcade,assistNathan,cleanProgress,completeArcade,isNathanTurn,newArcade,readyToRelease,stepArcade,turn,unlockedTier} from './public/arcade-engine.mjs';

function drive(s,{humanWins=false}={}){
  for(let frame=0;frame<120000&&s.phase!=='done';frame++){
    stepArcade(s,1/120);
    if(isNathanTurn(s)){assistNathan(s);continue;}
    if(humanWins&&turn(s).team===1&&s.tournament){
      if(s.time>1.35) actionArcade(s);
    }else if(s.phase==='reel'){
      if((s.reeling&&s.stress>=.68)||(!s.reeling&&s.stress<=.29))actionArcade(s);
    }else if((s.phase==='charge'&&s.charge>.60)||(s.gear.rule==='heavy'&&s.phase==='ready')||s.phase==='second'||s.phase==='ready'){
      if((s.gear.rule==='heavy'&&s.phase==='ready')||readyToRelease(s))actionArcade(s);
    }
  }
  assert.equal(s.phase,'done',s.gear.id);
  return s;
}
assert.equal(TIERS.length,6);
assert.equal(GEAR.size,25);
assert.equal(EXPEDITIONS.length,9);
const profile=cleanProgress(), session={nathan:false};
assert.equal(unlockedTier(profile),0);
for(const [i,tier] of TIERS.entries()){
  assert.equal(unlockedTier(profile),i);
  for(const g of tier.gear){
    const s=drive(newArcade({id:g.id}));
    assert.equal(s.result.won,true,g.name);
    assert.equal(s.receipts.length,3);
    assert.ok(completeArcade(profile,s,session)>0);
    assert.equal(completeArcade(profile,s,session),0);
  }
}
for(const mission of EXPEDITIONS){
  const s=drive(newArcade({mode:'expedition',mission:mission.id}));
  assert.equal(s.result.won,true,mission.id);
  assert.ok(s.result.hits>=2,mission.id);
}
for(const [mode,id] of [['coach','brass-ring'],['pk-wild','chickens'],['solo-bracket','brass-ring'],['team-bracket','sledge']]){
  const s=drive(newArcade({mode,id},{humanWins:true}));
  assert.equal(s.receipts.length,mode.endsWith('bracket')?12:3);
  if(s.tournament){
    assert.deepEqual(s.receipts.slice(0,4).map(x=>x.team),[0,1,0,1]);
    assert.equal(s.result.rounds.length,3);
  }else assert.equal(s.result.won,true);
}
assert.deepEqual(drive(newArcade({mode:'team-bracket'})).receipts.slice(0,4).map(x=>x.actor),['Grape 1','Apple 1','Grape 2','Apple 2']);
let s=drive(newArcade({mode:'nathan-full',id:'brass-ring'}));
assert.equal(s.result.won,true);completeArcade(profile,s,session);
s=drive(newArcade({mode:'pk-chaos',id:'rope'}));
assert.equal(s.result.won,true);assert.ok(completeArcade(profile,s,session)>=REWARD.coins);
assert.equal(profile.reunion,true);
const prize=drive(newArcade({id:REWARD.gear.id}));assert.equal(prize.result.won,true);
const snapped=newArcade({id:'rope'});
while(!readyToRelease(snapped))stepArcade(snapped,.01);
actionArcade(snapped);actionArcade(snapped);
for(let i=0;i<500&&snapped.phase==='reel';i++)stepArcade(snapped,.01);
assert.equal(snapped.receipts.length,1);assert.match(snapped.notice,/snapped/);
const second=newArcade({id:'firework'});
while(!readyToRelease(second))stepArcade(second,.01);
actionArcade(second);stepArcade(second,2.21);
assert.equal(second.receipts[0].success,false);
assert.deepEqual(cleanProgress({records:{'brass-ring':255,'__proto__':999,unknown:50},coins:-1}).records,{'brass-ring':255});
assert.equal(cleanProgress(null).coins,0);
console.log('25 gear trials, nine expeditions, four cast/bracket modes, local 2v2 order, Family Reunion, line break, and progress validation passed.');
