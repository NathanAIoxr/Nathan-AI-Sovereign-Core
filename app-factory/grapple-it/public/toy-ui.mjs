import {createFrameLoop} from './frame-loop.mjs';
import {createClock} from './fixed-clock.mjs';

import { TOY_COURSES,startToy,toyTarget,blowJet,stepToy,grappleToy } from './toy.mjs';

const $=id=>document.getElementById(id);
const canvas=$('toy-canvas'), ctx=canvas.getContext('2d'), view=$('toy-view');
const choice=$('toy-course');
const storage='grapple-it-water-ring-v1';
let saved={};
try{const stored=JSON.parse(localStorage.getItem(storage));if(stored&&typeof stored==='object'&&!Array.isArray(stored))saved=stored;}catch{}
const inputs=new Map();
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const clock=createClock();
let index=0, state=startToy(TOY_COURSES[0]), width=0,height=0, color='#fff1ac';
const say=message=>{$('toy-status').textContent=message;};
function update(){
 $('toy-score').textContent=state.next+' / '+state.course.targets.length+' caught';
 $('toy-prop').textContent=state.course.prop;
 $('toy-jets').textContent=String(state.jets);
 $('toy-best').textContent=saved[state.course.id]??'—';
 $('toy-hook').disabled=state.done;
 $('toy-next').hidden=!state.done;
 $('toy-next').textContent=index===TOY_COURSES.length-1?'First course':'Next course';
}
function reset(i){
 clock.reset();index=i;choice.value=String(i);state=startToy(TOY_COURSES[i]);inputs.clear();
 say('Use both air jets to lift the '+state.course.prop.toLowerCase()+'. Grapple when it reaches the target.');
 update();draw();
}
function draw(){
 if(!width||!height)return;
 const gradient=ctx.createLinearGradient(0,0,0,height);
 gradient.addColorStop(0,state.course.color);gradient.addColorStop(1,'#0b2233');
 ctx.fillStyle=gradient;ctx.fillRect(0,0,width,height);
 for(let i=0;i<22&&!reduced.matches;i++){
  const x=((i*181)%149)/149*width,y=((i*.131-state.t*(.015+i%4*.008))%1+1)%1*height;
  ctx.beginPath();ctx.arc(x,y,1+i%4,0,Math.PI*2);ctx.strokeStyle='#bdeedf35';ctx.stroke();
 }
 for(let i=0;i<state.course.targets.length;i++){
  const target=toyTarget(state.course,i,state.t);
  const x=target.x*width,y=target.y*height, active=i===state.next;
  ctx.strokeStyle=active?'#ffe9a8':i<state.next?'#8ee6bd':'#a9bbc48a';
  ctx.lineWidth=active?3:1;
  if(target.swing){ctx.beginPath();ctx.moveTo(state.course.targets[i].x*width,0);ctx.lineTo(x,y);ctx.stroke();}
  if(state.course.id==='salvage'){ctx.strokeRect(x-17,y-9,34,18);ctx.strokeRect(x-4,y-3,8,7);}
  else if(state.course.id==='sub'){ctx.beginPath();ctx.ellipse(x,y,22,12,0,0,Math.PI*2);ctx.stroke();ctx.strokeRect(x-4,y-17,8,5);}
  else{ctx.beginPath();ctx.arc(x,y,14,0,Math.PI*2);ctx.stroke();}
  ctx.fillStyle=active?'#ffe9a8':'#c8d7d5';ctx.font='600 12px system-ui';ctx.textAlign='center';ctx.fillText(target.name,x,y-22);
 }
 for(const [side,x] of [['left',.13],['right',.87]]){
  ctx.fillStyle='#6e9fab';ctx.fillRect(x*width-16,height-12,32,12);
  const age=state.t-state.lastJet[side];
  if(age<.38){ctx.beginPath();ctx.moveTo(x*width,height);ctx.lineTo((x+(side==='left'?.15:-.15))*width,height*.73);ctx.strokeStyle='#a6eeed';ctx.lineWidth=2;ctx.stroke();}
 }
 const x=state.x*width,y=state.y*height;
 ctx.fillStyle=color;ctx.font='bold 30px system-ui';ctx.textAlign='center';
 ctx.fillText(state.course.symbol,x,y+10);
 if(state.wait>0&&state.next>0){
  const target=toyTarget(state.course,state.next-1,state.t);
  ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(target.x*width,target.y*height);ctx.strokeStyle=color;ctx.lineWidth=2;ctx.stroke();
 }
}
new ResizeObserver(()=>{
 const box=canvas.getBoundingClientRect();
 if(!box.width||!box.height)return;
 width=box.width;height=box.height;const scale=Math.min(2,devicePixelRatio||1);
 canvas.width=Math.round(width*scale);canvas.height=Math.round(height*scale);
 ctx.setTransform(scale,0,0,scale,0,0);draw();
}).observe(canvas);
function jet(side){if(blowJet(state,side))update();}
function play(now){
 const sides=new Set(inputs.values());
 clock.frame(now,dt=>{
  for(const side of sides)if(state.t-state.lastJet[side]>=.24)jet(side);
  if(state.done)return false;
  stepToy(state,dt);
 });
 draw();
}
function grapple(){
 const result=grappleToy(state);
 if(!result)return;
 say(result.message);update();
 if(state.done){
  saved[state.course.id]=Math.min(saved[state.course.id]??Infinity,state.jets);
  try{localStorage.setItem(storage,JSON.stringify(saved));}catch{}
  window.dispatchEvent(new CustomEvent('grapple-toy-record',{detail:{...saved}}));
  update();$('toy-next').focus();
 }
}
for(const [id,side] of [['jet-left','left'],['jet-right','right']]){
 const button=$(id);
 button.onpointerdown=event=>{
  if(event.button!==0)return;
  button.setPointerCapture(event.pointerId);inputs.set(event.pointerId,side);jet(side);
 };
 for(const type of ['pointerup','pointercancel','lostpointercapture']){
  button.addEventListener(type,event=>inputs.delete(event.pointerId));
 }
 button.onclick=event=>{if(event.detail===0)jet(side);};
}
window.addEventListener('keydown',event=>{
 if(view.hidden||event.altKey||event.ctrlKey||event.metaKey||event.target.closest?.('select,input,textarea,a,summary'))return;
 const side={ArrowLeft:'left',ArrowRight:'right'}[event.code];
 if(side){event.preventDefault();if(!event.repeat){inputs.set(event.code,side);jet(side);}}
 else if(event.code==='Space'&&!event.repeat&&!event.target.closest?.('button')){event.preventDefault();grapple();}
});
window.addEventListener('keyup',event=>inputs.delete(event.code));
function pause(){inputs.clear();clock.pause();}
window.addEventListener('blur',pause);
const frames=createFrameLoop(play);
function syncFrames(){
 if(!view.hidden&&!document.hidden)frames.start();
 else{frames.stop();pause();}
}
document.addEventListener('visibilitychange',syncFrames);
window.addEventListener('grapple-view',syncFrames);
window.addEventListener('grapple-toy-restore',event=>{saved=event.detail;update();});
window.addEventListener('grapple-toy-finish',event=>{color=event.detail;draw();});
$('toy-hook').onclick=grapple;
$('toy-reset').onclick=()=>reset(index);
$('toy-next').onclick=()=>{reset((index+1)%TOY_COURSES.length);$('jet-left').focus();};
for(const [i,course] of TOY_COURSES.entries())choice.add(new Option(course.name,String(i)));
choice.onchange=()=>reset(Number(choice.value));
reset(0);
syncFrames();
