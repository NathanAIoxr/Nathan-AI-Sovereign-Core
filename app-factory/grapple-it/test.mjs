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
console.log('Six classic bubble courses, four water-ring courses, 46 line-course simulations, and line-break recovery passed.');
