import { EVENTS,simulate } from './precision.mjs';
import { STEP,createShot,advanceShot } from './physics.mjs';
import { STAGES,newLift,pump,stepLift } from './grapple.mjs';

export const CHASSIS = {
  A:'Trajectory & Arc', B:'Spin & Stick', C:'Tether & Buoyancy', D:'Clash, Parry & Rhythm', E:'Precision Craft',
};

const finite=(value,min,max)=>Number.isFinite(value)&&value>=min&&value<=max;
const choice=(value,allowed)=>allowed.includes(value);
const wrap=angle=>(angle%360+540)%360-180;
export const THEMES={porch:['#527163','#112c2a'],harbor:['#276073','#132b4a'],fair:['#763c56','#341839'],forest:['#3f6454','#182d23'],night:['#494474','#1c233e'],winter:['#426789','#24454e']};
const valid={
  A:p=>EVENTS.some(event=>event.id===p.eventId)&&finite(p.angle,0,78)&&finite(p.force,20,100)&&
    (p.spin===undefined||finite(p.spin,0,100))&&(p.wind===undefined||finite(p.wind,-.15,.15))&&
    (p.target===undefined||Array.isArray(p.target)&&p.target.length===2&&p.target.every(value=>finite(value,.15,.88))),
  B:p=>finite(p.mass,.25,5)&&finite(p.gravity,3,15)&&finite(p.inertia,.3,4)&&finite(p.targetAngle,-180,180)&&finite(p.minimumRotation,0,540)&&finite(p.tolerance,5,45)&&finite(p.rebound,0,.7),
  C:p=>p.mode==='pendulum'?finite(p.wind,-.6,.6):p.mode==='buoyancy'&&Number.isInteger(p.course)&&p.course>=0&&p.course<STAGES.length,
  D:p=>finite(p.beatMs,600,2400)&&finite(p.strikePhase,.45,.76)&&finite(p.window,.04,.2)&&Number.isInteger(p.lane)&&finite(p.lane,0,2)&&finite(p.recoil,0,.5),
  E:p=>Array.isArray(p.path)&&p.path.length>=3&&p.path.length<=18&&p.path.every(n=>Number.isInteger(n)&&finite(n,0,8))&&finite(p.tolerance,.04,.15)&&finite(p.minimum,.5,1),
};
export function validatePlugins(entries) {
  if(!Array.isArray(entries)||entries.length===0) throw new Error('A game catalog needs at least one entry.');
  const ids=new Set();
  for(const game of entries){
    if(!game||typeof game.id!=='string'||!/^[a-z0-9-]{1,36}$/.test(game.id)||ids.has(game.id)||
      typeof game.name!=='string'||!game.name.trim()||game.name.length>72||!Object.hasOwn(valid,game.baseChassis)||
      !choice(game.art,['horseshoe','bottle','skillet','ring','bubble','quintain','pillow','stamp','pumpkin'])||
      (game.theme!==undefined&&!Object.hasOwn(THEMES,game.theme))||
      (game.mark!==undefined&&(typeof game.mark!=='string'||[...game.mark].length>4||!game.mark.trim()))||
      !choice(game.sound,['bell','tap','clang','silent'])||!game.parameters||!valid[game.baseChassis](game.parameters)||
      !Number.isInteger(game.bridge?.points)||!finite(game.bridge.points,1,100)) throw new Error('Invalid game config: '+(game?.id??'missing ID'));
    ids.add(game.id);
  }
  return entries;
}
const result=(points,success,message,score=Number(success))=>({points,success,message,score});
const traceNode=node=>({x:.22+node%3*.28,y:.24+Math.floor(node/3)*.24});
export const traceOutline=path=>path.map(traceNode);

export function arcEvent(parameters) {
  const event=EVENTS.find(item=>item.id===parameters.eventId);
  return {...event,target:parameters.target??event.target,wind:parameters.wind??event.wind};
}
function arc(parameters,input) {
  const flight=simulate(arcEvent(parameters),{angle:input.angle??parameters.angle,force:input.force??parameters.force,spin:input.spin??parameters.spin??55});
  return {...flight,score:Number(flight.success)};
}

function spinAndStick(p,{power,spin}) {
  const launch=(power/100)*5.8/Math.sqrt(p.mass);
  const airtime=2*launch/p.gravity;
  const omega=(spin/100)*740/p.inertia;
  const points=[];
  for(let index=0;index<=36;index++){
    const f=index/36,time=f*airtime;
    points.push({x:.2+.55*f,y:.78-(launch*time-.5*p.gravity*time*time)*.42,angle:omega*time});
  }
  const angle=Math.abs(wrap(omega*airtime-p.targetAngle));
  const completedRotation=omega*airtime>=p.minimumRotation;
  const success=completedRotation&&angle<=p.tolerance;
  if(!success&&p.rebound>0) points.push({x:.79,y:.78-p.rebound*.24,angle:omega*airtime+30},{x:.84,y:.78,angle:omega*airtime+55});
  return result(points,success,success?'Landed clean.':completedRotation?'Bounced off the landing pad.':'Complete a full flip before landing.',Math.round(angle));
}

function tether(p,input) {
  if(p.mode==='pendulum'){
    const shot=createShot({pull:input.power/100,aim:input.aim/100,flick:0},p.wind);
    const points=[];
    while(!shot.result){
      if(points.length===0||Math.round(shot.time/STEP)%8===0) points.push({x:.5+shot.p.x*.5,y:.63-shot.p.z*.16});
      advanceShot(shot);
    }
    points.push({x:.5+shot.p.x*.5,y:.63-shot.p.z*.16});
    return result(points,shot.result.outcome==='catch',shot.result.detail);
  }
  const state=newLift(p.course);
  const points=[{x:state.x,y:state.y}];
  let budget=input.pulses;
  const course=STAGES[p.course];
  for(let index=0;index<1800&&!state.done;index++){
    const anchor=course.anchors[state.next];
    const delta=anchor?anchor[0]-state.x:0;
    const shouldPump=input.assist
      ? anchor&&state.y>anchor[1]+.025&&state.vy>=-.25&&Math.abs(delta)<.16
      : index<1080&&index%54===0;
    if(shouldPump&&budget>0&&pump(state))budget--;
    const correction=input.assist&&Math.abs(delta)>.008?Math.max(-1,Math.min(1,delta*10)):0;
    stepLift(state,1/120,correction+input.aim/100);
    if(index%12===0) points.push({x:state.x,y:state.y});
  }
  return result(points,state.done,state.done?'Bubble course cleared.':'The bubble missed a latch.',state.next);
}

function rhythm(p,{phase,lane,guard,guarded}) {
  if(guard){
    const close=Math.abs(phase-(p.strikePhase-.24))<=p.window;
    return result([{x:.28,y:.57},{x:.41,y:.57}],false,close?'Parry held. Strike through the green window.':'Parry missed the blue window.',Number(close));
  }
  const clean=lane===p.lane&&Math.abs(phase-p.strikePhase)<=p.window+(guarded?.035:0);
  const y=.3+lane*.19;
  return result([{x:.18,y},{x:clean?.74:.55-p.recoil,y}],clean,clean?'Timing target cleared.':'Try the marked lane during the green window.');
}

function craft(p,{trace}) {
  const outline=traceOutline(p.path);
  let matched=0;
  for(const sample of trace){
    const target=outline[matched];
    if(target&&Math.hypot(sample.x-target.x,sample.y-target.y)<=p.tolerance) matched++;
  }
  const score=matched/outline.length;
  return result(trace,score>=p.minimum,score>=p.minimum?'Pattern finished.':'Follow the numbered marks in order.',Math.round(100*score));
}
const engines={A:arc,B:spinAndStick,C:tether,D:rhythm,E:craft};
export function playChassis(game,input) {
  return engines[game.baseChassis](game.parameters,input);
}
export const boardNodes=Array.from({length:9},(_,index)=>traceNode(index));
