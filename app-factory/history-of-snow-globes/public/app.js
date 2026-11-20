import {advance,evaluate,clamp} from './physics.js';
import {restoreProgress,saveProgress} from './progress.js';
const $=id=>document.getElementById(id);
const canvas=$('vessel'), ctx=canvas.getContext('2d');
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const sizes=['1.075rem','1.24rem','1.45rem','0.98rem'];
let chapters,index=0,experiment=0,reverse=false,paused=reduced.matches,values={},shaken=false,archive=new Map();
let completed=new Set(),storage;
try{storage=window.localStorage;}catch{}
let textSize=0,sound,tilt=false,lastShake=0,drag,previous=0,particles=[];
const create=(tag,content)=>Object.assign(document.createElement(tag),content===undefined?{}:{textContent:content});
const sourceList=sources=>{
  const list=create('ul');
  for(const {label,url} of sources){const li=create('li'),a=create('a',label);a.href=url;li.append(a);list.append(li);}
  return list;
};
function renderTimeline(){
  const list=reverse?[...chapters].reverse():chapters;
  const links=list.map(ch=>{
    const a=create('a',ch.chapter);a.href='#'+ch.id;a.title=ch.title;
    if(ch===chapters[index])a.setAttribute('aria-current','step');
    return a;
  });
  $('timeline').replaceChildren(...links);
  $('previous').disabled=reverse?index===chapters.length-1:index===0;
  $('next').disabled=reverse?index===0:index===chapters.length-1;
}
function readChapter(next){
  index=next;
  const ch=chapters[index];
  $('era').textContent=ch.era;$('title').textContent=ch.title;
  $('narrative').replaceChildren(...ch.narrative.map(text=>create('p',text)));
  $('sources').replaceChildren(...sourceList(ch.sources).childNodes);
  $('references').open=false;
  setExperiment(index);
  renderTimeline();
}
function newParticles(){
  particles=Array.from({length:128},(_,i)=>{
    const angle=Math.random()*Math.PI*2,r=.86*Math.sqrt(Math.random());
    return {x:r*Math.cos(angle),y:r*Math.sin(angle),phase:angle,vx:0,vy:0,direction:i%2?1:-1};
  });
}
function setExperiment(i,reset=false){
  experiment=i; $('experiment').value=String(i);
  const game=chapters[i].game;
  const saved=reset?null:archive.get(i);
  values=saved?{...saved.values}:Object.fromEntries(game.controls.map(c=>[c.key,c.value]));
  shaken=saved?.shaken||false;
  $('objective').textContent=game.objective;
  const sliders=game.controls.map(c=>{
    const row=create('div'), label=create('label',c.label), output=create('output'), input=create('input');
    row.className='control';input.type='range';input.id='control-'+c.key;label.htmlFor=input.id;
    Object.assign(input,{min:c.min,max:c.max,step:c.step,value:values[c.key]});
    output.htmlFor=input.id;output.textContent=values[c.key]+c.unit;
    input.addEventListener('input',()=>{values[c.key]=input.valueAsNumber;output.textContent=input.value+c.unit;showResult();});
    row.append(label,output,input);return row;
  });
  $('sliders').replaceChildren(...sliders);
  $('materials').hidden=game.mode!=='snow';$('fluid').value='';$('flakes').value='';
  const canShake=game.mode==='snow'||game.mode==='lava';
  $('shake').disabled=!canShake;
  $('motion').disabled=!canShake||!('DeviceMotionEvent' in window);
  $('shape').disabled=!canShake;
  newParticles();showResult();
}
function showResult(){
  const result=evaluate(chapters[experiment].game.mode,values,shaken);
  const message=result.ok?'Experiment complete.':'Experiment in progress.';
  if($('result').textContent!==message)$('result').textContent=message;
  $('reading').textContent=result.text;
  if(result.ok)completed.add(experiment);
  archive.set(experiment,{values:{...values},shaken});
  const saved=saveProgress(storage,chapters,archive,completed);
  const status=completed.size+' of '+chapters.length+' labs completed'+(saved?' · Saved on this browser':' · This session');
  if($('lab-progress').textContent!==status)$('lab-progress').textContent=status;
  draw(0);
}
function impulse(dx,dy){
  if($('shake').disabled)return;
  for(const p of particles){p.vx=clamp(p.vx+dx-p.y*.76,-3,3);p.vy=clamp(p.vy+dy+p.x*.76,-3,3);}
  shaken=true;
  if(paused){for(const p of particles){p.x*=.82;p.y=clamp(p.y-.14,-.86,.86);}}
  showResult();
}
function line(x,y,tx,ty,color,width=2){
  ctx.beginPath();ctx.strokeStyle=color;ctx.lineWidth=width;ctx.moveTo(x,y);ctx.lineTo(tx,ty);ctx.stroke();
}
function rect(x,y,w,h,color){ctx.fillStyle=color;ctx.fillRect(x,y,w,h);}
function ball(x,y,r,color){ctx.beginPath();ctx.fillStyle=color;ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();}
function optics(mode,m){
  const lensX=302,center=222, isCandle=mode==='candle', isSolar=mode==='solar';
  const beam=isCandle?'#fcba75':'#f5dd9c';
  rect(lensX-8,100,16,235,'#87ccc8');
  ball(91,center,19,beam);
  const spotX=320+m.focus*2.5, spotY=center+m.offset*4, targetX=320+values.distance*2.5;
  line(targetX,158,targetX,280,'#b9c7b1',3);
  ball(targetX,center,13,'#eedbb67a');
  for(let y=134;y<=316;y+=30){
    line(isSolar?55:91,isSolar?y:center,lensX,y,beam);
    line(lensX,y,spotX,spotY,beam);
  }
  ball(spotX,spotY,m.ok?12:5,'#fff2c7');
}
function draw(dt){
  if(!ctx||!chapters)return;
  const mode=chapters[experiment].game.mode,m=evaluate(mode,values,shaken);
  ctx.clearRect(0,0,640,480);
  if(mode==='solar'||mode==='candle'){optics(mode,m);return;}
  if(mode==='kiln'){
    const glow=ctx.createRadialGradient(320,265,14,320,265,135);glow.addColorStop(0,'#ffbd53');glow.addColorStop(1,'#672e21');
    rect(170,91,300,280,'#68736a');rect(212,123,216,216,glow);
    rect(238,278,164,28,m.ok?'#c4f4e9':'#c89561');
    for(let i=0;i<11;i++)ball(236+i*16,259-Math.sin(i)*values.heat*.25,3+values.heat/32,'#ffe2a8');
    return;
  }
  if(mode==='pressure'){
    for(const [i,x] of [[0,125],[1,410]]){
      const height=values.fill*2.3+(i===0?m.difference:-m.difference)*1.35;
      rect(x,104,105,251,'#2f635e');rect(x,355-clamp(height,15,235),105,clamp(height,15,235),'#77b8c3');
      line(x,104,x+105,104,'#e9dfb3',4);
    }
    line(230,321,410,321,'#77b8c3',14);
    ball(320+(values.index-1.33)*180,176,12,'#f5dd9c');return;
  }
  if(mode==='weather'){
    rect(139,90,93,280,'#234943');rect(289,110,64,260,'#234943');rect(419,93,98,277,'#234943');
    const level=clamp(112+(values.pressure-1013),40,184);
    rect(302,349-level,38,level,'#77b8c3');line(283,237,359,237,'#e5d799',2);
    ball(468,232-m.float*105,19,'#ead4a0');
    for(let i=0;i<Math.floor(m.crystals*55);i++){
      const x=146+(i*31)%77,y=350-(i*17)%Math.max(20,Math.floor(202*m.crystals));
      line(x-4,y-3,x+6,y+4,'#e0ede9',2);line(x,y-7,x,y+5,'#a6d5d6',2);
    }
    return;
  }
  const shape=$('shape').value;
  const rx=shape==='wide'?232:shape==='tall'?117:166,ry=shape==='tall'?191:shape==='wide'?126:166;
  const x=320,y=222;
  const glass=ctx.createRadialGradient(x-45,y-95,8,x,y,rx+32);glass.addColorStop(0,'#4a7e73');glass.addColorStop(1,'#102e29');
  ctx.save();ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,2*Math.PI);ctx.fillStyle=glass;ctx.fill();ctx.clip();
  if(mode==='snow'){
    const slope=ctx.createLinearGradient(0,y+ry*.51,0,y+ry);slope.addColorStop(0,'#a9c1b7');slope.addColorStop(1,'#d9e5d9');
    ctx.beginPath();ctx.ellipse(x,y+ry*.97,rx,ry*.27,0,0,2*Math.PI);ctx.fillStyle=slope;ctx.fill();
    for(const [tx,h] of [[-61,52],[58,62],[93,34],[-94,31]]){
      ctx.beginPath();ctx.moveTo(x+tx-h*.34,y+ry*.79);ctx.lineTo(x+tx+h*.34,y+ry*.79);ctx.lineTo(x+tx,y+ry*.79-h);ctx.closePath();ctx.fillStyle='#27584a';ctx.fill();
    }
    rect(x-23,y+ry*.79-34,46,35,'#ad825a');
    ctx.beginPath();ctx.moveTo(x-34,y+ry*.79-33);ctx.lineTo(x,y+ry*.79-64);ctx.lineTo(x+33,y+ry*.79-33);ctx.fillStyle='#f0e4c8';ctx.fill();
    rect(x-8,y+ry*.79-24,14,13,'#f8d684');
  }
  const count=mode==='lava'?12:128;
  for(const p of particles.slice(0,count)){
    advance(p,dt,mode,values,m);
    if(mode==='lava'){
      const glow=ctx.createRadialGradient(x+p.x*rx-5,y+p.y*ry-5,2,x+p.x*rx,y+p.y*ry,22);
      glow.addColorStop(0,'#ffe293');glow.addColorStop(.6,'#ec995a');glow.addColorStop(1,'#bc6039');
      ball(x+p.x*rx,y+p.y*ry,18+Math.sin(p.phase)*5,glow);
    }else ball(x+p.x*rx,y+p.y*ry,.7+values.size*.8,'#f4f6e8');
  }
  ctx.restore();ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,2*Math.PI);ctx.strokeStyle='#b8dcd1';ctx.lineWidth=3;ctx.stroke();
  rect(x-rx*.67,y+ry-6,rx*1.34,28,'#9a754c');rect(x-rx*.74,y+ry+16,rx*1.48,18,'#6c4b31');
}
function loop(t){
  if(!paused&&!document.hidden)draw(Math.min((t-(previous||t))/1000,.045));
  previous=t;requestAnimationFrame(loop);
}
function motionStatus(message){$('motion').textContent=message;}
function pageFromHash(){
  return chapters.findIndex(c=>'#'+c.id===location.hash);
}
async function start(){
  const response=await fetch('./chapters.json');
  if(!response.ok)throw Error('Chapter data unavailable.');
  chapters=await response.json();
  const progress=restoreProgress(storage,chapters);archive=progress.labs;completed=progress.completed;
  const worksheets=chapters.map(ch=>{
    const section=create('section'), w=ch.worksheet;
    section.className='worksheet';
    section.append(create('p',ch.chapter+' · '+ch.era),create('h2',ch.title),
      create('p','Objective · '+ch.game.objective),create('h3','Predict'),create('p',w.prediction),
      create('div'),create('h3','Measure'),create('p',w.record),create('div'),
      create('h3','Explain'),create('p',w.reflection),create('div'),create('div'));
    return section;
  });
  $('worksheets').append(...worksheets);
  $('experiment').replaceChildren(...chapters.map((c,i)=>Object.assign(create('option',c.title),{value:String(i)})));
  $('manuscript').append(...chapters.map(ch=>{
    const section=create('section');section.append(create('p',ch.chapter+' · '+ch.era),create('h2',ch.title),
      ...ch.narrative.map(t=>create('p',t)),create('p','Experiment · '+ch.game.objective),sourceList(ch.sources));return section;
  }));
  const initial=pageFromHash();
  readChapter(initial<0?0:initial);
  if(initial<0) setExperiment(chapters.findIndex(c=>c.id==='vienna'));
  addEventListener('hashchange',()=>{const i=pageFromHash();if(i>=0){readChapter(i);if($('layout').dataset.mode!=='lab')$('title').focus({preventScroll:true});}});
  $('previous').onclick=()=>{location.hash=chapters[index+(reverse?1:-1)].id;};
  $('next').onclick=()=>{location.hash=chapters[index+(reverse?-1:1)].id;};
  $('reverse').onclick=()=>{reverse=!reverse;$('reverse').setAttribute('aria-pressed',String(reverse));renderTimeline();};
  $('experiment').onchange=()=>setExperiment(Number($('experiment').value));
  $('shape').onchange=()=>draw(0);
  const setValue=(key,value)=>{
    const slider=$('control-'+key);
    if(slider){slider.value=String(value);slider.dispatchEvent(new Event('input'));}
  };
  $('fluid').onchange=()=>{if($('fluid').value)setValue('viscosity',$('fluid').value);};
  $('flakes').onchange=()=>{if($('flakes').value){const [density,size]=$('flakes').value.split(',');setValue('density',density);setValue('size',size);}};
  $('reset').onclick=()=>setExperiment(experiment,true);
  $('shake').onclick=()=>impulse(.9,-1.6);
  $('pause').setAttribute('aria-pressed',String(paused));
  $('pause').textContent=paused?'Resume motion':'Pause motion';
  $('pause').onclick=()=>{paused=!paused;$('pause').setAttribute('aria-pressed',String(paused));$('pause').textContent=paused?'Resume motion':'Pause motion';};
  for(const mode of ['book','lab','split'])$(mode).onclick=()=>{
    $('layout').dataset.mode=mode;
    for(const button of ['book','lab','split'])$(button).setAttribute('aria-pressed',String(button===mode));
  };
  $('text-size').onclick=()=>{textSize=(textSize+1)%sizes.length;document.documentElement.style.setProperty('--reading',sizes[textSize]);$('load-status').textContent='Text size '+(textSize+1)+' of '+sizes.length+'.';};
  const printMode=new URLSearchParams(location.search).get('print');
  if(printMode==='worksheets')document.body.dataset.print='worksheets';
  $('print').onclick=()=>window.print();
  $('worksheets-print').onclick=()=>window.print();
  $('audio').onclick=async()=>{
    try{
      if(sound?.state==='running'){await sound.suspend();$('audio').setAttribute('aria-pressed','false');return;}
      if(!sound){
        const Audio=window.AudioContext||window.webkitAudioContext;
        if(!Audio)throw Error('Audio unsupported');
        sound=new Audio();const gain=sound.createGain();gain.gain.value=.016;gain.connect(sound.destination);
        for(const hz of [146.83,220,293.66]){const o=sound.createOscillator();o.frequency.value=hz;o.connect(gain);o.start();}
      }
      await sound.resume();$('audio').setAttribute('aria-pressed','true');
    }catch{$('load-status').textContent='Ambient audio is unavailable in this browser.';}
  };
  canvas.onpointerdown=e=>{if(!e.isPrimary||$('shake').disabled)return;drag={x:e.clientX,y:e.clientY,id:e.pointerId};canvas.setPointerCapture(e.pointerId);};
  canvas.onpointermove=e=>{
    if(drag?.id!==e.pointerId)return;
    const dx=e.clientX-drag.x,dy=e.clientY-drag.y;drag={x:e.clientX,y:e.clientY,id:e.pointerId};
    if(Math.hypot(dx,dy)>3)impulse(clamp(dx*.045,-.9,.9),clamp(dy*.045,-.9,.9));
  };
  canvas.onlostpointercapture=()=>{drag=null;};
  $('motion').onclick=async()=>{
    if(tilt){tilt=false;motionStatus('Tilt controls');return;}
    try{
      if(typeof DeviceMotionEvent.requestPermission==='function'&&await DeviceMotionEvent.requestPermission()!=='granted')throw Error('Denied');
      tilt=true;motionStatus('Turn off tilt');
    }catch{motionStatus('Tilt unavailable');}
  };
  if('DeviceMotionEvent' in window)addEventListener('devicemotion',e=>{
    const a=e.acceleration;
    if(!tilt||!a||Math.hypot(a.x||0,a.y||0,a.z||0)<3||performance.now()-lastShake<180)return;
    lastShake=performance.now();impulse(clamp((a.x||0)*.09,-1,1),clamp((a.y||0)*.09,-1,1));
  });
  requestAnimationFrame(loop);
  if('serviceWorker' in navigator&&location.protocol==='https:')navigator.serviceWorker.register('./sw.js').catch(()=>{});
}
start().catch(error=>{$('load-status').textContent=error.message;});
