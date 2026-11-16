const clamp=(x,min,max)=>Math.min(max,Math.max(min,x));
export const STAGES=[
  {name:'Harbor Lift',scene:'harbor',anchors:[[.5,.23]],current:.014},
  {name:'Canal Crossing',scene:'canal',anchors:[[.33,.44],[.68,.19]],current:.030},
  {name:'Orchard Lift',scene:'orchard',anchors:[[.72,.54],[.31,.35],[.56,.15]],current:.046},
  {name:'Sunken Salvage',scene:'salvage',anchors:[[.68,.63],[.39,.44],[.57,.19]], current:.056, targets:['Treasure chest','Mini-sub','Sea hook']},
];
export function newLift(level=0){
  return {level,x:.5,y:.88,vx:0,vy:0,time:0,next:0,pumps:0,lastPump:-1,settle:0,done:false};
}
export function pump(state){
  if(state.done||state.settle>0||state.time-state.lastPump<.14) return false;
  state.lastPump=state.time;
  state.pumps++;
  state.vy=Math.max(-.66,state.vy-(state.level===0?.63:.46));
  return true;
}
export function stepLift(state,dt,direction=0){
  if(state.done) return;
  const stage=STAGES[state.level];
  state.time+=dt;
  if(state.settle>0){
    state.settle-=dt;
    if(state.settle>0) return;
    if(state.next===stage.anchors.length){state.done=true;return;}
    state.x=stage.anchors[state.next-1][0];
    state.y=Math.min(.88,stage.anchors[state.next-1][1]+.09);
    state.vx=0;state.vy=0;
    return;
  }
  state.vx+=(clamp(direction,-1,1)*.78+Math.sin(state.time*2.3)*stage.current)*dt;
  state.vx*=Math.exp(-2.6*dt);
  state.x=clamp(state.x+state.vx*dt,.095,.905);
  state.vy=clamp(state.vy+.30*dt,-.66,.42);
  state.y+=state.vy*dt;
  if(state.y>=.88){state.y=.88;state.vy=0;}
  if(state.y<=.075){state.y=.075;state.vy=Math.max(state.vy,0);}
  const [x,y]=stage.anchors[state.next];
  if(Math.hypot((state.x-x)*1.12,state.y-y)<.064){
    state.x=x;state.y=y;state.vx=0;state.vy=0;
    state.next++;
    state.settle=.52;
  }
}
