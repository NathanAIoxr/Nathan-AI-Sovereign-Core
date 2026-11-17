
import {newLift,pump,stepLift,STAGES} from './grapple.mjs';

import {makeRope,stepRope} from './rope.mjs';

const clamp=(value,lo,hi)=>Math.max(lo,Math.min(hi,value));
export function swingCourse(level){
 const anchors=STAGES[level].anchors;
 const [ax,ay]=anchors.at(-1);
 return {anchors,pivot:[ax,ay],goal:[ax<.54?.82:.18,Math.max(.26,ay+.09)],radius:.23};
}
export function startSwing(level){
 return {level,lift:newLift(level),phase:'lift',angle:0,speed:0,x:.5,y:.88,vx:0,vy:0,time:0,attempts:0};
}
export function swingAction(state){
 if(state.phase==='lift')return pump(state.lift)?'Air pumped. Steer toward the next anchor.':'';
 if(state.phase==='swing'){
  const course=swingCourse(state.level), r=course.radius;
  state.phase='flight';state.attempts++;
  state.vx=r*state.speed*Math.cos(state.angle);
  state.vy=-r*state.speed*Math.sin(state.angle)-.10;
  return 'Released. Aim for the goal ring.';
 }
 return '';
}
export function stepSwing(state,dt,direction=0){
 if(state.phase==='won')return '';
 state.time+=dt;
 const {pivot,goal,radius}=swingCourse(state.level);
 if(state.phase==='lift'){
  stepLift(state.lift,dt,direction);
  state.x=state.lift.x;state.y=state.lift.y;
  if(!state.lift.done)return '';
  state.phase='swing';state.x=pivot[0];state.y=pivot[1]+radius;
  state.rope=makeRope(pivot,[state.x,state.y],radius);
  return 'Latched. Use left or right to build a swing, then release toward the goal.';
 }
 if(state.phase==='swing'){
  state.speed=clamp((state.speed+(direction*5.4-Math.sin(state.angle)*3.2)*dt)*Math.exp(-dt*.42),-3.3,3.3);
  state.angle+=state.speed*dt;
  if(Math.abs(state.angle)>1.22){state.angle=Math.sign(state.angle)*1.22;state.speed*=-.62;}
  state.x=pivot[0]+Math.sin(state.angle)*radius;
  state.y=pivot[1]+Math.cos(state.angle)*radius;
  stepRope(state.rope,pivot,[state.x,state.y],dt);
  return '';
 }
 const fromX=state.x,fromY=state.y;
 state.vy+=.48*dt;state.x+=state.vx*dt;state.y+=state.vy*dt;
 const dx=state.x-fromX,dy=state.y-fromY;
 const ratio=clamp(((goal[0]-fromX)*dx+(goal[1]-fromY)*dy)/(dx*dx+dy*dy||1),0,1);
 if(Math.hypot(fromX+dx*ratio-goal[0],fromY+dy*ratio-goal[1])<.095){state.phase='won';return 'Goal secured.';}
 if(state.x<-.06||state.x>1.06||state.y>1.05){
  state.phase='swing';state.angle=0;state.speed=0;state.x=pivot[0];state.y=pivot[1]+radius;
  state.rope=makeRope(pivot,[state.x,state.y],radius);
  return 'Missed the goal. The line is still latched. Swing and try again.';
 }
 return '';
}
