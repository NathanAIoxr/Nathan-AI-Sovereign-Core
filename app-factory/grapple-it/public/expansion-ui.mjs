import {newBridge,pattern,bridgeInput,bridgeShot} from './precision-bridge.mjs';
import {createClock} from './fixed-clock.mjs';
import {beginStroke,sampleStroke,strokeAim,releaseStroke} from './tactile-input.mjs';

import {CHASSIS,ERAS,CARTRIDGES,FORMS,GRAPPLE_WORDS,PK_ORIGIN,arena,flight,checkpoints,tracePoint,scoreChallenge,arcadeGrade,openTier,sanitizeExpansion} from './arcade.mjs';
import {STAGES} from './grapple.mjs';
import {startSwing,stepSwing,swingAction,swingCourse} from './swing.mjs';

const $=id=>document.getElementById(id);
const KEY='grapple-it-expansion-v2';
const motion=matchMedia('(prefers-reduced-motion: reduce)');
let records;
try{records=sanitizeExpansion(JSON.parse(localStorage.getItem(KEY)));}catch{records=sanitizeExpansion(null);}
let view='', game=CARTRIDGES[0], tier=0, round=0, total=0, marks=[], time=0, wild=false;
let aim={x:.5,y:.5}, progress=0, trace=null, effect=null, level=0, swing=startSwing(0), swingActive=false;
const held=new Map();
let bridge=null;
function bridgeStatus(message){
 if(!bridge)return;
 status('bridge-damage',Math.min(150,bridge.hits)+' / 150');
 status('bridge-charge',String(bridge.ammo));
 status('bridge-buff',String(bridge.buff));
 status('bridge-shield',String(bridge.shield));
 status('bridge-order',pattern(bridge).map(n=>n+1).join(' → ')+' · '+bridge.step+' / 3 · Integrity '+bridge.integrity);
 status('bridge-status',message);
}
$('bridge-on').onchange=()=>resetArcade();
for(const button of $('bridge-keys').children){
 button.onclick=()=>{if(bridge)bridgeStatus(bridgeInput(bridge,Number(button.dataset.key)));};
}
const arcadeClock=createClock(),swingClock=createClock();
const vibration=$('tactile-vibrate');
try{vibration.checked=localStorage.getItem('grapple-it-haptic')==='yes';}catch{}
vibration.onchange=()=>{try{localStorage.setItem('grapple-it-haptic',vibration.checked?'yes':'no');}catch{}};
const notifyTouch=message=>status('tactile-readout',message);
const status=(id,message)=>{$(id).textContent=message;};
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(records));}catch{}};
const setOptions=(control,rows,selected)=>{
 control.replaceChildren(...rows.map(({id,title,disabled})=>{const option=new Option(title,id);option.disabled=Boolean(disabled);return option;}));
 control.value=selected;
};
const accent=()=>(FORMS.find(form=>form.id===records.form)??FORMS[0]).color;
$('grapple-words').textContent=GRAPPLE_WORDS;
$('arcade-origin').textContent=PK_ORIGIN;

function setupLibrary(){
 setOptions($('arcade-era'),ERAS.map(([title],id)=>({id,title:openTier(records.games,id)?title:title+' · Locked',disabled:!openTier(records.games,id)})),tier);
 setOptions($('arcade-game'),CARTRIDGES.filter(item=>item.tier===tier).map(item=>({id:item.id,title:item.title})),game.id);
 status('arcade-collection',Object.keys(records.games).length+' / '+CARTRIDGES.length+' challenges medaled');
 status('arcade-best',records.games[game.id]?arcadeGrade(records.games[game.id])+' · '+records.games[game.id]+' pts':'—');
 $('arcade-wild').disabled=!openTier(records.games,5);
}
function resetArcade(){
 round=0;total=0;marks=[];time=0;arcadeClock.reset();progress=0;trace=null;effect=null;aim={x:.5,y:.5};
 bridge=$('bridge-on').checked?newBridge():null;
 $('bridge-panel').hidden=!bridge;
 bridgeStatus('One shot ready. Solve a sequence for more.');
 $('arcade-action').disabled=game.chassis==='craft';
 status('arcade-title',game.title);
 status('arcade-chassis',CHASSIS[game.chassis].name);
 status('arcade-tip',CHASSIS[game.chassis].hint);
 status('arcade-target',game.target);
 status('arcade-status','Attempt 1 of 3.');
 status('arcade-score','0 / 300');
 status('arcade-shots','—');
 $('arcade-aim-controls').hidden=!['arc','spin','craft'].includes(game.chassis);
 $('aim-x').value=50;$('aim-y').value=50;
 $('trace-point').hidden=game.chassis!=='craft';
 $('arcade-action').textContent=game.chassis==='rhythm'?'Strike':game.chassis==='rope'?'Release ring':'Throw';
 setupLibrary();
}
function chooseGame(id){
 const selected=CARTRIDGES.find(item=>item.id===id);
 if(!selected||!openTier(records.games,selected.tier))return;
 game=selected;tier=game.tier;resetArcade();
}
function arcadeAction(){
 if(round>=3||bridge?.hits>=150)return;
 const points=scoreChallenge(game,time,round,aim,wild,progress);
 if(bridge){
  const attack=bridgeShot(bridge,points);
  if(attack===null){
   bridgeStatus(bridge.integrity?'Load a shot with the sequence game.':'Integrity lost. Restart the round.');
   progress=0;
   return;
  }
  const complete=bridge.hits>=150||bridge.round===3;
  bridgeStatus(bridge.hits>=150?'Bridge challenge cleared.':complete?'Three shots used. Restart to try again.':'Hit for '+attack+' damage.');
  effect={time,aim:{...aim},round,points:attack};
  round++;progress=0;marks.push(attack);
  status('arcade-score',Math.min(150,bridge.hits)+' / 150');
  status('arcade-shots',marks.join(' · '));
  status('arcade-status',complete?'Bridge round complete.':'Bridge attempt '+(round+1)+' of 3.');
  if(complete)$('arcade-action').disabled=true;
  return;
 }
 effect={time,aim:{...aim},round,points};
 marks.push(points);total+=points;round++;progress=0;
 status('arcade-score',total+' / 300');status('arcade-shots',marks.join(' · '));
 if(round<3){
  status('arcade-status',points+' pts. Attempt '+(round+1)+' of 3.');return;
 }
 const grade=arcadeGrade(total);
 const nextWasOpen=tier===ERAS.length-1||openTier(records.games,tier+1);
 if(grade){records.games[game.id]=Math.max(records.games[game.id]??0,total);save();}
 $('arcade-action').disabled=true;
 setupLibrary();
 status('arcade-status',grade?grade+' · '+total+' points.'+(!nextWasOpen&&openTier(records.games,tier+1)?' '+ERAS[tier+1][0]+' unlocked.':''):'Round complete. Score 150 points for Bronze.');
}
$('arcade-era').onchange=()=>chooseGame(CARTRIDGES.find(item=>item.tier===Number($('arcade-era').value)).id);
$('arcade-game').onchange=()=>chooseGame($('arcade-game').value);
$('arcade-wild').onchange=()=>{wild=$('arcade-wild').checked;resetArcade();};
$('arcade-reset').onclick=resetArcade;
$('arcade-action').onclick=arcadeAction;
for(const axis of ['x','y'])$('aim-'+axis).oninput=()=>{aim[axis]=Number($('aim-'+axis).value)/100;};
$('trace-point').onclick=()=>{
 if(game.chassis!=='craft'||round>=3)return;
 progress=tracePoint(checkpoints(game,round),progress,aim.x,aim.y);
 if(progress===5)arcadeAction();else status('arcade-status',progress+' of 5 checkpoints. Set the cursor on the next number.');
};
function resetSwing(){
 held.clear();swingClock.reset();swingActive=false;swing=startSwing(level);
 status('swing-status','Pump air to rise, then steer through the anchors.');
 status('swing-best',records.swings[level]?(records.swings[level]/1000).toFixed(1)+' s':'—');
 status('swing-goal','Lift → Catch → Swing → Goal');
 $('swing-action').disabled=false;$('swing-action').textContent='Pump Air';
}
function doSwing(){
 swingActive=true;
 const line=swingAction(swing);
 if(swing.phase==='flight'){$('swing-action').disabled=true;$('swing-action').textContent='In flight';status('swing-goal','Flight → Goal');}
 if(line) status('swing-status',line);
}
setOptions($('swing-course'),STAGES.map((stage,id)=>({id,title:stage.name})),level);
$('swing-course').onchange=()=>{level=Number($('swing-course').value);resetSwing();};
$('swing-action').onclick=doSwing;
$('swing-reset').onclick=resetSwing;
for(const [id,value] of [['swing-left',-1],['swing-right',1]]){
 const button=$(id);
 button.onpointerdown=event=>{if(event.button!==0)return;button.setPointerCapture(event.pointerId);held.set(event.pointerId,value);swingActive=true;};
 for(const event of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(event,e=>held.delete(e.pointerId));
 button.onclick=event=>{
  if(event.detail!==0)return;
  swingActive=true;
  if(swing.phase==='swing')swing.speed+=.55*value;
  if(swing.phase==='lift')swing.lift.vx+=.18*value;
 };
}
function refreshForm(){
 setOptions($('grapple-form'),FORMS.map(form=>({id:form.id,title:form.label})),records.form);
 $('curator-panel').dataset.form=records.form;
 window.dispatchEvent(new CustomEvent('grapple-form', {detail:records.form}));
}
$('grapple-form').onchange=()=>{records.form=$('grapple-form').value;refreshForm();save();};
window.addEventListener('grapple-expansion-restore',event=>{
 const incoming=sanitizeExpansion(event.detail);
 for(const [id,value] of Object.entries(incoming.games)) records.games[id]=Math.max(records.games[id]??0,value);
 for(const [id,value] of Object.entries(incoming.swings)) records.swings[id]=Math.min(records.swings[id]??Infinity,value);
 if(event.detail&&FORMS.some(form=>form.id===event.detail.form))records.form=incoming.form;
 refreshForm();save();setupLibrary();
 status('swing-best',records.swings[level]?(records.swings[level]/1000).toFixed(1)+' s':'—');
});
window.addEventListener('grapple-expansion-export',event=>{event.detail.expansion=sanitizeExpansion(records);});
window.addEventListener('grapple-view',event=>{
 view=event.detail??'';
 arcadeClock.pause();swingClock.pause();trace=null;held.clear();
 if(view==='arcade')setupLibrary();
});
function clearMotion(){held.clear();trace=null;arcadeClock.pause();swingClock.pause();}
window.addEventListener('blur',clearMotion);
document.addEventListener('visibilitychange',()=>{if(document.hidden)clearMotion();});
window.addEventListener('keydown',event=>{
 if(view!=='swing'||event.target.closest?.('input, textarea, select, a, summary')||event.ctrlKey||event.altKey||event.metaKey)return;
 if(event.code==='ArrowLeft'||event.code==='ArrowRight'){
  event.preventDefault();held.set(event.code,event.code==='ArrowLeft'?-1:1);swingActive=true;
 }
 if((event.code==='Space'||event.code==='ArrowUp')&&!event.repeat&&!event.target.closest?.('button')){
  event.preventDefault();doSwing();
 }
});
window.addEventListener('keyup',event=>held.delete(event.code));

function surface(id){
 const canvas=$(id),ctx=canvas.getContext('2d');
 const item={canvas,ctx,w:0,h:0};
 new ResizeObserver(()=>{
  const box=canvas.getBoundingClientRect(), ratio=Math.min(devicePixelRatio||1,2);
  if(!box.width||!box.height)return;
  item.w=box.width;item.h=box.height;
  canvas.width=Math.round(box.width*ratio);canvas.height=Math.round(box.height*ratio);
  ctx.setTransform(ratio,0,0,ratio,0,0);
 }).observe(canvas);
 return item;
}
const board=surface('arcade-canvas'), tank=surface('swing-canvas');
function plotAim(point){
 aim={x:Math.max(.04,Math.min(.96,point.x)),y:Math.max(.08,Math.min(.90,point.y))};
 $('aim-x').value=Math.round(aim.x*100);$('aim-y').value=Math.round(aim.y*100);
 if(game.chassis==='craft'){
  const points=checkpoints(game,round);
  const cursor=trace.last??aim;
  const count=Math.max(1,Math.ceil(Math.hypot(aim.x-cursor.x,aim.y-cursor.y)/.025));
  for(let i=1;i<=count;i++)progress=tracePoint(points,progress,cursor.x+(aim.x-cursor.x)*i/count,cursor.y+(aim.y-cursor.y)*i/count);
  trace.last=aim;
 }
}
function track(event){
 for(const input of event.getCoalescedEvents?.()??[]){
  const point=sampleStroke(trace.stroke,input);
  if(point)plotAim(strokeAim(trace.stroke,point));
 }
 const point=sampleStroke(trace.stroke,event);
 if(point)plotAim(strokeAim(trace.stroke,point));
}
board.canvas.onpointerdown=event=>{
 if(event.button!==0||round>=3||trace)return;
 const stroke=beginStroke(board.canvas.getBoundingClientRect());
 if(!stroke)return;
 trace={id:event.pointerId,stroke,initialProgress:progress};
 board.canvas.setPointerCapture(event.pointerId);
 track(event);
};
board.canvas.onpointermove=event=>{if(trace?.id===event.pointerId)track(event);};
board.canvas.onpointerup=event=>{
 if(trace?.id!==event.pointerId)return;
 const release=releaseStroke(trace.stroke,event);
 if(!release){
  progress=trace.initialProgress;trace=null;
  notifyTouch('Canceled. Release inside the center 90% to play.');
  return;
 }
 if(game.chassis!=='craft')plotAim(release.aim);
 trace=null;
 notifyTouch(release.kind+' · '+Math.round(release.travelMm)+' mm travel · '+Math.round(release.speedMm)+' mm/s · '+Math.round(release.rpm)+' rpm · '+Math.round(release.power*100)+'% power');
 if(vibration.checked&&typeof navigator.vibrate==='function')navigator.vibrate(25);
 arcadeAction();
};
for(const event of ['pointercancel','lostpointercapture'])board.canvas.addEventListener(event,e=>{
 if(trace?.id===e.pointerId){progress=trace.initialProgress;trace=null;}
});
function ring(s,x,y,r,ink,fill=false){
 const {ctx,w,h}=s;ctx.beginPath();ctx.arc(x*w,y*h,r,0,Math.PI*2);
 if(fill){ctx.fillStyle=ink;ctx.fill();}else{ctx.strokeStyle=ink;ctx.lineWidth=2;ctx.stroke();}
}
function path(s,points,ink){
 const {ctx,w,h}=s;ctx.beginPath();
 points.forEach(([x,y],i)=>i===0?ctx.moveTo(x*w,y*h):ctx.lineTo(x*w,y*h));
 ctx.lineWidth=2;ctx.strokeStyle=ink;ctx.stroke();
}
function label(s,text,x,y,ink='#eaf6e7'){
 const {ctx,w,h}=s;ctx.fillStyle=ink;ctx.font='700 13px system-ui';ctx.textAlign='center';ctx.fillText(text,x*w,y*h);
}
function background(s,color){
 const {ctx,w,h}=s, gradient=ctx.createLinearGradient(0,0,0,h);
 gradient.addColorStop(0,color);gradient.addColorStop(1,'#112128');ctx.fillStyle=gradient;ctx.fillRect(0,0,w,h);
}
function renderArcade(){
 if(!board.w)return;
 const i=Math.min(round,2), a=arena(game,time,i,wild);
 const green='#e4fa92';
 background(board,['#284948','#594440','#54394c','#403756','#22485a','#613a46','#345268'][tier]);
 if(game.chassis==='craft'){
  const points=checkpoints(game,i);
  path(board,points,'#9ac7b980');
  points.forEach(([x,y],index)=>{ring(board,x,y,17,index<progress?green:'#a7c4bd');label(board,String(index+1),x,y+.015);});
  ring(board,aim.x,aim.y,8,accent());
 }else if(game.chassis==='rhythm'){
  path(board,[[.10,.48],[.90,.48]],'#afcbc2');
  ring(board,.10+.80*.72,.48,23,green);
  ring(board,.10+.80*a.pulse,.48,12,accent(),true);
  label(board,'Time the strike',.5,.73);
 }else if(game.chassis==='rope'){
  path(board,[[.5,.10],[a.swing,.61]],'#adc9c4');
  ring(board,a.x,.61,20,green);
  ring(board,a.swing,.61,13,accent());
 }else{
  const {ctx}=board;
  ring(board,a.x,a.y,25,green);
  ring(board,a.x,a.y,12,green);
  ctx.setLineDash([3,6]);
  path(board,flight(aim.x,aim.y,a.drift,game.id==='boomerang'),accent());
  ctx.setLineDash([]);
  ring(board,aim.x,aim.y,9,accent());
  if(game.chassis==='spin'){
   const angle=a.rotation*Math.PI*2;
   ring(board,.83,.19,24,'#a4c3b9');
   path(board,[[.83,.19],[.83+Math.cos(angle)*20/board.w,.19+Math.sin(angle)*20/board.h]],accent());
   label(board,'Stick',.83,.31);
   ring(board,.83-24/board.w,.19,3,green,true);
  }
 }
 if(effect&&time-effect.time<.70&&!motion.matches)label(board,'+'+effect.points,.5,.13,green);
}
function renderSwing(){
 if(!tank.w)return;
 const s=swing,{anchors,pivot,goal}=swingCourse(level);
 background(tank,'#254d63');
 for(const [index,[x,y]] of anchors.entries()){
  ring(tank,x,y,15,index<=s.lift.next?'#abd9c8':'#5a7f8f');
  label(tank,String(index+1),x,y+.016);
 }
 ring(tank,goal[0],goal[1],23,'#e4fa92');
 label(tank,'Goal',goal[0],goal[1]-.08);
 if(s.phase==='swing')path(tank,s.rope?.nodes.map(node=>[node.x,node.y])??[pivot,[s.x,s.y]],accent());
 ring(tank,s.x,s.y,14,accent(),true);
 ring(tank,s.x,s.y,14,'#e9faff');
}
function frame(now){
 if(view==='arcade'){arcadeClock.frame(now,dt=>{time+=dt;});renderArcade();}
 if(view==='swing'){
  if(swingActive&&swing.phase!=='won'){
   const direction=Math.sign([...held.values()].reduce((sum,move)=>sum+move,0));
   const before=swing.phase;
   let message;
   swingClock.frame(now,dt=>{
    message=stepSwing(swing,dt,direction)||message;
    if(swing.phase==='won')return false;
   });
   if(message)status('swing-status',message);
   if(before!==swing.phase){
    $('swing-action').disabled=['flight','won'].includes(swing.phase);
    $('swing-action').textContent=swing.phase==='swing'?'Release':swing.phase==='flight'?'In flight':'Goal secured';
    status('swing-goal',swing.phase==='swing'?'Swing → Goal':swing.phase==='flight'?'Flight → Goal':'Course cleared');
    if(swing.phase==='won'){
     const ms=Math.max(1,Math.round(swing.time*1000));
     records.swings[level]=Math.min(records.swings[level]??Infinity,ms);
     save();status('swing-best',(records.swings[level]/1000).toFixed(1)+' s');
    }
   }
  }else swingClock.pause();
  renderSwing();
 }
 requestAnimationFrame(frame);
}
refreshForm();resetArcade();resetSwing();requestAnimationFrame(frame);
