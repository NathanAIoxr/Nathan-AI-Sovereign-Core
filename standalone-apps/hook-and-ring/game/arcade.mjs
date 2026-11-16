import {EVENTS,SEASONS,OBSTACLE,targetAt,simulate} from './precision.mjs';

const $ = id => document.getElementById(id);
const canvas = $('court');
const ctx = canvas.getContext('2d');
const [width,height] = [canvas.width,canvas.height];
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const key = 'tabor-toss-and-target-v1';
const wildWind = [.065,-.050,.037,-.073];
const historyStart = EVENTS.findIndex(event => event.id === 'roman');
let cleared = new Set();
let season = 'classic';
let pk = false;
try {
  const saved = JSON.parse(localStorage.getItem(key));
  if(Array.isArray(saved?.cleared)) cleared = new Set(saved.cleared.filter(id=>EVENTS.some(event=>event.id===id)));
  if(Object.hasOwn(SEASONS,saved?.season)) season = saved.season;
  pk = saved?.pk === true;
} catch {}
const entry = new URLSearchParams(location.search).get('event');
let event = EVENTS.find(item=>item.id===entry) ?? EVENTS[0];
let flight = null, preview = null, turns = 0, frame = 0;
const buttons = new Map();
const nextGust = () => pk ? wildWind[turns % wildWind.length] : 0;
const allowed = item => {
  const index = EVENTS.indexOf(item);
  return index===0 || index===historyStart || cleared.has(item.id) || cleared.has(EVENTS[index-1].id);
};
const settings = ['angle','force','spin'];
const actions = {arc:'Toss',wrap:'Cast loop',water:'Send marker',bank:'Bank',skip:'Flick',disc:'Sling'};

function save(){
  try{localStorage.setItem(key,JSON.stringify({cleared:[...cleared],season,pk}));}catch{}
}
function update(){
  for(const [item,button] of buttons){
    const unlocked=allowed(item);
    button.disabled=!unlocked;
    button.setAttribute('aria-pressed',String(item===event));
    button.querySelector('small').textContent=cleared.has(item.id)?'Cleared':unlocked?item.slot:'Clear '+EVENTS[EVENTS.indexOf(item)-1].name+' to unlock';
  }
  $('progress').textContent=cleared.size+' / '+EVENTS.length+' cleared';
  $('event-name').textContent=event.name;
  $('guide').textContent=event.tip;
  $('season').value=season;
  $('pk').checked=pk;
  $('toss').textContent=actions[event.kind];
  for(const field of settings) $(field+'-value').textContent=$(field).value+(field==='angle'?'°':'%');
  const gust=(event.wind??0)+nextGust();
  const medium=event.kind==='water'?'Crosscurrent':'Crosswind';
  $('wind').textContent=(gust===0?(event.kind==='water'?'No crosscurrent':'Still air'):medium+' '+(gust<0?'← ':'→ ')+Math.abs(Math.round(gust*100)))+(pk?' · PK gust changes each toss':'');
}
function shot(){
  return simulate(event,{angle:Number($('angle').value),force:Number($('force').value),spin:Number($('spin').value),wild:nextGust()});
}
function circle(x,y,r){
  ctx.beginPath();ctx.arc(x*width,y*height,r,0,Math.PI*2);
}
function draw(){
  const skin=SEASONS[season];
  const palette=ctx.createLinearGradient(0,0,0,height);
  palette.addColorStop(0,skin.sky);palette.addColorStop(1,event.kind==='water'?'#175069':'#13252a');
  ctx.fillStyle=palette;ctx.fillRect(0,0,width,height);
  ctx.fillStyle=event.kind==='skip'||event.kind==='water'?'#286878':skin.floor;
  ctx.fillRect(0,height*.78,width,height*.22);
  ctx.strokeStyle='#d4f5da25';ctx.lineWidth=1;
  for(let i=1;i<10;i++){
    ctx.beginPath();ctx.moveTo(width*i/10,height*.18);ctx.lineTo(width*i/10,height*.78);ctx.stroke();
  }
  if(event.kind==='bank'){
    ctx.fillStyle='#7f7265';ctx.fillRect(OBSTACLE.left*width,OBSTACLE.top*height,(OBSTACLE.right-OBSTACLE.left)*width,(OBSTACLE.bottom-OBSTACLE.top)*height);
  }
  const active = flight ?? preview;
  const points = active?.points ?? [];
  const path = flight ? points.slice(0,flight.index+1) : points.slice(0,12);
  const target=targetAt(event,flight?.time??0);
  if(event.kind==='water'){
    circle(target.x-.05,target.y-.055,17);ctx.strokeStyle='#93c7ee82';ctx.lineWidth=2;ctx.setLineDash([4,5]);ctx.stroke();ctx.setLineDash([]);
  }
  if(event.id==='horseshoes'||event.kind==='wrap'){
    ctx.fillStyle='#f7e1b1';ctx.fillRect(target.x*width-2,target.y*height-25,4,26);
  }
  if(event.kind==='disc'){
    ctx.strokeStyle='#d5e3e1';ctx.lineWidth=2;
    for(let i=-2;i<=2;i++){ctx.beginPath();ctx.moveTo(target.x*width+i*7,target.y*height-18);ctx.lineTo(target.x*width+i*5,target.y*height+11);ctx.stroke();}
  }
  circle(target.x,target.y,24);ctx.strokeStyle=skin.accent;ctx.lineWidth=3;ctx.stroke();
  circle(target.x,target.y,12);ctx.lineWidth=1;ctx.stroke();
  if(path.length){
    ctx.beginPath();ctx.moveTo(path[0].x*width,path[0].y*height);
    for(const point of path.slice(1))ctx.lineTo(point.x*width,point.y*height);
    ctx.strokeStyle=flight?'#ffeeca':'#eaffba99';ctx.lineWidth=2;
    if(!flight)ctx.setLineDash([4,6]);
    ctx.stroke();ctx.setLineDash([]);
  }
  const prop=flight?path.at(-1):path[0];
  if(prop){
    circle(prop.x,prop.y,8);ctx.fillStyle=skin.accent;ctx.fill();
    if(skin.mark){ctx.font='bold 27px system-ui';ctx.fillText(skin.mark,prop.x*width+12,prop.y*height-4);}
  }
}
function refresh(){
  update();
  preview=shot();
  draw();
}
function choose(item){
  if(!allowed(item)) return;
  cancelAnimationFrame(frame);
  event=item;flight=null;
  $('toss').disabled=false;
  $('result').textContent='';
  refresh();
}
function animate(now){
  const elapsed=now-flight.started;
  flight.index=reducedMotion.matches ? flight.points.length-1 : Math.min(flight.points.length-1,Math.floor(elapsed/18));
  flight.time=flight.points[flight.index].time;
  draw();
  if(flight.index<flight.points.length-1){frame=requestAnimationFrame(animate);return;}
  const wasNew=!cleared.has(event.id);
  if(flight.success){cleared.add(event.id);save();}
  if(flight.success && event.id==='rescue') flight.message='Rescue anchor secured!';
  if(flight.success && event.id==='roman') flight.message='Training barge caught!';
  const next=EVENTS[EVENTS.indexOf(event)+1];
  const unlocked=flight.success&&wasNew&&next&&next.id!=='roman'&&!cleared.has(next.id);
  $('result').textContent=flight.message+(unlocked?' '+next.name+' unlocked.':'');
  turns++;
  update();
  $('toss').disabled=false;
}
for(const item of EVENTS){
  const button=document.createElement('button');
  button.type='button';
  button.append(item.name,document.createElement('small'));
  button.onclick=()=>choose(item);
  $('events').append(button);
  buttons.set(item,button);
}
$('toss').onclick=()=>{
  flight={...shot(),index:0,time:0,started:performance.now()};
  $('toss').disabled=true;
  $('result').textContent=event.prop+' in flight.';
  frame=requestAnimationFrame(animate);
};
for(const field of settings) $(field).oninput=()=>{
  if(!$('toss').disabled)flight=null;
  refresh();
};
$('season').onchange=()=>{season=$('season').value;save();refresh();};
$('pk').onchange=()=>{pk=$('pk').checked;save();if(!$('toss').disabled)flight=null;refresh();};
if(!allowed(event))event=EVENTS[0];
choose(event);
if('serviceWorker' in navigator)navigator.serviceWorker.register('/sw.js').catch(()=>{});
