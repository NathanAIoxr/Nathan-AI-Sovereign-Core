import assert from 'node:assert/strict';
import {STAGES,newLift,pump,stepLift} from './public/grapple.mjs';
import {ERAS,dailyCourse,freshLine,castLine,advanceLine,linedUp,medal} from './public/campaign.mjs';

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
for(const course of [...ERAS,...daily]){
 for(const pk of [false,true]){
  const state=freshLine(course,pk);
  let hold=true;
  for(let i=0;i<7200&&state.phase!=='won';i++){
   if(state.phase==='aim'&&linedUp(state))castLine(state);
   if(state.stress>.58)hold=false;
   if(state.stress<.27)hold=true;
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
console.log('6 bubble courses, 30 line-course simulations, and line-break recovery passed.');
