/* Five-matrix 3D printer control room. Canvas is visual simulation only. */
(function(){
'use strict';
const E=window.NathanPrintMatrix;
if(!E){document.getElementById('ledger').textContent='Simulation engine failed to load.';return;}
const $=id=>document.getElementById(id);
const canvas=$('world'),ctx=canvas.getContext('2d',{willReadFrequently:true});
const W=canvas.width,H=canvas.height;
const SPOTS=[{x:206,y:214},{x:519,y:155},{x:826,y:214},{x:321,y:470},{x:718,y:470}];
const HEX=E.PALETTE.map(h=>[parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16)]);
let state=E.newState('habitat'),mode='all',clock=0,frame=0,last=0,uiLast=0,finished=false;
state.running=true;
function log(message){
 const li=document.createElement('li');li.textContent=message;
 $('ledger').prepend(li);
 while($('ledger').children.length>18)$('ledger').lastElementChild.remove();
}
log('Five printer simulations started. Physical printer interfaces disconnected.');
function rgba(rgb,factor,alpha){
 const vals=rgb.map(v=>Math.max(0,Math.min(255,Math.round(v*factor))));
 return 'rgba('+vals.join(',')+','+alpha+')';
}
function polygon(points,fill,stroke){
 ctx.beginPath();ctx.moveTo(points[0].x,points[0].y);
 for(let i=1;i<points.length;i++)ctx.lineTo(points[i].x,points[i].y);
 ctx.closePath();ctx.fillStyle=fill;ctx.fill();
 if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=.45;ctx.stroke();}
}
function iso(x,y,z,p){
 return {x:p.x+(x-y)*8.5,y:p.y+(x+y-8)*4.5-z*5.65};
}
function cube(p,x,y,z,rgb){
 const a=iso(x,y,z+1,p),b=iso(x+1,y,z+1,p),c=iso(x+1,y+1,z+1,p),d=iso(x,y+1,z+1,p);
 const downB=iso(x+1,y,z,p),downC=iso(x+1,y+1,z,p),downD=iso(x,y+1,z,p);
 const faceA=rgba(rgb,.55,.94),faceB=rgba(rgb,.74,.94),top=rgba(rgb,1,.97);
 if(!E.voxel(state.shape,x+1,y,z))polygon([b,c,downC,downB],faceA);
 if(!E.voxel(state.shape,x,y+1,z))polygon([c,d,downD,downC],faceB);
 if(!E.voxel(state.shape,x,y,z+1) || z+1>=E.MAX_LAYERS)polygon([a,b,c,d],top,rgba(rgb,1,.22));
}
function line(a,b,color,width=1,dash=[]){
 ctx.beginPath();ctx.setLineDash(dash);ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);
 ctx.strokeStyle=color;ctx.lineWidth=width;ctx.stroke();ctx.setLineDash([]);
}
function background(){
 const grad=ctx.createLinearGradient(0,0,0,H);grad.addColorStop(0,'#071625');grad.addColorStop(1,'#051019');ctx.fillStyle=grad;ctx.fillRect(0,0,W,H);
 if(mode==='behind'||mode==='all'){
   ctx.strokeStyle='#234052';ctx.lineWidth=.65;
   for(let y=-100;y<H+100;y+=32){line({x:0,y},{x:W,y},'rgba(101,170,201,.11)',.6);}
   for(let x=0;x<W;x+=32){line({x,y:0},{x,y:H},'rgba(101,170,201,.08)',.6);}
   ctx.fillStyle='#507f93';ctx.font='11px ui-monospace,monospace';
   for(let i=0;i<5;i++)ctx.fillText('XY WORLD GRID',20,28+i*128);
 }
 const glow=ctx.createRadialGradient(W/2,H/2,20,W/2,H/2,400);
 glow.addColorStop(0,'rgba(52,130,135,.12)');glow.addColorStop(1,'transparent');ctx.fillStyle=glow;ctx.fillRect(0,0,W,H);
}
function machine(p,node,i){
 const selected=state.selected===i;
 ctx.beginPath();ctx.ellipse(p.x,p.y+38,95,39,0,0,Math.PI*2);
 ctx.fillStyle=selected?'rgba(70,158,171,.18)':'rgba(41,91,116,.11)';ctx.fill();ctx.lineWidth=selected?2:1;ctx.strokeStyle=selected?node.color:'#2e5365';ctx.stroke();
 for(const offset of [-67,67]){line({x:p.x+offset,y:p.y+48},{x:p.x+offset,y:p.y-104},'rgba(102,167,184,.28)',1.6);}
 line({x:p.x-70,y:p.y-105},{x:p.x+70,y:p.y-105},'rgba(130,193,208,.33)',1.6);
 ctx.setLineDash([4,4]);ctx.strokeStyle='rgba(114,180,205,.18)';ctx.strokeRect(p.x-81,p.y-112,162,165);ctx.setLineDash([]);
 const percent=E.progress(node);
 ctx.fillStyle=node.color;ctx.font='bold 12px ui-monospace,monospace';ctx.textAlign='center';
 ctx.fillText('MATRIX 0'+(i+1)+' · '+percent+'%',p.x,p.y+90);
 ctx.font='10px ui-monospace,monospace';ctx.fillStyle='#a1bed0';ctx.fillText(node.connected?'SYNCHRONIZED':'LAYER '+Math.floor(node.layers)+' / '+E.MAX_LAYERS,p.x,p.y+107);
 ctx.textAlign='start';
}
function topography(p,node,i){
 const cutoff=Math.min(E.MAX_LAYERS-1,Math.floor(node.layers)-1);
 if(cutoff<0)return;
 const rgb=HEX[i];
 // Only emit visible surfaces: top or two view-facing sides. The object is an abstract voxel study.
 for(let z=0;z<=cutoff;z++){
   for(let sum=0;sum<=16;sum++){
     for(let x=0;x<9;x++){
       const y=sum-x;
       if(y<0||y>8||!E.voxel(state.shape,x,y,z))continue;
       if(!E.voxel(state.shape,x,y,z+1)||!E.voxel(state.shape,x+1,y,z)||!E.voxel(state.shape,x,y+1,z))cube(p,x,y,z,rgb);
     }
   }
 }
}
function upper(p,node,i){
 if(mode!=='all'&&mode!=='above')return;
 const z=Math.min(E.MAX_LAYERS,node.layers);
 const y=p.y-5.65*z-13;
 line({x:p.x-69,y},{x:p.x+69,y},'rgba(255,255,255,.32)',1.2,[4,6]);
 const amp=10+Math.sin(clock*2+i)*3;
 ctx.fillStyle='rgba(141,239,226,.12)';
 polygon([{x:p.x-11,y:y-11},{x:p.x+11,y:y-11},{x:p.x+11+amp*.25,y:y-140},{x:p.x-11-amp*.25,y:y-140}],ctx.fillStyle);
 ctx.font='10px ui-monospace,monospace';ctx.fillStyle=node.color;ctx.textAlign='center';ctx.fillText('Z '+z.toFixed(1),p.x,y-7);ctx.textAlign='left';
}
function linkField(){
 const mid={x:W/2,y:H/2+12};
 const unified=state.unified;
 for(let i=0;i<SPOTS.length;i++){
   const p=SPOTS[i],rgb=HEX[i];
   line({x:p.x,y:p.y+55},mid,rgba(rgb,unified?.95:.7,unified?.75:.23),unified?2.5:1,unified?[]:[4,9]);
 }
 ctx.beginPath();ctx.arc(mid.x,mid.y,40,0,Math.PI*2);ctx.fillStyle=unified?'#154c46':'#0a2332';ctx.fill();
 ctx.strokeStyle=unified?'#84f9d7':'#466c79';ctx.lineWidth=unified?2.5:1;ctx.stroke();
 ctx.fillStyle=unified?'#b0ffea':'#9ec4d4';ctx.font='bold 17px system-ui';ctx.textAlign='center';ctx.fillText(unified?'ONE':'5 → 1',mid.x,mid.y+5);
 ctx.font='9px ui-monospace,monospace';ctx.fillStyle='#9db1c1';ctx.fillText(unified?'CONNECTED':'IN PROGRESS',mid.x,mid.y+21);ctx.textAlign='start';
}
function gopherAnts(){
 const center={x:W/2,y:H/2+12};
 for(let i=0;i<Math.max(1,Math.min(9,state.gophers+1));i++){
   const pos=SPOTS[i%5],travel=(clock*.19+i*.15)%1;
   const x=pos.x+(center.x-pos.x)*travel;
   const y=pos.y+55+(center.y-pos.y-55)*travel;
   ctx.beginPath();ctx.arc(x,y,3.5,0,Math.PI*2);ctx.fillStyle='#ffd48b';ctx.fill();
   ctx.beginPath();ctx.arc(x,y,8,0,Math.PI*2);ctx.strokeStyle='rgba(255,212,139,.2)';ctx.stroke();
 }
}
function render(){
 background();linkField();
 for(let i=0;i<5;i++){const p=SPOTS[i],node=state.nodes[i];machine(p,node,i);topography(p,node,i);upper(p,node,i);}
 gopherAnts();
 ctx.fillStyle='#8cadbe';ctx.font='11px ui-monospace,monospace';
 ctx.fillText('MODE: '+mode.toUpperCase()+' | DIGITAL RECONSTRUCTION | PHYSICAL I/O: OFF',18,H-15);
 if(state.unified){ctx.fillStyle='#b5ffe9';ctx.font='bold 17px system-ui';ctx.textAlign='center';ctx.fillText('FIVE COMPLETED · ONE COORDINATED MATRIX',W/2,34);ctx.textAlign='start';}
}
function nodeCards(){
 const box=$('nodes');
 if(!box.children.length){
  state.nodes.forEach((n,i)=>{
    const b=document.createElement('button');b.className='node';b.type='button';b.dataset.node=String(i);
    const a=document.createElement('span');a.textContent='MATRIX 0'+(i+1)+' · SIMULATED';
    const big=document.createElement('strong');const detail=document.createElement('small');
    const track=document.createElement('div');track.className='track';
    const fill=document.createElement('span');fill.className='fill';track.append(fill);
    b.append(a,big,detail,track);
    b.addEventListener('click',()=>{state.selected=i;updateUI();render();});
    box.append(b);
  });
 }
 state.nodes.forEach((n,i)=>{
  const b=box.children[i];
  b.setAttribute('aria-pressed',String(state.selected===i));
  b.querySelector('strong').textContent=E.progress(n)+'%';
  b.querySelector('small').textContent='LAYER '+Math.floor(n.layers)+' / '+E.MAX_LAYERS+' · '+(n.connected?'LINKED':'INDEPENDENT');
  const fill=b.querySelector('.fill');fill.style.width=E.progress(n)+'%';fill.style.background=n.color;
 });
}
function referenceCards(){
 const box=$('source-list');
 if(!box.children.length){
  E.REFS.forEach((source,i)=>{
   const wrap=document.createElement('article');wrap.className='source';
   const tag=document.createElement('small');tag.textContent=source.category;
   const heading=document.createElement('h3');heading.textContent=source.name;
   const desc=document.createElement('p');desc.textContent=source.relationship;
   const link=document.createElement('a');link.href=source.url;link.target='_blank';link.rel='noopener noreferrer';link.textContent='Inspect source ↗';
   const license=document.createElement('footer');wrap.append(tag,heading,desc,link,license);box.append(wrap);
  });
 }
 E.REFS.forEach((source,i)=>{
   box.children[i].querySelector('footer').textContent='Reported license: '+source.license+' · '+(i<state.gophers?'INDEXED':'CURATED / PENDING');
 });
}
function updateUI(){
 const total=Math.round(state.nodes.reduce((sum,n)=>sum+E.progress(n),0)/5);
 $('top-progress').textContent=total+'%';
 $('network-state').textContent=state.unified?'ONE':'5 → 1';
 $('source-count').textContent=state.gophers+' / '+E.REFS.length+' indexed';
 $('frame-label').textContent='FRAME '+frame+' · RGBA';
 $('view-label').textContent=mode==='all'?'SURFACE / BEHIND / ABOVE':mode.toUpperCase();
 $('run').textContent=state.unified?'All five completed':state.running?'Pause simulation':'Resume simulation';
 $('run').disabled=state.unified;
 $('inspect-node').textContent='MATRIX '+(state.selected+1);
 $('inspect-layer').textContent=Math.floor(state.nodes[state.selected].layers)+' / '+E.MAX_LAYERS;
 $('inspect-percent').textContent=E.progress(state.nodes[state.selected])+'%';
 nodeCards();referenceCards();
}
function inspect(evt){
 const rect=canvas.getBoundingClientRect();
 const x=Math.floor((evt.clientX-rect.left)*W/rect.width),y=Math.floor((evt.clientY-rect.top)*H/rect.height);
 if(x<0||x>=W||y<0||y>=H)return;
 let best=Infinity,index=0;
 SPOTS.forEach((p,i)=>{const d=(p.x-x)**2+(p.y-y)**2;if(d<best){best=d;index=i;}});
 state.selected=index;
 const data=ctx.getImageData(x,y,1,1).data;
 $('inspect-xy').textContent=x+', '+y;
 $('inspect-rgba').textContent='('+Array.from(data).join(', ')+')';
 state.inspection={x,y,rgba:Array.from(data),nearestMatrix:index+1};
 updateUI();
}
canvas.addEventListener('pointerdown',inspect);
$('object-type').addEventListener('change',e=>{E.reset(state,e.target.value);state.running=true;finished=false;log('New virtual model: '+e.target.value+'. All five printers reset.');updateUI();render();});
$('view-mode').addEventListener('change',e=>{mode=e.target.value;updateUI();render();});
$('speed').addEventListener('input',e=>{state.speed=Number(e.target.value);$('speed-value').textContent=state.speed.toFixed(1)+'×';});
$('run').addEventListener('click',()=>{if(state.unified)return;state.running=!state.running;log(state.running?'Five simulated printers resumed.':'Five simulated printers paused.');updateUI();});
$('reset').addEventListener('click',()=>{E.reset(state);state.running=true;finished=false;log('All five virtual print jobs reset and restarted.');updateUI();render();});
$('export').addEventListener('click',()=>{
 const payload={...E.summary(state),renderView:mode,inspectedPixel:state.inspection,openSourceRegistry:E.REFS.map(({name,url,license})=>({name,url,license}))};
 const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});
 const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='nathan-tabor-five-matrix-simulation.json';a.click();URL.revokeObjectURL(url);
 log('Exported simulated state only; no real printer data.');
});
function loop(time){
 const dt=last?Math.min(.05,Math.max(0,(time-last)/1000)):0;last=time;
 if(state.running){
   E.advance(state,dt);clock+=dt*state.speed;
   if(state.unified&&!finished){finished=true;log('5 / 5 virtual print jobs completed; five matrices synchronized as ONE.');}
 }
 if(time-uiLast>100){uiLast=time;frame++;render();updateUI();}
 requestAnimationFrame(loop);
}
updateUI();render();requestAnimationFrame(loop);
})();