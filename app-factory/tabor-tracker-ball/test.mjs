import assert from "node:assert/strict";
import {analyze,addTrackBallerToArcadeAction,axisRotation,multiply,project,normalizeOverlay,decayMotion} from "./public/track-baller.mjs";
import {catalog,createRound,makeExample,endMove,tickGame,updateLive,potteryTargets,globeTargets,guardOpen} from "./public/games.mjs";

const points=(fn,n=180,ms=950)=>Array.from({length:n+1},(_,i)=>({...fn(i/n),t:i/n*ms}));
const round=sign=>points(f=>({x:.17*Math.cos(sign*f*2.1*Math.PI),y:.17*Math.sin(sign*f*2.1*Math.PI)}));
assert.equal(analyze(round(1)).kind,"swirl");
assert.equal(analyze(round(-1)).spin,"counterclockwise");
assert.ok(analyze(round(1)).rpm>40);
assert.equal(analyze(points(f=>({x:f*.47,y:0}),12,210)).kind,"swipe");
assert.equal(analyze(points(f=>({x:f*.47,y:0}),12,210)).direction,"right");
assert.equal(analyze([{x:0,y:0,t:0},{x:0,y:0,t:500}]).kind,"hold");
assert.equal(analyze([{x:0,y:0,t:0},{x:.003,y:.003,t:80}]).kind,"tap");
assert.equal(analyze(makeExample(createRound("magic"))).kind,"figure-eight");
assert.equal(analyze(makeExample(createRound("forge"))).kind,"scrub");
assert.throws(()=>normalizeOverlay({frictionDecay:1}),RangeError);
assert.equal(normalizeOverlay().hapticTickDegrees,15);
const augmented=addTrackBallerToArcadeAction({kind:"gesture",duration:1,rotation:.7,track:round(1).map(p=>({x:p.x*260,y:p.y*260}))},260);
assert.equal(augmented.trackBaller.kind,"swirl");
assert.equal(augmented.rotation,.7);
const full=decayMotion(.96,.2), half=decayMotion(.96,.1);
assert.ok(Math.abs(full.velocity-half.velocity**2)<1e-12);
assert.ok(Math.abs(full.travel-half.travel*(1+half.velocity))<1e-12);

function simulate(game, sample=makeExample(game), margin=0, pins=[]){
  let prior=null, priorTime=0;
  for(let i=1;i<=sample.length;i++){
    const detail=analyze(sample.slice(0,i)), now=sample[i-1].t;
    updateLive(game,detail,prior);
    tickGame(game,(now-priorTime)/1000,detail,pins);
    prior=detail;priorTime=now;
  }
  endMove(game,prior);
  for(let t=0;t<margin;t+=.015) tickGame(game,.015,null,pins);
}
assert.equal(Object.keys(catalog).length,13);
for(const id of Object.keys(catalog)) normalizeOverlay(catalog[id].controllerOverlay);
for(const id of ["storm","whirl","sword","ball","magic","dj","forge","dial"]){
  const game=createRound(id);
  simulate(game,makeExample(game),2.7);
  assert.ok(game.score>0,id+" score");
}
const blade=createRound("sword");
blade.clock=1.24;assert.ok(guardOpen(blade.clock+.52));
simulate(blade,makeExample(blade,true));
assert.equal(blade.score,80);
const dial=createRound("dial");
for(let i=0;i<3;i++) simulate(dial);
assert.equal(dial.done,true);
const clay=createRound("pottery");
for(const band of [0,1,2]){clay.band=band;simulate(clay);}
assert.ok(clay.clay.every((r,i)=>Math.abs(r-potteryTargets[i])<.09));
assert.equal(clay.done,true);
const flight=createRound("lift");
for(let i=0;i<4;i++) simulate(flight);
assert.ok(flight.height>.5);
const fish=createRound("fish");
for(let i=0;i<10&&!fish.done;i++){
  simulate(fish);
  for(let j=0;j<130;j++) tickGame(fish,.01);
}
assert.equal(fish.done,true);
const globe=createRound("globe");
for(const [x,y,z] of globeTargets){
  const r=Math.hypot(x,y), phi=Math.atan2(r,z);
  const q=multiply(axisRotation(y/r*phi,-x/r*phi,0),[1,0,0,0]);
  const centered=project(q,[x,y,z]);
  assert.ok(Math.hypot(centered[0],centered[1])<1e-9&&centered[2]>0);
}

const {DigitGrip}=await import("./public/digit-input.mjs");
const {applyGrip}=await import("./public/games.mjs");
const two=new DigitGrip({width:400,height:360,adaptive:false});
const p=(x,y,t)=>({x,y,t});
two.down(1,p(150,190,0));two.down(2,p(250,190,0));
two.move(1,p(175,150,65));two.move(2,p(225,150,66));
assert.equal(two.state(67).scale,.5);
const globeGrip=createRound("globe");
applyGrip(globeGrip,two.state(67),"move",{zoom:1});
assert.equal(globeGrip.zoom,.72);
two.move(1,p(200,125,80));two.move(2,p(200,175,81));
assert.ok(Math.abs(two.state(81).twist-Math.PI/2)<1e-9);
assert.ok(two.state(81).spanMm>13&&two.state(81).spanMm<14);
two.up(1,p(0,358,100));
two.move(2,p(1,358,110));
const twoRelease=two.up(2,p(1,358,130));
assert.ok(Math.abs(twoRelease.twist-Math.PI/2)<1e-9,"first lift freezes the grip");
assert.equal(twoRelease.guardMs,16);
assert.equal(twoRelease.wristFlip.fingerCount,2);
assert.equal(twoRelease.mode,"MODE_WRIST_FLIP_PINCH_2D");

const lab=createRound("grip");
for(const count of [1,2,3]){
  const sample=new DigitGrip({width:440,height:400,limb:"toe",adaptive:true});
  const pt=(id,t,delta=0)=>p(id===2?270:id===1?190:220,(id===0?250:170)-delta,t);
  for(let id=0;id<count;id++) sample.down(id,pt(id,0));
  for(let t=12;t<=144;t+=12){
    for(let id=0;id<count;id++) sample.move(id,pt(id,t,t*.68));
  }
  let detail;
  for(let id=0;id<count;id++) detail=sample.up(id,p(435,399,158+id*12));
  assert.equal(detail.guardMs,20);
  assert.ok(detail.wristFlip.power>.12,"up-event outlier cannot reverse a guarded release");
  if(count===3) assert.equal(detail.wristFlip.releaseWindowMs,24);
  applyGrip(lab,detail,"end");
}
assert.equal(lab.score,300);
assert.equal(lab.done,true);
const cap=new DigitGrip({width:400,height:400});
for(let id=0;id<10;id++) assert.equal(cap.down(id,p(85+id*8,150,0)),true);
assert.equal(cap.down(10,p(200,200,0)),false);
assert.equal(cap.state(1).peakContacts,10);
const ballGrip=createRound("ball");
applyGrip(ballGrip,{...twoRelease,start:{x:0,y:.36},wristFlip:{power:.55,spin:.2,velocity:{x:.1}}},"end");
assert.ok(ballGrip.shot?.vy<-.55&&ballGrip.shot.spin>.1);

const {attachDigitTrackBaller}=await import("./public/digit-input.mjs");
const frames=new Map();
let frameId=0;
globalThis.requestAnimationFrame=f=>{frames.set(++frameId,f);return frameId;};
globalThis.cancelAnimationFrame=id=>frames.delete(id);
class PlaySurface {
  constructor(){this.events=new Map();this.capture=new Set();}
  getBoundingClientRect(){return {width:400,height:400,left:0,top:0};}
  addEventListener(name,handler){this.events.set(name,[...(this.events.get(name)??[]),handler]);}
  dispatchEvent(event){
    for(const handler of this.events.get(event.type)??[]){
      handler(event);
      if(event.stopped) break;
    }
  }
  hasPointerCapture(id){return this.capture.has(id);}
  setPointerCapture(id){this.capture.add(id);}
  releasePointerCapture(id){this.capture.delete(id);}
}
const surface=new PlaySurface(), stages=[], results=[];
let plainReleases=0;
surface.addEventListener("taborDigitGesture",event=>stages.push(event.detail.stage));
const control=attachDigitTrackBaller(surface,{onGripEnd:g=>results.push(g),onEnd:()=>plainReleases++});
function pointer(type,id,x,y,t){
  surface.dispatchEvent({type,pointerId:id,pointerType:"touch",button:0,clientX:x,clientY:y,timeStamp:t,
    stopImmediatePropagation(){this.stopped=true;}});
  for(const [id,callback] of [...frames]) {frames.delete(id);callback();}
}
pointer("pointerdown",1,150,200,10);
pointer("pointerdown",2,250,200,12);
pointer("pointermove",1,177,175,40);
pointer("pointermove",2,223,175,44);
pointer("pointerup",1,177,175,70);
pointer("pointerup",2,223,175,82);
assert.equal(results.length,1);
assert.equal(results[0].peakContacts,2);
assert.ok(results[0].scale<1);
assert.equal(plainReleases,0,"multitouch cannot fire a second single-pointer shot");
pointer("pointerdown",1,150,200,100);
pointer("pointerdown",2,250,200,102);
pointer("pointermove",2,396,200,112);
pointer("pointerup",1,150,200,126);
assert.equal(results.length,1);
assert.equal(stages.at(-1),"cancel");
assert.equal(surface.capture.size,0);
pointer("pointerdown",1,150,200,140);
pointer("pointerup",1,150,200,160);
assert.equal(plainReleases,1,"ordinary single-pointer input remains playable");
control.destroy();
