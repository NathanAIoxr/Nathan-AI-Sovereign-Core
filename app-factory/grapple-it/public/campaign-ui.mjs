
import {ERAS,MISSIONS,PK_LINE,dailyCourse,freshLine,ringX,linedUp,castLine,advanceLine,medal,tensionBand,actionMarker,doAction} from './campaign.mjs';
import {TOY_COURSES} from './toy.mjs';
import {STAGES} from './grapple.mjs';

const $=id=>document.getElementById(id);
const KEY='grapple-it-campaign-v1', BUBBLES='grapple-it-bubble-best';
const TOYS='grapple-it-water-ring-v1', CURATOR='grapple-it-curator-v1';
const finishes=[
 {id:'brass',title:'Brass Ring',color:'#fff1ac',open:()=>true},
 {id:'salvage',title:'Salvage Copper',color:'#ffa787',open:()=>Boolean(toys.salvage)},
 {id:'reef',title:'Reef Violet',color:'#edaaff',open:()=>Boolean(toys.seahooks)},
 {id:'rescue',title:'Rescue Gold',color:'#ffe068',open:()=>Boolean(profile.eras.hiker)},
];
const grades=['Bronze','Silver','Gold'];
const canvas=$('line-canvas');
const ctx=canvas.getContext('2d');
let mode='toy', era=0, day='', pk=false, state, previous=0, width=0,height=0, frame=0;
function read(key){
 try{return JSON.parse(localStorage.getItem(key))??{};}catch{return {};}
}
function write(key,value){
 try{localStorage.setItem(key,JSON.stringify(value));return true;}catch{return false;}
}
function validRecord(record){
 return grades.includes(record?.medal)&&Number.isInteger(record?.ms)&&record.ms>0&&record.ms<=86400000;
}
function sanitize(data){
 const eras={},days={};
 for(const course of MISSIONS){
  if(validRecord(data?.eras?.[course.id]))eras[course.id]=data.eras[course.id];
 }
 for(const [date,item] of Object.entries(data?.days??{}).sort().slice(-60)){
  if(/^\d{4}-\d{2}-\d{2}$/.test(date)&&validRecord(item))days[date]=item;
 }
 return {eras,days};
}
function sanitizeBubbles(data){
 const result={};
 for(let i=0;i<STAGES.length;i++){
  if(Number.isInteger(data?.[i])&&data[i]>0&&data[i]<=100000)result[i]=data[i];
 }
 return result;
}
let profile=sanitize(read(KEY));
let bubbles=sanitizeBubbles(read(BUBBLES));
function sanitizeToys(input){
 const output={};
 for(const course of TOY_COURSES){
  const score=input?.[course.id];
  if(Number.isInteger(score)&&score>0&&score<=100000)output[course.id]=score;
 }
 return output;
}
let toys=sanitizeToys(read(TOYS));
const preferences=read(CURATOR);
let pilot=preferences?.pilot===true, finishId=preferences?.finishId??'brass', quote=0;
const dialogue=[
 'Grape 🍇 Apple 🍎: Try one puff from each side. The ring rises between the jets.',
 'Nathan AI 🚀: Can you clear the treasure chest with one less puff?',
 'Grape 🍇 Apple 🍎: A bright ring tells you when to cast. The tension gauge tells you when to ease.',
 'Nathan AI 🚀: Try the moving mini-sub again once you’ve found its rhythm.',
];
function renderCurator(){
 const item=finishes.find(item=>item.id===finishId&&item.open())??finishes[0];
 finishId=item.id;
 $('curator-play').setAttribute('aria-pressed',String(pilot));
 $('curator-play').textContent=pilot?'Return to player view':'Play as Grape 🍇 Apple 🍎';
 $('curator-pilot').hidden=!pilot;
 $('curator-shop').replaceChildren(...finishes.map(finish=>{
  const button=document.createElement('button');button.type='button';
  button.textContent=finish.title+(finish.open()?'':' · Locked');
  button.disabled=!finish.open();
  button.setAttribute('aria-pressed',String(finish.id===finishId));
  button.onclick=()=>{finishId=finish.id;write(CURATOR,{pilot,finishId});renderCurator();};
  return button;
 }));
 window.dispatchEvent(new CustomEvent('grapple-toy-finish',{detail:item.color}));
}
$('curator-tip').onclick=()=>{
 $('curator-dialogue').textContent=dialogue[quote++%dialogue.length];
};
$('curator-play').onclick=()=>{pilot=!pilot;write(CURATOR,{pilot,finishId});renderCurator();};
window.addEventListener('grapple-toy-record',event=>{toys=sanitizeToys(event.detail);renderCurator();});
const today=()=>new Date().toISOString().slice(0,10);
const unlocked=index=>index===0||Boolean(profile.eras[MISSIONS[index].id]||profile.eras[MISSIONS[index-1].id]);
const wildUnlocked=()=>ERAS.every(course=>profile.eras[course.id]);
function better(old,next){
 if(!old)return next;
 const improvement=grades.indexOf(next.medal)-grades.indexOf(old.medal);
 return improvement>0||(improvement===0&&next.ms<old.ms)?next:old;
}
function say(message){$('line-status').textContent=message;}
function resize(){
 const box=canvas.getBoundingClientRect();
 if(!box.width||!box.height)return;
 const scale=Math.min(2,devicePixelRatio||1);
 width=box.width;height=box.height;
 canvas.width=Math.round(width*scale);canvas.height=Math.round(height*scale);
 ctx.setTransform(scale,0,0,scale,0,0);
}
new ResizeObserver(resize).observe(canvas);
function paint(){
 if(!width||!height||!state)return;
 const c=state.course;
 const sky=ctx.createLinearGradient(0,0,0,height);
 sky.addColorStop(0,c.water);sky.addColorStop(1,'#101e30');
 ctx.fillStyle=sky;ctx.fillRect(0,0,width,height);
 ctx.fillStyle=c.ink+'25';ctx.fillRect((.5-c.zone)*width,0,2*c.zone*width,height);
 ctx.strokeStyle=c.ink+'80';ctx.lineWidth=2;
 for(const edge of [.5-c.zone,.5+c.zone]){
  ctx.beginPath();ctx.moveTo(edge*width,height*.23);ctx.lineTo(edge*width,height*.72);ctx.stroke();
 }
 drawScenery(c);
 const marker=state.phase==='aim'?ringX(state):state.phase==='action'?actionMarker(state):.5;
 const aligned=state.phase==='aim'?linedUp(state):state.phase!=='action'||Math.abs(marker-.5)<=.095;
 const px=marker*width;
 const py=(state.phase==='aim'?.42:state.phase==='action'?.42:c.mechanic==='climb'?.68-(1-state.distance)*.24:.71-state.distance*.29)*height;
 ctx.beginPath();ctx.moveTo(width*.5,height*.86);ctx.lineTo(px,py);
 ctx.strokeStyle=state.phase==='aim'?'#a3cdd750':state.stress>.78?'#ff9787':'#f3f2cd';
 if(state.phase==='aim')ctx.setLineDash([3,6]);ctx.stroke();ctx.setLineDash([]);
 ctx.beginPath();ctx.arc(px,py,13,0,Math.PI*2);
 ctx.strokeStyle=aligned?c.ink:'#e9f0da';
 ctx.lineWidth=aligned?6:3;ctx.stroke();
 if(pilot){
  ctx.font='24px system-ui';ctx.textAlign='center';ctx.fillText('🍇🍎',width*.5,height*.90);
 }else{
  ctx.beginPath();ctx.arc(width*.5,height*.86,7,0,Math.PI*2);ctx.fillStyle='#daf1d2';ctx.fill();
 }
 ctx.fillStyle='#f0f5eb';ctx.font='bold 13px system-ui';ctx.textAlign='center';ctx.fillText(c.target,px,py-23);
}
function drawScenery(course){
 const chapter=course.chapter??ERAS.find(era=>era.water===course.water)?.id;
 ctx.fillStyle=course.ink+'2c';
 if(chapter==='naval'){
  for(let row=0;row<3;row++){
   ctx.beginPath();
   for(let x=0;x<=width;x+=8){
    const y=height*(.66+row*.085)+6*Math.sin(x*.031+state.t*1.5);
    if(x===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);
   }
   ctx.strokeStyle=course.ink+'55';ctx.stroke();
  }
  ctx.beginPath();ctx.moveTo(width*.11,height*.62);ctx.lineTo(width*.30,height*.62);ctx.lineTo(width*.26,height*.68);ctx.lineTo(width*.15,height*.68);ctx.closePath();ctx.fill();
 }else if(chapter==='castle'){
  for(const x of [.10,.74]){
   ctx.fillRect(width*x,height*.30,width*.15,height*.50);
   for(let i=0;i<3;i++)ctx.fillRect(width*(x+i*.052),height*.25,width*.037,height*.08);
  }
 }else if(chapter==='frontier'){
  ctx.fillRect(0,height*.67,width,height*.17);
  ctx.fillStyle=course.ink+'39';
  for(let i=0;i<7;i++)ctx.fillRect(i*width*.16,height*.57,3,height*.23);
 }else{
  ctx.fillRect(0,height*.45,width*.34,height*.51);ctx.fillRect(width*.67,height*.35,width*.33,height*.61);
  ctx.fillStyle=course.ink+'46';
  for(const x of [.12,.20,.76,.85])for(const y of [.53,.67,.81])ctx.fillRect(width*x,height*y,8,9);
 }
}
function updateBoard(){
 const stress=state.stress;
 const [low,high]=tensionBand(state.course);
 const mechanic=state.course.mechanic;
 const rope={climb:'Climb',lasso:'Guide',rescue:'Lift'}[mechanic]??'Reel';
 $('cast').disabled=!['aim','action'].includes(state.phase);
 $('cast').textContent=state.phase==='action'?state.course.action:'Cast line';
 $('reel').disabled=state.phase!=='reel';
 $('reel').textContent=state.hold?(mechanic==='climb'?'Rest':'Ease'):rope;
 $('tension').low=low;$('tension').high=high;
 $('progress-label').textContent={climb:'Ascent',lasso:'To the gate',rescue:'Lift'}[mechanic]??'Retrieval';
 $('reel').setAttribute('aria-pressed',String(state.hold));
 $('tension').value=stress;$('towed').value=1-state.distance;
 $('tension-text').textContent=state.phase!=='reel'?'Ready':stress>high?'Ease now':stress>=low?'Green':'Slack';
 $('towed-text').textContent=Math.round((1-state.distance)*100)+'%';
 $('next-era').hidden=mode!=='campaign'||state.phase!=='won'||era>=MISSIONS.length-1;
}
function updateSidebar(){
 $('era-list-box').hidden=mode!=='campaign';
 $('daily-box').hidden=mode!=='daily';
 $('pk-area').hidden=!wildUnlocked();
 $('pk').checked=pk;
 $('pk-line').textContent=PK_LINE;
 $('era-list').replaceChildren(...MISSIONS.flatMap((course,index)=>{
  const record=profile.eras[course.id];
  const button=document.createElement('button');button.type='button';
  const label={naval:'Roman Harbor',castle:'Lantern Ring',frontier:'Runaway Stagecoach',rescue:'Cliff Rescue Sled'}[course.id]??course.name;
  button.textContent=label+(record?' · '+record.medal:unlocked(index)?'':' · Locked');
  button.disabled=!unlocked(index);
  button.setAttribute('aria-current',String(index===era));
  button.onclick=()=>{era=index;resetLine(true);startFrames();};
  const row=document.createElement('li');row.append(button);
  if(course.chapter)return [row];
  const heading=document.createElement('li');heading.className='chapter-label';heading.textContent=course.name;
  return [heading,row];
 }));
 const record=profile.days[day];
 $('daily-day').textContent=day;
 $('daily-best').textContent=record?record.medal+' · '+(record.ms/1000).toFixed(1)+' s':'No record yet';
}
function resetLine(focus=false){
 day=today();
 const course=mode==='daily'?dailyCourse(day):MISSIONS[era];
 state=freshLine(course,mode==='campaign'&&wildUnlocked()&&pk);
 previous=0;
 $('line-title').textContent=course.name;
 $('line-place').textContent=course.place;
 $('line-tip').textContent=course.tip;
 say('Cast when the target ring reaches the center bracket.');
 updateBoard();updateSidebar();
 if(focus)$('cast').focus();
}
function finish(){
 const result={medal:medal(state),ms:Math.max(1,Math.round(state.t*1000))};
 if(mode==='daily')profile.days[day]=better(profile.days[day],result);
 else profile.eras[MISSIONS[era].id]=better(profile.eras[MISSIONS[era].id],result);
 profile=sanitize(profile);
 const saved=write(KEY,profile);
 say(state.course.target+' secured. '+result.medal+' · '+(result.ms/1000).toFixed(1)+' s.'+(saved?'':' Storage is unavailable.'));
 updateSidebar();renderCurator();
}
function tick(now){
 const elapsed=previous?Math.min(.05,(now-previous)/1000):0;previous=now;
 const oldPhase=state.phase;
 const message=advanceLine(state,elapsed);
 if(state.phase==='won'&&oldPhase!=='won')finish();
 else if(message)say(message);
 const focusAction=oldPhase==='reel'&&state.phase==='action'&&document.activeElement===$('reel');
 updateBoard();paint();
 if(focusAction)$('cast').focus();
 if(state.phase!=='won')frame=requestAnimationFrame(tick);
}
function startFrames(){
 cancelAnimationFrame(frame);previous=0;
 frame=requestAnimationFrame(tick);
}
function select(view){
 mode=view;
 $('toy-view').hidden=view!=='toy';
 $('bubble-view').hidden=view!=='bubble';
 $('line-view').hidden=view!=='campaign'&&view!=='daily';
 for(const button of document.querySelectorAll('[data-view]'))button.setAttribute('aria-pressed',String(button.dataset.view===view));
 window.dispatchEvent(new Event('grapple-view'));
 cancelAnimationFrame(frame);
 if(!$('line-view').hidden){resetLine();resize();startFrames();}
 try{history.replaceState(null,'','#'+view);}catch{}
}
function cast(){
 if(state.phase==='action'){
  const message=doAction(state);
  if(state.phase==='won'){finish();cancelAnimationFrame(frame);paint();if(!$('next-era').hidden)$('next-era').focus();}
  else if(message)say(message);
 }else{
  const message=castLine(state);
  if(message)say(message);
 }
 updateBoard();
 if(state.phase==='reel')$('reel').focus();
}
function reel(){
 if(state.phase!=='reel')return;
 state.hold=!state.hold;updateBoard();
}
$('cast').onclick=cast;
$('reel').onclick=reel;
$('reset-line').onclick=()=>{resetLine(true);startFrames();};
$('next-era').onclick=()=>{if(era<MISSIONS.length-1&&unlocked(era+1)){era++;resetLine(true);startFrames();}};
$('pk').onchange=()=>{pk=$('pk').checked;resetLine(true);startFrames();};
window.addEventListener('blur',()=>{if(state)state.hold=false;});
window.addEventListener('keydown',event=>{
 if($('line-view').hidden||event.repeat||event.ctrlKey||event.metaKey||event.altKey||event.target.closest?.('input,textarea,select,a,summary'))return;
 if(event.code==='KeyR'&&state.phase==='reel'){event.preventDefault();reel();}
 if(event.code==='Space'&&!event.target.closest?.('button')&&state.phase!=='won'){
  event.preventDefault();if(['aim','action'].includes(state.phase))cast();else reel();
 }
});
for(const button of document.querySelectorAll('[data-view]'))button.onclick=()=>select(button.dataset.view);
window.addEventListener('grapple-progress',()=>{bubbles=sanitizeBubbles(read(BUBBLES));});
const transfer=$('save-code');
$('export-save').onclick=()=>{
 transfer.value=JSON.stringify({version:2,bubbles,profile,toys});
 transfer.focus();transfer.select();
 $('save-status').textContent='Save code ready to copy.';
};
$('import-save').onclick=()=>{
 try{
  const data=JSON.parse(transfer.value);
  if(![1,2].includes(data?.version)||!data.bubbles||!data.profile)throw Error('format');
  const incoming=sanitize(data.profile), lift=sanitizeBubbles(data.bubbles);
  for(const [index,score] of Object.entries(lift))bubbles[index]=Math.min(bubbles[index]??Infinity,score);
  for(const group of ['eras','days'])for(const [id,record] of Object.entries(incoming[group]))profile[group][id]=better(profile[group][id],record);
  for(const [id,score] of Object.entries(sanitizeToys(data.toys)))toys[id]=Math.min(toys[id]??Infinity,score);
  profile=sanitize(profile);
  const liftSaved=write(BUBBLES,bubbles), campaignSaved=write(KEY,profile), toySaved=write(TOYS,toys);
  window.dispatchEvent(new CustomEvent('grapple-restore',{detail:bubbles}));
  window.dispatchEvent(new CustomEvent('grapple-toy-restore',{detail:toys}));
  if(!$('line-view').hidden)updateSidebar();
  renderCurator();
  $('save-status').textContent=liftSaved&&campaignSaved&&toySaved?'Progress restored.':'Progress loaded. This browser could not save it.';
 }catch{$('save-status').textContent='That save code could not be read.';}
};
const initial=location.hash.slice(1);
select(['bubble','campaign','daily'].includes(initial)?initial:'toy');
renderCurator();
if('serviceWorker' in navigator)navigator.serviceWorker.register('./sw.js').catch(()=>{});
