import {STAGES,newLift,pump,stepLift} from './grapple.mjs';
const $=id=>document.getElementById(id);
const canvas=$('grapple-scene');
const ctx=canvas.getContext('2d');
const motion=matchMedia('(prefers-reduced-motion: reduce)');
const palette={harbor:['#133d55','#152744','#79e5d9'],canal:['#245958','#102d3d','#87e7be'],orchard:['#435470','#25264b','#c2d9f8'],salvage:['#244757','#171d38','#a4eede'],tide:['#1c5e62','#162f48','#a8f5bf'],reef:['#303058','#15152e','#cfb8ff']};
const key='grapple-it-bubble-best';
let records=(()=>{try{const saved=JSON.parse(localStorage.getItem(key));return saved&&typeof saved==='object'&&!Array.isArray(saved)?saved:{};}catch{return {};}})();
const courseMenu=$('stage');
function renderCollection(){
  const cleared=STAGES.filter((_,i)=>Number.isSafeInteger(records[i])&&records[i]>0).length;
  $('curator-flag').hidden=cleared!==STAGES.length;
  $('bubble-count').textContent=cleared+' / '+STAGES.length+' cleared';
  const list=$('bubble-records');
  list.replaceChildren(...STAGES.map((stage,i)=>{
    const row=document.createElement('li');
    row.textContent=stage.name+' · '+(records[i]?records[i]+' pumps':'Open to play');
    return row;
  }));
}
for(const [i,stage] of STAGES.entries()) courseMenu.add(new Option(stage.name,String(i)));
const directions=new Map();
let heldPump=null;
let keyboardPump=null;
let state=newLift(), started=false, last=0, width=0, height=0, dirty=true;
const particles=Array.from({length:25},(_,i)=>[(((i+7)*1777)%101)/101,(((i+11)*337)%103)/103,1+(i%4)]);

function ring(x,y,r,color,thickness){
  ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.strokeStyle=color;ctx.lineWidth=thickness;ctx.stroke();
}
function draw(){
  const theme=palette[STAGES[state.level].scene];
  const water=ctx.createLinearGradient(0,0,0,height);
  water.addColorStop(0,theme[0]);water.addColorStop(1,theme[1]);
  ctx.fillStyle=water;ctx.fillRect(0,0,width,height);
  if(!motion.matches){
    for(const [x,y,size] of particles){
      const cy=((y-state.time*.045*size)%1+1)%1;
      ring(x*width,cy*height,size,theme[2]+'45',.8);
    }
  }
  ctx.strokeStyle=theme[2]+'42';ctx.lineWidth=1;
  for(let row=0;row<4;row++){
    const y=height*(.05+row*.015);
    ctx.beginPath();ctx.moveTo(0,y);
    ctx.bezierCurveTo(width*.25,y+10,width*.76,y-11,width,y);ctx.stroke();
  }
  const radius=Math.min(width,height)*.049;
  for(const [i,[x,y]] of STAGES[state.level].anchors.entries()){
    const px=x*width,py=y*height;
    const active=i===state.next, caught=i<state.next;
    if(active){ctx.shadowColor='#d8fa8b';ctx.shadowBlur=17;}
    ring(px,py,radius,active?'#f0f6a5':caught?'#92e7c0':'#718e97',active?4:2);
    ctx.shadowBlur=0;
    ctx.font='700 12px system-ui';ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.fillStyle=active?'#f7fbc0':'#b3c5c4';ctx.fillText(state.level===3?['▣','◈','⚓'][i]:String(i+1),px,py);
    const name=STAGES[state.level].targets?.[i];
    if(name) ctx.fillText(name,px,py+radius+12);
    if(caught&&i===state.next-1){
      ctx.beginPath();ctx.moveTo(px,py);ctx.lineTo(state.x*width,state.y*height);
      ctx.strokeStyle='#b1eac5';ctx.lineWidth=2;ctx.stroke();
    }
  }
  const x=width*state.x,y=height*state.y,r=Math.min(width,height)*.039;
  if(started&&state.time-state.lastPump<.37&&!motion.matches){
    const elapsed=state.time-state.lastPump;
    for(let i=1;i<4;i++) ring(x+(i-2)*6,y+r+elapsed*(85+i*13),i+1,theme[2]+'a0',1);
  }
  const shine=ctx.createRadialGradient(x-r*.36,y-r*.5,1,x,y,r);
  shine.addColorStop(0,'#eaffffbc');shine.addColorStop(.5,'#a1e8f57c');shine.addColorStop(1,'#57b9d02c');
  ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fillStyle=shine;ctx.fill();
  ring(x,y,r,'#d8f7ee',1.8);
}
new ResizeObserver(()=>{
  const box=canvas.getBoundingClientRect(),dpi=Math.min(devicePixelRatio||1,2);
  width=box.width;height=box.height;canvas.width=Math.round(width*dpi);canvas.height=Math.round(height*dpi);
  ctx.setTransform(dpi,0,0,dpi,0,0);dirty=true;
}).observe(canvas);

function reset(level){
  state=newLift(level);started=false;heldPump=null;keyboardPump=null;directions.clear();
  $('stage').value=String(level);
  $('tank').dataset.scene=STAGES[level].scene;
  $('goal').textContent='0 / '+STAGES[level].anchors.length+' caught';
  $('pumps').textContent='0';
  $('best').textContent=records[level]??'—';
  $('overlay').hidden=true;
  $('pump').disabled=false;
  $('game-status').textContent='Tap or hold Pump Air. Steer with the arrow buttons or keys.';
  dirty=true;
}
function air(){
  if(pump(state)){
    started=true;dirty=true;
    $('pumps').textContent=String(state.pumps);
  }
}
function loop(now){
  const dt=Math.min(.032,(now-last)/1000);
  if(started&&!state.done&&width&&!$('bubble-view').hidden){
    const before=state.next;
    const direction=Math.sign([...directions.values()].reduce((sum,value)=>sum+value,0));
    if((heldPump!==null||keyboardPump!==null)&&state.time-state.lastPump>=.25) air();
    stepLift(state,dt,direction);
    if(state.next!==before){
      $('goal').textContent=state.next+' / '+STAGES[state.level].anchors.length+' caught';
      const name=STAGES[state.level].targets?.[state.next-1]??'ring '+state.next;
      $('game-status').textContent='Grappled '+name+'.';
    }
    if(state.done){
      if(!records[state.level]||state.pumps<records[state.level]){
        records[state.level]=state.pumps;
        try{localStorage.setItem(key,JSON.stringify(records));}catch{}
      }
      renderCollection();
      window.dispatchEvent(new Event('grapple-progress'));
      $('best').textContent=records[state.level];
      $('game-status').textContent='Course cleared.';
      $('next').textContent=state.level===STAGES.length-1?'Play Harbor Lift':'Next course';
      $('overlay').hidden=false;
      if(document.activeElement===$('pump')) $('next').focus();
      $('pump').disabled=true;
    }
    dirty=true;
  }
  if(dirty&&width&&height){draw();dirty=false;}
  last=now;requestAnimationFrame(loop);
}
const pumpButton=$('pump');
pumpButton.onpointerdown=event=>{
  if(event.button!==0||heldPump!==null||state.done)return;
  heldPump=event.pointerId;
  pumpButton.setPointerCapture(event.pointerId);
  air();
};
for(const event of ['pointerup','pointercancel','lostpointercapture']){
  pumpButton.addEventListener(event,e=>{if(e.pointerId===heldPump) heldPump=null;});
}
pumpButton.onclick=event=>{if(event.detail===0) air();};
$('stage').onchange=()=>reset(Number($('stage').value));
$('restart').onclick=()=>reset(state.level);
$('next').onclick=()=>{reset((state.level+1)%STAGES.length);$('pump').focus();};
for(const [id,value] of [['left',-1],['right',1]]){
  const button=$(id);
  button.onpointerdown=event=>{
    if(event.button!==0||state.done)return;
    started=true;
    event.preventDefault();button.setPointerCapture(event.pointerId);
    directions.set(event.pointerId,value);
  };
  for(const event of ['pointerup','pointercancel','lostpointercapture']){
    button.addEventListener(event,e=>directions.delete(e.pointerId));
  }
  button.onclick=event=>{
    if(event.detail!==0||state.done||state.settle>0)return;
    started=true;
    state.vx+=value*.26;
  };
}
window.addEventListener('keydown',event=>{
  if($('bubble-view').hidden||event.altKey||event.ctrlKey||event.metaKey||event.target.closest('select,input,textarea,a,summary'))return;
  if(event.code==='ArrowLeft'||event.code==='ArrowRight'){
    event.preventDefault();
    directions.set(event.code,event.code==='ArrowLeft'?-1:1);
  }else if(event.code==='ArrowUp'||(event.code==='Space'&&(!event.target.closest('button')||event.target===pumpButton))){
    event.preventDefault();
    if(!event.repeat){keyboardPump=event.code;air();}
  }
});
window.addEventListener('keyup',event=>{directions.delete(event.code);if(event.code===keyboardPump) keyboardPump=null;});
const clearInput=()=>{directions.clear();heldPump=null;keyboardPump=null;};
window.addEventListener('blur',clearInput);
window.addEventListener('grapple-view',clearInput);
window.addEventListener('grapple-restore',event=>{
 records=event.detail;
 reset(state.level);
 renderCollection();
});
reset(0);
renderCollection();
requestAnimationFrame(loop);

