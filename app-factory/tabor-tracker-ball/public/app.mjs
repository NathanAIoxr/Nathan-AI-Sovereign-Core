import {TAU,analyze,clamp,axisRotation,multiply,decayMotion} from "./track-baller.mjs";
import {attachDigitTrackBaller,DigitGrip} from "./digit-input.mjs";
import {applyGrip,catalog,createRound,endMove,guardOpen,makeExample,tickGame,updateLive} from "./games.mjs";
import {colors,makeRenderer,pins} from "./render.mjs";

const el=id=>document.getElementById(id);
const canvas=el("field");
const renderer=makeRenderer(canvas);
const reduce=matchMedia("(prefers-reduced-motion: reduce)");
const key="tabor-tracker-ball:v1";
const launch=new URLSearchParams(location.search);
const hiveEmbed=launch.get("embed")==="hive"&&window.parent!==window&&!!launch.get("session");
if(hiveEmbed){
  document.documentElement.dataset.embed="hive";
  el("nathan-record-notice")?.remove();
}
let lastBridgeSignal;
const defaults={inertia:1.4,coast:.96,gain:1,ticks:15,haptics:false,audio:false,adaptive:true,safe:true,toe:false};
function load(){
  try{return JSON.parse(localStorage.getItem(key))??{};}catch{return {};}
}
const saved=load();
const settings={...defaults,...saved.settings};
const best=saved.best&&typeof saved.best==="object"?saved.best:{};
const options=Object.keys(defaults);
let game,rotation,velocity,live,trail,history,pressed,previousPoint,previousDial,example,replay;
let digit=null,gripBase=null;
let lastTick=0,lastVibration=-Infinity,lastBeat=-1,lastSound=-Infinity,audioContext,frameTime;
function write(id,text){const node=el(id);if(node.textContent!==String(text)) node.textContent=text;}
function persist(){
  try{localStorage.setItem(key,JSON.stringify({settings,best}));}catch{}
}
for(const id of options){
  const input=el(id);
  if(typeof defaults[id]==="boolean") input.checked=settings[id]===true;
  else{
    const value=Number(settings[id]);
    input.value=Number.isFinite(value)?clamp(value,Number(input.min),Number(input.max)):defaults[id];
    settings[id]=Number(input.value);
    write(id+"-value",input.value+(id==="ticks"?"°":""));
  }
  input.addEventListener("input",()=>{
    if(input.type==="checkbox") settings[id]=input.checked;
    else{settings[id]=Number(input.value);write(id+"-value",input.value+(id==="ticks"?"°":""));}
    if(id==="audio"&&settings.audio) wakeAudio();
    persist();
  });
}
function wakeAudio(){
  if(!settings.audio) return;
  const Constructor=window.AudioContext||window.webkitAudioContext;
  if(!Constructor) return;
  try{audioContext??=new Constructor();if(audioContext.state==="suspended") audioContext.resume().catch(()=>{});}catch{}
}
function sound(frequency,volume,type){
  if(!settings.audio||game.id!=="dj"||audioContext?.state!=="running") return;
  const t=audioContext.currentTime, wave=audioContext.createOscillator(), level=audioContext.createGain();
  wave.type=type;wave.frequency.setValueAtTime(frequency,t);wave.frequency.exponentialRampToValueAtTime(frequency*.58,t+.065);
  level.gain.setValueAtTime(volume,t);level.gain.exponentialRampToValueAtTime(.001,t+.075);
  wave.connect(level).connect(audioContext.destination);wave.start(t);wave.stop(t+.082);
}
function reflect(s){
  write("gesture",s.kind);
  write("direction",s.spin?(s.spin==="clockwise"?"CW":"CCW"):(s.length>.09?s.direction:"—"));
  write("rpm",Math.round(Math.abs(s.rpm))+" rpm");
  write("speed",s.speed.toFixed(2)+" /s");
  write("power",Math.round(s.power*100)+"%");
}
function updateHud(){
  if(game.score>(Number(best[game.id])||0)){best[game.id]=game.score;persist();}
  write("score",game.score+" pts");write("best",Number(best[game.id])||0);
  write("status",game.notice||(game.done?"Round complete.":""));
  const objectives={grip:game.progress+" / 3 release drills",storm:game.debris.filter(d=>d.active).length+" pieces left",
    whirl:game.debris.filter(d=>d.active).length+" markers left · "+(game.progress%2?"CCW":"CW"),
    sword:game.progress+" / 5 moves",ball:game.progress+" / 3 pockets",magic:game.progress+" / 3 portals",
    dj:game.progress+" / 5 scratches",forge:game.progress+" / 3 heats",globe:game.landmarks.size+" / 4 landmarks",
    dial:game.progress+" / 3 tumblers",pottery:"Band "+(game.band+1)+" of 3",
    lift:Math.min(2.2,game.progress).toFixed(1)+" / 2.2 s at altitude",fish:Math.round(game.reel*100)+"% reeled in"};
  write("objective",game.done?"Round complete":objectives[game.id]);
  if(hiveEmbed){
    const signal=game.id+":"+game.score+":"+game.done;
    if(signal!==lastBridgeSignal){
      lastBridgeSignal=signal;
      window.parent.postMessage({type:"tabor:hive-arcade",session:launch.get("session"),score:game.score,done:game.done},location.origin);
    }
  }
}
function interrupt(){
  pressed=false;example=null;replay=null;live=null;trail=[];
  previousPoint=null;previousDial=0;el("trace-label").hidden=true;
}
function contact(detail){
  digit=detail;
  write("contact-count",detail.contacts||detail.peakContacts);
  write("grip-size",detail.peakContacts>1?Math.round(detail.scale*100)+"% · "+Math.round(detail.twist*180/Math.PI)+"°":"—");
  if(detail.guardMs!=null) write("lift-guard",detail.guardMs+" ms");
  if(detail.wristFlip) write("grip-power",Math.round(detail.wristFlip.power*100)+"%");
}
function startGrip(detail){
  if(game.done) return;
  pressed=true;live=null;trail=[];velocity=[0,0,0];
  gripBase={zoom:game.zoom,clay:game.clay[game.band],radius:game.vortex?.radius,
    rotation,initial:detail};
}
function moveGrip(detail){
  if(!gripBase||game.done) return;
  applyGrip(game,detail,"move",gripBase);
  if(game.id==="globe"){
    const initial=gripBase.initial;
    rotation=multiply(axisRotation((detail.dy-initial.dy)*3,-(detail.dx-initial.dx)*3,detail.twist),gripBase.rotation);
  }
}
function endGrip(detail){
  contact(detail);
  if(gripBase){
    moveGrip(detail);applyGrip(game,detail,"end",gripBase);
    gripBase=null;pressed=false;
  }else if(game.id==="grip") applyGrip(game,detail,"end");
  updateHud();
}
function clearGrip(){
  if(gripBase){
    game.zoom=gripBase.zoom;game.dial=0;game.clay[game.band]=gripBase.clay;rotation=gripBase.rotation;
    if(game.vortex&&gripBase.radius) game.vortex.radius=gripBase.radius;
  }
  digit=null;gripBase=null;interrupt();
  write("contact-count","—");write("grip-size","—");
}
const controls=attachDigitTrackBaller(canvas,{
  limb:()=>settings.toe?"toe":"hand",adaptive:()=>settings.adaptive,safeCancel:()=>settings.safe,
  onGripStart:startGrip,onGripMove:moveGrip,onContact:contact,onGripEnd:endGrip,onGripCancel:clearGrip,
  onStart(p){if(!game.done){wakeAudio();start(p);}},
  onMove(s){if(pressed) move(s);},
  onEnd(s){if(pressed) release(s);},
  onCancel:interrupt,
});
function begin(id){
  controls.cancel();interrupt();digit=null;gripBase=null;
  game=createRound(id);rotation=[1,0,0,0];velocity=[0,0,0];history=[];lastBeat=-1;
  write("game-title",catalog[id].title);write("game-group",catalog[id].group);write("guide",catalog[id].hint);
  write("example",catalog[id].example);
  const alt={storm:"Try counterclockwise",sword:"Try parry",ball:"Try a curved shot",pottery:"Next clay band"};
  el("alternate").hidden=!alt[id];write("alternate",alt[id]??"");el("replay").disabled=true;
  for(const button of el("game-list").children) button.setAttribute("aria-pressed",String(button.dataset.game===id));
  document.documentElement.style.setProperty("--accent",colors[id]);
  for(const label of ["gesture","direction","rpm","speed","power","contact-count","grip-size","lift-guard","grip-power"]) write(label,"—");
  updateHud();
}
function start(p){
  interrupt();pressed=true;previousPoint=p;trail=[p];
  velocity=[0,0,0];lastTick=0;
}
function move(s){
  if(!previousPoint||!s) return;
  const gain=settings.gain, dx=s.end.x-previousPoint.x,dy=s.end.y-previousPoint.y;
  const turn=s.dial-previousDial;
  let axes=[-dy*gain*4,dx*gain*4,turn*gain*.38];
  if(game.id==="globe") axes=[dy*gain*4,-dx*gain*4,0];
  rotation=multiply(axisRotation(...axes),rotation);
  updateLive(game,s,live);
  const degrees=game.id==="dial"||game.id==="pottery"||game.id==="fish"?s.dial/TAU*360:s.turn*360;
  const tick=settings.ticks?Math.trunc(degrees/settings.ticks):0;
  if(tick!==lastTick&&s.end.pointerType==="touch"&&s.end.t-lastVibration>46&&settings.haptics){
    navigator.vibrate?.(8);lastVibration=s.end.t;
  }
  lastTick=tick;
  if(game.id==="dj"&&s.end.t-lastSound>65&&Math.abs(dx)>.023){
    sound(155+Math.min(380,Math.abs(s.vx)*70),.065,"triangle");lastSound=s.end.t;
  }
  previousPoint=s.end;previousDial=s.dial;trail=s.path;live=s;reflect(s);
}
function release(s){
  if(s){
    move(s); history=s.path.slice(); el("replay").disabled=history.length<2;
    const scale=settings.gain*1.4/settings.inertia;
    velocity=[clamp(-s.vy*scale*3,-10,10),clamp(s.vx*scale*3,-10,10),clamp(s.angularVel*scale,-15,15)];
    if(game.id==="globe") velocity=[clamp(s.vy*scale*2,-6,6),clamp(-s.vx*scale*2,-6,6),0];
    endMove(game,s,settings.gain);updateHud();
  }
  pressed=false;live=null;previousPoint=null;previousDial=0;
}
function globeExample(){
  const current=pins(rotation),i=current.findIndex((_,i)=>!game.landmarks.has(i));
  if(i<0) return [];
  const [x,y,z]=current[i];
  const l=Math.hypot(x,y), phi=Math.atan2(l,z);
  const dx=l?x/l*phi/(4*settings.gain):z<0?.5:0,dy=l?y/l*phi/(4*settings.gain):0;
  return Array.from({length:80},(_,j)=>({x:(j/79-.5)*dx,y:(j/79-.5)*dy,t:j*10,pointerType:"sample"}));
}
function sampleGrip(){
  const count=game.progress+1;
  const grip=new DigitGrip({width:440,height:400,limb:settings.toe?"toe":"hand",adaptive:settings.adaptive});
  const point=(id,t,travel)=>({x:id===2?270:id===1?190:220,y:(id===0?250:170)-travel,t});
  for(let id=0;id<count;id++) grip.down(id,point(id,0,0));
  for(let t=12;t<=144;t+=12){
    for(let id=0;id<count;id++) grip.move(id,point(id,t,t*.68));
  }
  for(let id=0;id<count;id++){
    const result=grip.up(id,point(id,158+id*12,100));
    if(result) endGrip(result);
  }
}
function sample(alternate=false){
  if(game.done) begin(game.id);
  controls.cancel(); wakeAudio();
  if(game.id==="grip"){sampleGrip();return;}
  if(game.id==="pottery"&&alternate){endMove(game,analyze([{x:0,y:((game.band+1)%3-1)*.22,t:0}]));updateHud();return;}
  if(game.id==="sword"&&alternate) game.clock=1.19;
  const points=game.id==="globe"?globeExample():makeExample(game,alternate);
  if(!points.length) return;
  start(points[0]);example={points,elapsed:0};
}
function startReplay(){
  if(history.length<2) return;
  controls.cancel();interrupt();replay={points:history.slice(),elapsed:0};el("trace-label").hidden=false;
}
function advanceExamples(dt){
  if(example){
    example.elapsed+=dt*1000;
    const shown=example.points.filter(p=>p.t<=example.elapsed);
    const detail=analyze(shown);
    if(shown.length>=example.points.length){example=null;release(detail);}
    else if(detail) move(detail);
  }
  if(replay){
    replay.elapsed+=dt*1000;
    const origin=replay.points[0].t;
    trail=replay.points.filter(p=>p.t-origin<=replay.elapsed);
    if(trail.length===replay.points.length){replay=null;el("trace-label").hidden=true;}
  }
}
function tick(now){
  const dt=frameTime===undefined?0:Math.min(.035,(now-frameTime)/1000);
  frameTime=now;
  advanceExamples(dt);
  if(!pressed&&!reduce.matches&&!replay){
    const {velocity:decay,travel}=decayMotion(settings.coast,dt);
    if(Math.hypot(...velocity)>.015) rotation=multiply(axisRotation(...velocity.map(n=>n*travel)),rotation);
    velocity=velocity.map(n=>n*decay);
  }
  if(!replay) tickGame(game,dt,live,game.id==="globe"?pins(rotation):[]);
  if(game.id==="dj"){
    const beat=Math.floor(game.clock/.6);
    if(beat!==lastBeat){sound(beat%4?105:153,.10,"sine");lastBeat=beat;}
  }
  updateHud();
  renderer.draw(game,rotation,live,trail,!!replay,reduce.matches,digit);
  requestAnimationFrame(tick);
}
for(const item of Object.values(catalog)){
  const button=document.createElement("button");
  button.type="button";button.dataset.game=item.id;button.textContent=item.title;
  button.addEventListener("click",()=>begin(item.id));el("game-list").append(button);
}
el("reset").addEventListener("click",()=>begin(game.id));
el("example").addEventListener("click",()=>sample());
el("alternate").addEventListener("click",()=>sample(true));
el("replay").addEventListener("click",startReplay);
const selected=launch.get("game");
begin(Object.hasOwn(catalog,selected)?selected:"storm");
renderer.fit();
new ResizeObserver(()=>{controls.cancel();renderer.fit();}).observe(canvas);
requestAnimationFrame(tick);
if("serviceWorker" in navigator) navigator.serviceWorker.register("./sw.js").catch(()=>{});
