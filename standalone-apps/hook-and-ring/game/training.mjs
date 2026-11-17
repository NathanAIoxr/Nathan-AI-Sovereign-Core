import { attachTrackBaller } from '/controllers/track-baller.mjs';
import { attachDigitTrackBaller } from '/controllers/digit-input.mjs';
import { WristFlipEngine } from '/controllers/engine.mjs';
import { HybridKineticEngine } from '/controllers/kinetic.mjs';
import { clamp, HOOK, defaultThrow } from './physics.mjs';
import { importTosses, readTosses, saveToss, traceToss, drills } from './shot-record.mjs?v=2';

const $ = id => document.getElementById('lab-'+id);
const canvas = $('trajectory'), ctx = canvas.getContext('2d');
const pad = $('pad'), reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
const storage = (()=>{try{return localStorage;}catch{return null;}})();
const labels = {controls:'Controls',glass:'Glass touch',toe:'Toe profile','tracker-ball':'Tracker Ball',
  'digit-pinch':'Finger pinch','wrist-flip':'Wrist flip','air-motion':'Motion toss',import:'Imported'};
let records=readTosses(storage), active=null, reference=null, animation=0, controller, wristTimer, connected=false;
const settings = ['pull','aim','flick','wind'];
const currentMode = ()=>$('controller').value;
const read = name => Number($(name).value)/100;
const formatted = (value, digits=0) => value.toFixed(digits);
const neutral = {throw:defaultThrow,wind:0};
const currentDrill = ()=> $('drill').value===''?null:drills[Number($('drill').value)];
const showControl = name => {
  $(name+'-read').value = name==='wind' ? formatted(read(name),2)+' m/s²' : $(name).value+'%';
};

function draw(timeIndex) {
  const width=canvas.width,height=canvas.height;
  const x=value=>width*(.5+value*.63), z=value=>height*(.5-value*.238);
  ctx.clearRect(0,0,width,height);
  ctx.fillStyle='#10262c';ctx.fillRect(0,0,width,height);
  ctx.lineWidth=1;
  for(const metre of [-2,-1,0,1,2]){
    ctx.strokeStyle=metre===0?'#73999070':'#73999036';
    ctx.beginPath();ctx.moveTo(width*.05,z(metre));ctx.lineTo(width*.95,z(metre));ctx.stroke();
    ctx.fillStyle='#afc8bd';ctx.font='13px system-ui';ctx.fillText(metre+' m',11,z(metre)-5);
  }
  ctx.strokeStyle='#9abbaf55';ctx.beginPath(); ctx.moveTo(width*.5,14);ctx.lineTo(width*.5,height-14);ctx.stroke();
  function path(points, colour, dashes=[]){
    if(!points?.length)return;
    ctx.setLineDash(dashes);ctx.lineWidth=3;
    ctx.strokeStyle=colour;ctx.beginPath();
    points.forEach((p,i)=>{if(i)ctx.lineTo(x(p.x),z(p.z));else ctx.moveTo(x(p.x),z(p.z));});
    ctx.stroke();ctx.setLineDash([]);
  }
  path(reference?.points,'#8adfce',[6,8]);
  path(active?.points,'#e4f5a0');
  ctx.strokeStyle='#f6d796';ctx.lineWidth=2;
  ctx.beginPath();ctx.arc(x(0),z(HOOK.z),9,0,Math.PI*2);ctx.stroke();
  ctx.fillStyle='#f6d796';ctx.fillText('Hook',x(0)+14,z(HOOK.z)+5);
  const point=active?.points[timeIndex];
  if(point){ctx.fillStyle='#f5ffd2';ctx.beginPath();ctx.arc(x(point.x),z(point.z),6,0,Math.PI*2);ctx.fill();}
}
function display(record) {
  cancelAnimationFrame(animation);
  active={record,...traceToss(record.throw,record.wind,record.trick)};
  const values={...record.throw,wind:record.wind};
  for(const name of settings){$(name).value=Math.round(values[name]*100);showControl(name);}
  const {result}=active;
  $('result').textContent=result.detail+(reference?' · Dashed teal line is the comparison toss.':'');
  const gesture=record.gesture;
  const measures=[['Flight',formatted(result.ms/1000,2)+' s'],['Reach',formatted(result.depth/1000,2)+' m'],
    ['Off center',Math.abs(result.lateral)+' mm'],['Hook speed',formatted(result.speed/1000,2)+' m/s'],['Input',labels[record.source]??'Controls']];
  if(gesture){
    const {contacts,guard,velocity,twist,pinchScale,pinchSpan}=gesture;
    if(pinchScale!==undefined)measures.push(['Pinch scale',formatted(pinchScale,2)+'×']);
    if(pinchSpan!==undefined)measures.push(['Contact span',formatted(pinchSpan)+' mm']);
    measures.push(['Contacts',String(contacts)]);
    if(guard!==null)measures.push(['Lift guard',guard+' ms']);
    if(velocity)measures.push(['Release speed',formatted(Math.hypot(velocity.x,velocity.y),2)+' mm/ms']);
    if(twist!==undefined)measures.push(['Grip twist',formatted(twist*180/Math.PI)+'°']);
  }
  $('readouts').replaceChildren(...measures.map(([label,value])=>{
    const column=document.createElement('div'),term=document.createElement('dt'),detail=document.createElement('dd');
    term.textContent=label;detail.textContent=value;column.append(term,detail);return column;
  }));
  $('time').max=active.points.length-1;$('time').value=active.points.length-1;$('time').disabled=false;
  $('replay').disabled=false;draw(active.points.length-1);
}
function historyOptions() {
  $('history').replaceChildren(new Option('Choose a toss',''),...records.map((record,i)=>{
    const localDate=record.at?new Date(record.at).toLocaleTimeString([], {hour:'numeric',minute:'2-digit'}):'Saved';
    return new Option((i+1)+'. '+localDate+' · '+(labels[record.source]??'Controls')+' · '+traceToss(record.throw,record.wind,record.trick).result.detail,String(i));
  }));
  $('export').disabled=records.length===0;
  $('history').onchange();
}
function run(source='controls', raw={pull:read('pull'),aim:read('aim'),flick:read('flick')}, gesture) {
  const record=saveToss(storage,{throw:raw,wind:read('wind'),source,mode:'lab',gesture});
  if(!record)return;
  records=[record,...records].slice(0,40);historyOptions();display(record);
  const drill=currentDrill();
  if(drill)$('drill-goal').textContent=drill.wind!==record.wind?'Restore the drill breeze to score this attempt.':
    (drill.check(active.result)?'Drill cleared. ': 'Try again. ')+drill.goal;
}
function compare(record) {reference=traceToss(record.throw,record.wind,record.trick);display(active?.record??neutral);}
for(const name of settings)$(name).oninput=()=>showControl(name);
$('run').onclick=()=>run();
$('reference').onclick=()=>{
  const drill=currentDrill();
  compare(drill?{throw:drill.target,wind:drill.wind}:neutral);
};
$('drill').append(...drills.map((drill,index)=>new Option(drill.name,String(index))));
$('drill').onchange=()=>{
  const drill=currentDrill();
  reference=null;
  $('drill-goal').hidden=!drill;
  if(drill)$('drill-goal').textContent=drill.goal;
  display(drill?{throw:drill.start,wind:drill.wind}:neutral);
};
$('time').oninput=()=>{cancelAnimationFrame(animation);draw(Number($('time').value));};
$('replay').onclick=()=>{
  if(!active)return;
  cancelAnimationFrame(animation);
  const last=active.points.length-1;
  if(reduceMotion.matches){$('time').value=last;draw(last);return;}
  const start=performance.now();
  function frame(now){
    const elapsed=(now-start)/1000;
    let index=Number($('time').value);
    while(index<last&&active.points[index+1].t<=elapsed)index++;
    $('time').value=index;draw(index);
    if(index<last)animation=requestAnimationFrame(frame);
  }
  $('time').value=0;animation=requestAnimationFrame(frame);
};
$('history').onchange=()=>{$('load').disabled=$('compare').disabled=$('history').value==='';};
const selected=()=>records[Number($('history').value)];
$('load').onclick=()=>{const record=selected();if(record)display(record);};
$('compare').onclick=()=>{const record=selected();if(record)compare(record);};
$('export').onclick=()=>{
  const url=URL.createObjectURL(new Blob([JSON.stringify({format:'hook-ring-toss-lab-v1',tosses:records},null,2)],{type:'application/json'}));
  const link=document.createElement('a');link.href=url;link.download='hook-and-ring-toss-lab.json';link.click();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
};
$('import').onchange=async()=>{
  try{
    const file=$('import').files[0];
    if(!file)return;
    if(file.size>100_000)throw Error('Choose a JSON replay under 100 KB.');
    const incoming=importTosses(JSON.parse(await file.text()));
    for(const record of [...incoming].reverse())saveToss(storage,record);
    records=[...incoming,...records].slice(0,40);
    historyOptions();display(incoming[0]);
    $('file-status').textContent='Imported '+incoming.length+' toss'+(incoming.length===1?'':'es')+'. Results recalculated.';
  }catch(error){$('file-status').textContent=error instanceof SyntaxError?'That file is not valid JSON.':error.message;}
  finally{$('import').value='';}
};

const controlCopy={
  'tracker-ball':['Roll or swirl','Drag or swirl on the ball. Your release becomes aim, pull, and flick. The sliders give you the same controls.'],
  'digit-pinch':['Pinch or twist','Use two contacts to change the pinch distance and twist the ball. Release both contacts to toss. The sliders remain available.'],
  'wrist-flip':['Flick up','Use one to three contacts. Move upward, then lift. A 14 ms guard filters the lift-off sample.'],
  'air-motion':['Hold the device','Enable motion, arm one toss, and tilt your device in your hands. Touch and sliders are always available.'],
  'air-trace':['Hold the device','Start tracing, then tilt the device slowly to draw a circle, triangle, or figure eight. Finish to see the classification.'],
};
const wrist=new WristFlipEngine({onThrow(out){
  const count=out.fingerCount;
  $('gesture').textContent=count+' contact'+(count===1?'':'s')+' · '+out.guardedMs+' ms guard';
  run('wrist-flip',{pull:.37+out.power*.27,aim:out.aimX*2-1,flick:out.spin*.7},
    {contacts:count,guard:out.guardedMs,twist:out.spin*Math.PI/2});
}});
const motion=new HybridKineticEngine({
  onThrow(out){
    $('arm').textContent='Arm one toss';
    $('gesture').textContent='Motion toss captured.';
    run('air-motion',{pull:.42+out.power*.19,aim:out.aimX*2-1,flick:out.spin*.7},{contacts:0});
  },
  onPattern(shape,path){
    const name={circle:'Circle',triangle:'Triangle',figureEight:'Figure eight',swishFlick:'Swish and flick',unknown:'Freeform'}[shape];
    $('gesture').textContent=name+' · '+path.length+' orientation samples';
  },
});
function sensor(event){
  const a=event.acceleration,r=event.rotationRate;
  if(!a&&!r)return;
  const g=v=>Number.isFinite(v)?v/9.80665:0;
  const rad=v=>Number.isFinite(v)?v*Math.PI/180:0;
  motion.ingest({t:event.timeStamp,ay:g(a?.y),az:g(a?.z),rx:rad(r?.beta),ry:rad(r?.gamma),rz:rad(r?.alpha)});
}
$('motion').onclick=async()=>{
  if(!window.DeviceMotionEvent){$('gesture').textContent='Motion sensors are unavailable in this browser.';return;}
  try{
    if(typeof window.DeviceMotionEvent.requestPermission==='function' &&
      await window.DeviceMotionEvent.requestPermission()!=='granted')throw Error('permission');
    if(!currentMode().startsWith('air-'))return;
    connected=true;window.addEventListener('devicemotion',sensor);
    $('motion').hidden=true;$('arm').hidden=false;$('gesture').textContent='Motion enabled for this tab.';
  }catch{$('gesture').textContent='Motion permission is off. Touch controls remain available.';}
};
$('arm').onclick=()=>{
  if(currentMode()==='air-motion'){
    motion.arm(!motion.armed);
    $('arm').textContent=motion.armed?'Disarm':'Arm one toss';
    $('gesture').textContent=motion.armed?'Ready for one motion toss. Hold the device.':'';
  }else{
    motion.trace(!motion.tracing);
    $('arm').textContent=motion.tracing?'Finish tracing':'Start tracing';
  }
};
function selectController(){
  const mode=currentMode();
  controller?.destroy();controller=null;
  wrist.cancel();clearTimeout(wristTimer);
  window.removeEventListener('devicemotion',sensor);
  motion.setMode(mode==='air-motion'?'throw':mode==='air-trace'?'trace':'off');
  $('motion').hidden=!mode.startsWith('air-')||connected;
  $('arm').hidden=!mode.startsWith('air-')||!connected;
  if(mode.startsWith('air-')&&connected)window.addEventListener('devicemotion',sensor);
  $('arm').textContent=mode==='air-trace'?'Start tracing':'Arm one toss';
  $('limb-setting').hidden=mode!=='digit-pinch';
  if(mode==='digit-pinch')controller=attachDigitTrackBaller(pad,{
    limb:()=>$('limb').value,
    onGripMove(detail){
      pad.style.setProperty('--ball-turn',formatted(detail.twist*180/Math.PI)+'deg');
      $('gesture').textContent=detail.peakContacts+' contacts · '+formatted(detail.scale,2)+'× pinch';
    },
    onGripEnd(detail){
      if(detail.peakContacts<2)return;
      const twist=clamp(detail.twist,-Math.PI,Math.PI);
      $('gesture').textContent=detail.peakContacts+' contacts · '+formatted(detail.scale,2)+'× pinch · '+detail.guardMs+' ms guard';
      run('digit-pinch',{
        pull:clamp(.49+(detail.scale-1)*.16-detail.dy*.15,.25,.85),
        aim:clamp(detail.dx*3,-1,1),flick:clamp(twist/Math.PI,-1,1),
      },{contacts:detail.peakContacts,guard:detail.guardMs,velocity:detail.guardedVelocity,twist,
        pinchScale:detail.scale,pinchSpan:detail.spanMm});
    },
  });
  pad.dataset.mode=mode;$('pad-title').textContent=controlCopy[mode][0];$('controller-help').textContent=controlCopy[mode][1];
  $('gesture').textContent='';
  if(mode==='tracker-ball')controller=attachTrackBaller(pad,{
    onMove(detail){if(detail)pad.style.setProperty('--ball-turn',formatted(detail.turn*360+detail.dx*105)+'deg');},
    onEnd(detail){
      if(['tap','hold'].includes(detail.kind))return;
      $('gesture').textContent=detail.kind+' · '+formatted(Math.abs(detail.rpm))+' gesture RPM';
      run('tracker-ball',{pull:.38+detail.power*.22,aim:clamp(detail.dx*2,-1,1),
        flick:clamp((detail.kind==='swirl'?detail.rpm/230:-detail.vy*.18),-1,1)});
    },
  });
}
function wristEvent(event,kind){
  if(currentMode()!=='wrist-flip')return;
  const box=pad.getBoundingClientRect();
  const feed = sample => wrist[kind](event.pointerId,sample.clientX-box.left,sample.clientY-box.top,sample.timeStamp);
  if(kind==='down'){
    if(event.button!==0)return;
    wrist.size(box.width,box.height);pad.setPointerCapture(event.pointerId);
  }
  if(kind==='move')for(const sample of event.getCoalescedEvents?.()??[])feed(sample);
  feed(event);
  if(kind==='up'){
    clearTimeout(wristTimer);wristTimer=setTimeout(()=>wrist.tick(event.timeStamp+45),45);
  }
}
for(const [name,kind] of [['pointerdown','down'],['pointermove','move'],['pointerup','up']])
  pad.addEventListener(name,event=>wristEvent(event,kind));
pad.addEventListener('pointercancel',()=>wrist.cancel());
pad.addEventListener('lostpointercapture',event=>{if(wrist.contacts.has(event.pointerId))wrist.cancel();});
$('controller').onchange=selectController;
document.addEventListener('visibilitychange',()=>{
  if(document.hidden){motion.arm(false);if(motion.tracing)motion.trace(false);$('arm').textContent=currentMode()==='air-trace'?'Start tracing':'Arm one toss';}
});
if(!records.length){
  try{
    const last=JSON.parse(storage.getItem('nathan-hook-ring-v1'))?.last;
    if(last){
      const legacy=importTosses({cartridge:'TACTILECORE-C01-HOOK-RING',version:1,...last})[0];
      records=[saveToss(storage,legacy)];
    }
  }catch{}
}
historyOptions();selectController();draw(0);
if('serviceWorker' in navigator)navigator.serviceWorker.register('/sw.js').catch(()=>{});
