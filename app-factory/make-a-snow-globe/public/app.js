import {layouts,scenes,finishes,tiers,normalize,makerSheet} from './model.js';
const $=id=>document.getElementById(id), element=(tag,text)=>Object.assign(document.createElement(tag),{textContent:text});
const design=$('design'), real=$('make-real'), canvas=$('preview'), ctx=canvas.getContext('2d');
const storageKey='make-a-snow-globe:v1', reduced=matchMedia('(prefers-reduced-motion: reduce)');
let d,selected=0,snow=[],motion=0,paused=reduced.matches,last=0,drag=null;
try{d=normalize(JSON.parse(localStorage.getItem(storageKey)));}catch{d=normalize();}
const palette={walnut:['#6b442c','#d3a260'],silver:['#5f716d','#d2dfda'],black:['#262526','#d6ae60']};
$('scene').replaceChildren(...Object.entries(scenes).map(([key,label])=>new Option(label,key)));
$('tier').replaceChildren(...Object.entries(tiers).map(([key,t])=>new Option(t.title,key)));
$('tiers').replaceChildren(...Object.values(tiers).map(t=>{
 const a=element('article','');a.append(element('h3',t.title),element('strong',t.price),element('p',t.details));return a;
}));
function persist(){try{localStorage.setItem(storageKey,JSON.stringify(d));}catch{}}
function refresh(){
 for(const key of ['name','format','finish','snow','engraving'])design.elements[key].value=d[key];
 for(const key of ['tier','quantity','destination'])real.elements[key].value=d[key];
 $('scene').value=d.scenes[selected];
 $('snow-readout').textContent=d.snow+'%';
 $('structure').textContent=layouts[d.format].note;
 $('chambers').replaceChildren(...layouts[d.format].points.map((p,i)=>{
  const button=element('button',p[3]);button.type='button';button.setAttribute('aria-pressed',i===selected?'true':'false');
  button.onclick=()=>{selected=i;refresh();$('scene').focus();};return button;
 }));
 $('spec').textContent=makerSheet(d);
 draw(0);
}
function reseed(){snow=layouts[d.format].points.map(()=>Array.from({length:100},()=>{
 const angle=Math.random()*Math.PI*2,r=.97*Math.sqrt(Math.random());return {x:r*Math.cos(angle),y:r*Math.sin(angle),phase:angle,speed:.06+Math.random()*.19,size:.8+Math.random()*1.9};
}));}
function shape(x,y,r,c){ctx.beginPath();ctx.arc(x,y,r,0,6.2832);ctx.fillStyle=c;ctx.fill();}
function rect(x,y,w,h,c){ctx.fillStyle=c;ctx.fillRect(x,y,w,h);}
function poly(points,c,stroke){
 ctx.beginPath();for(const [i,[x,y]] of points.entries())i?ctx.lineTo(x,y):ctx.moveTo(x,y);
 ctx.closePath();ctx.fillStyle=c;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.stroke();}
}
function scene(key){
 if(key==='empty')return;
 if(key==='aurora'){
  ctx.save();ctx.lineWidth=.045;
  for(let k=0;k<6;k++){
   ctx.save();ctx.rotate(k*Math.PI/3);poly([[-.04,.02],[.055,.02],[.06,-.66],[-.025,-.74],[-.095,-.62]],'#a4e3da88','#e4fff1');
   poly([[0,-.44],[-.20,-.64],[-.28,-.60],[-.037,-.31]],'#9eefe388');ctx.restore();
  }
  const glow=ctx.createRadialGradient(0,0,.03,0,0,.54);glow.addColorStop(0,'#76ffb3aa');glow.addColorStop(1,'#77efdf00');shape(0,0,.54,glow);
  for(let i=0;i<15;i++){
   const y=.49-i*.069,x=Math.sin(i*.43)*.28;
   poly([[x-.16,y],[x+.08,y-.04],[x+.205,y],[x-.015,y+.045]],'#dafff1a8','#eafff246');
  }
  ctx.restore();return;
 }
 if(key==='cosmos'){
  for(let i=0;i<60;i++){const a=i*2.39,r=.75*(i+6)/66;shape(Math.cos(a)*r,Math.sin(a)*r*.68,.009+(i%4)*.004,i%3?'#b2eae1':'#ffd696');}
  for(let i=1;i<=4;i++){ctx.beginPath();ctx.ellipse(0,0,i*.17,i*.08,-.5,0,6.2832);ctx.strokeStyle='#bddcfa88';ctx.lineWidth=.009;ctx.stroke();}
  const glow=ctx.createRadialGradient(.04,-.05,.01,.04,-.05,.19);glow.addColorStop(0,'#fff1bc');glow.addColorStop(1,'#a484e000');shape(.04,-.05,.19,glow);return;
 }
 shape(0,.99,.66,'#c7dbca');
 for(const [x,y,w] of [[-.52,.46,.13],[.52,.44,.15],[-.32,.56,.11],[.34,.57,.13]]){
  for(let i=0;i<3;i++)poly([[x-w+i*.025,y-i*.10],[x+w-i*.025,y-i*.10],[x,y-i*.10-.28]],'#245f4d','#d4ede488');
 }
 if(key==='village'){
  rect(-.19,.21,.38,.40,'#a7845e');poly([[-.26,.22],[0,-.04],[.26,.22]],'#e9e5d8');rect(-.06,.37,.12,.12,'#ffc774');
 }
}
function draw(dt){
 if(!ctx)return;
 const [dark,light]=palette[d.finish];ctx.clearRect(0,0,720,640);
 const points=layouts[d.format].points;
 const broad=d.format==='pyramid'?245:d.format==='stack'?133:190;
 const base=d.format==='single'?500:520;
 const gradient=ctx.createLinearGradient(0,base,0,base+74);gradient.addColorStop(0,light);gradient.addColorStop(.19,dark);gradient.addColorStop(1,'#1c221b');
 poly([[360-broad+22,base],[360+broad-22,base],[360+broad,base+85],[360-broad,base+85]],gradient);
 for(const [i,[x,y,r]] of points.entries()){
  ctx.save();ctx.translate(x,y);ctx.scale(r,r);ctx.beginPath();ctx.arc(0,0,1,0,6.2832);
  const glow=ctx.createRadialGradient(-.35,-.48,.02,0,0,1.1);glow.addColorStop(0,'#74a598');glow.addColorStop(.47,'#356354');glow.addColorStop(1,'#172f2b');ctx.fillStyle=glow;ctx.fill();ctx.clip();
  scene(d.scenes[i]);
  for(const p of snow[i].slice(0,d.snow)){
   p.y+=dt*(p.speed+motion*.045*Math.cos(p.phase));p.x+=dt*motion*.11*Math.sin(p.phase+p.y);
   if(Math.hypot(p.x,p.y)>1){p.y=-Math.sqrt(Math.max(.02,1-p.x*p.x))+.045;p.x*=.97;}
   shape(p.x,p.y,p.size/r,'#f3f5e6cc');
  }
  ctx.restore();
  ctx.lineWidth=i===selected?3.5:2;ctx.strokeStyle=i===selected?light:'#9dd0c3';ctx.beginPath();ctx.arc(x,y,r,0,6.2832);ctx.stroke();
  ctx.lineWidth=3;ctx.strokeStyle='#f9fff4a8';ctx.beginPath();ctx.arc(x,y,r*.89,3.7,4.55);ctx.stroke();
 }
 if(d.engraving){ctx.fillStyle='#fff0c5';ctx.font='20px Georgia';ctx.textAlign='center';ctx.fillText(d.engraving,360,base+59,broad*1.66);}
 motion=Math.max(0,motion-dt*1.2);
}
function animate(t){if(!paused&&!document.hidden)draw(Math.min((t-(last||t))/1000,.05));last=t;requestAnimationFrame(animate);}
function update(fields){
 const old=d.format;d=normalize({...d,...fields});if(d.format!==old){selected=0;reseed();}
 persist();refresh();
}
design.addEventListener('input',event=>{
 const {name,value}=event.target;if(name==='scene'){const copy=[...d.scenes];copy[selected]=value;update({scenes:copy});}
 else if(name==='name'||name==='engraving'){
  d=normalize({...d,[name]:value});persist();$('spec').textContent=makerSheet(d);draw(0);
 }else if(name==='snow'){
  d=normalize({...d,snow:Number(value)});persist();$('snow-readout').textContent=d.snow+'%';$('spec').textContent=makerSheet(d);draw(0);
 }else if(name==='format'||name==='finish')update({[name]:value});
});
real.addEventListener('input',event=>{
 const {name,value}=event.target;if(!['quantity','destination','tier'].includes(name))return;
 d=normalize({...d,[name]:name==='quantity'?Number(value):value});persist();$('spec').textContent=makerSheet(d);
});
for(const form of [design,real])form.addEventListener('submit',e=>e.preventDefault());
function shake(){motion=7;for(const group of snow)for(const p of group){p.x*=.72;p.y*=.72;p.phase+=1.3;}draw(0);}
function togglePause(){paused=!paused;$('pause').setAttribute('aria-pressed',String(paused));$('pause').textContent=paused?'Resume motion':'Pause motion';}
function download(blob,name){
 const url=URL.createObjectURL(blob), a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1500);
}
function filename(){return (d.name||'my-snow-globe').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'my-snow-globe';}
$('shake').onclick=shake;$('pause').onclick=togglePause;if(paused){$('pause').textContent='Resume motion';$('pause').setAttribute('aria-pressed','true');}
$('save').onclick=()=>download(new Blob([JSON.stringify(d,null,2)],{type:'application/json'}),filename()+'.json');
$('image').onclick=()=>canvas.toBlob(blob=>{if(blob)download(blob,filename()+'.png');});
$('brief').onclick=()=>download(new Blob([makerSheet(d)],{type:'text/plain'}),filename()+'-maker-sheet.txt');
$('print').onclick=()=>window.print();
$('open').onchange=async()=>{
 const [file]=$('open').files;if(!file)return;
 try{if(file.size>65536)throw Error();const data=JSON.parse(await file.text());if(data?.version!==1||!Object.hasOwn(layouts,data.format))throw Error();d=normalize(data);selected=0;reseed();refresh();persist();$('message').textContent='Design opened.';}
 catch{$('message').textContent='Choose a design JSON exported from this studio.';}
 $('open').value='';
};
canvas.onpointerdown=e=>{drag={x:e.clientX,y:e.clientY};};
canvas.onpointermove=e=>{if(drag&&Math.hypot(e.clientX-drag.x,e.clientY-drag.y)>14){shake();drag=null;}};
for(const ev of ['pointerup','pointercancel','pointerleave'])canvas.addEventListener(ev,()=>{drag=null;});
reseed();refresh();requestAnimationFrame(animate);
