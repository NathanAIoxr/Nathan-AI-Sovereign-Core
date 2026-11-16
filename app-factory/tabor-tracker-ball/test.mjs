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
assert.equal(Object.keys(catalog).length,12);
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
