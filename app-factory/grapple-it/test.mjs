import {CARTRIDGES,arena,checkpoints,tracePoint,scoreChallenge,arcadeGrade,openTier,sanitizeExpansion} from './public/arcade.mjs';
import {startSwing,stepSwing,swingAction,swingCourse} from './public/swing.mjs';
import assert from 'node:assert/strict';
import {STAGES,newLift,pump,stepLift} from './public/grapple.mjs';
import {ERAS,MISSIONS,dailyCourse,freshLine,castLine,advanceLine,linedUp,medal,tensionBand,actionMarker,doAction} from './public/campaign.mjs';
import {TOY_COURSES,startToy,toyTarget,stepToy,blowJet,grappleToy} from './public/toy.mjs';

for(const [i,stage] of STAGES.entries()){
 const state=newLift(i);
 for(let j=0;j<7200&&!state.done;j++){
  const [x,y]=stage.anchors[state.next]??[state.x,state.y];
  const delta=x-state.x;
  const steer=Math.abs(delta)>.008?Math.sign(delta)*Math.min(1,Math.abs(delta)*10):0;
  if(state.y>y+.025&&state.vy>=-.25&&Math.abs(delta)<.16)pump(state);
  stepLift(state,1/120,steer);
 }
 assert.ok(state.done,stage.name);
}
const daily=Array.from({length:11},(_,i)=>dailyCourse('2026-11-'+(i+10)));
for(const course of [...MISSIONS,...daily]){
 for(const pk of [false,true]){
  const state=freshLine(course,pk);
  let hold=true;
  const [low,high]=tensionBand(course);
  for(let i=0;i<7200&&state.phase!=='won';i++){
   if(state.phase==='aim'&&linedUp(state))castLine(state);
   if(state.phase==='action'&&Math.abs(actionMarker(state)-.5)<.07)doAction(state);
   if(state.stress>high-.13)hold=false;
   if(state.stress<low+.025)hold=true;
   state.hold=hold;
   advanceLine(state,1/120);
  }
  assert.equal(state.phase,'won',course.name);
  assert.equal(medal(state),'Gold',course.name);
 }
}
const snap=freshLine(ERAS[0]);castLine(snap);snap.hold=true;
for(let i=0;i<1300&&snap.breaks===0;i++)advanceLine(snap,1/120);
assert.equal(snap.breaks,1);
assert.equal(snap.phase,'aim');

assert.notEqual(toyTarget(TOY_COURSES[2],0,0).x,toyTarget(TOY_COURSES[2],0,1).x);
for(const course of TOY_COURSES){
 const state=startToy(course);
 assert.equal(grappleToy(state).hit,false);
 for(let i=0;i<15000&&!state.done;i++){
  const target=toyTarget(course,state.next,state.t);
  const dx=target.x-state.x,go=dx-state.vx*.3;
  const side=go>0?'left':'right';
  if(Math.abs(go)>.049&&state.y>target.y-.12&&Math.abs(state.vx)<.24)blowJet(state,side);
  else if(state.y>target.y+.033&&state.vy>-.21)blowJet(state,side);
  if(Math.hypot(1.07*dx,state.y-target.y)<=.105)grappleToy(state);
  stepToy(state,1/120);
 }
 assert.ok(state.done,course.name);
}
console.log('Six classic bubble courses, four water-ring courses, 54 line-course simulations, and line-break recovery passed.');

for(const [level,stage] of STAGES.entries()){
 const state=startSwing(level);
 const step=1/120;
 for(let i=0;i<7200&&state.phase==='lift';i++){
  const [x,y]=stage.anchors[state.lift.next]??[state.x,state.y];
  const shift=x-state.x;
  if(state.y>y+.025&&state.lift.vy>=-.25&&Math.abs(shift)<.16)swingAction(state);
  stepSwing(state,step,Math.max(-1,Math.min(1,shift*10)));
 }
 assert.equal(state.phase,'swing',stage.name+' latched');
 const side=Math.sign(swingCourse(level).goal[0]-swingCourse(level).pivot[0]);
 let won=false;
 for(let frame=18;frame<140&&!won;frame++){
  const trial={...state,lift:{...state.lift}};
  for(let i=0;i<frame;i++)stepSwing(trial,step,side);
  swingAction(trial);
  for(let i=0;i<390&&trial.phase==='flight';i++)stepSwing(trial,step);
  won=trial.phase==='won';
 }
 assert.ok(won,stage.name+' has a successful swing release');
}
assert.equal(CARTRIDGES.length,32);
assert.equal(new Set(CARTRIDGES.map(game=>game.id)).size,32);
assert.equal(new Set(CARTRIDGES.map(game=>game.chassis)).size,5);
for(const game of CARTRIDGES)for(const wild of [false,true])for(let round=0;round<3;round++){
 let maximum=0;
 for(let i=0;i<600&&maximum<100;i++){
  const t=i/60;
  const a=arena(game,t,round,wild);
  let caught=0;
  if(game.chassis==='craft')for(const [x,y] of checkpoints(game,round))caught=tracePoint(checkpoints(game,round),caught,x,y);
  maximum=Math.max(maximum,scoreChallenge(game,t,round,{x:a.x-a.drift,y:a.y},wild,caught));
 }
 assert.equal(maximum,100,game.title+' round '+(round+1)+' has a perfect score');
}
assert.equal(openTier({},1),false);
assert.equal(openTier({brass:150},1),true);
assert.equal(arcadeGrade(205),'Silver');
assert.equal(sanitizeExpansion({games:{brass:300,unknown:300},swings:{0:6000},form:'female'}).form,'female');
assert.equal(sanitizeExpansion({games:{brass:301,unknown:300}}).games.brass,undefined);
console.log('Six swing releases and 192 cartridge rounds across both rulesets passed.');