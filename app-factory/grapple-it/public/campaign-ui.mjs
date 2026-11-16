
import {ERAS,PK_LINE,dailyCourse,freshLine,ringX,linedUp,castLine,advanceLine,medal} from './campaign.mjs';
import {STAGES} from './grapple.mjs';

const $=id=>document.getElementById(id);
const KEY='grapple-it-campaign-v1', BUBBLES='grapple-it-bubble-best';
const grades=['Bronze','Silver','Gold'];
const canvas=$('line-canvas');
const ctx=canvas.getContext('2d');
let mode='bubble', era=0, day='', pk=false, state, previous=0, width=0,height=0, frame=0;
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
 for(const course of ERAS){
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
const today=()=>new Date().toISOString().slice(0,10);
const unlocked=index=>index===0||Boolean(profile.eras[ERAS[index].id]||profile.eras[ERAS[index-1].id]);
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
 const px=(state.phase==='aim'?ringX(state):.5)*width;
 const py=(state.phase==='aim'?.42:.71-state.distance*.29)*height;
 ctx.beginPath();ctx.moveTo(width*.5,height*.86);ctx.lineTo(px,py);
 ctx.strokeStyle=state.phase==='aim'?'#a3cdd750':state.stress>.78?'#ff9787':'#f3f2cd';
 if(state.phase==='aim')ctx.setLineDash([3,6]);ctx.stroke();ctx.setLineDash([]);
 ctx.beginPath();ctx.arc(px,py,13,0,Math.PI*2);
 ctx.strokeStyle=state.phase==='aim'&&!linedUp(state)?'#e9f0da':c.ink;
 ctx.lineWidth=state.phase==='aim'&&!linedUp(state)?3:6;ctx.stroke();
 ctx.beginPath();ctx.arc(width*.5,height*.86,7,0,Math.PI*2);ctx.fillStyle='#daf1d2';ctx.fill();
 ctx.fillStyle='#f0f5eb';ctx.font='bold 13px system-ui';ctx.textAlign='center';ctx.fillText(c.target,px,py-23);
}
function updateBoard(){
 const stress=state.stress;
 $('cast').disabled=state.phase!=='aim';
 $('reel').disabled=state.phase!=='reel';
 $('reel').textContent=state.hold?'Ease':'Reel';
 $('reel').setAttribute('aria-pressed',String(state.hold));
 $('tension').value=stress;$('towed').value=1-state.distance;
 $('tension-text').textContent=state.phase!=='reel'?'Ready':stress>.78?'Ease now':stress>=.26?'Green':'Slack';
 $('towed-text').textContent=Math.round((1-state.distance)*100)+'%';
 $('next-era').hidden=mode!=='campaign'||state.phase!=='won'||era>=ERAS.length-1;
}
function updateSidebar(){
 $('era-list-box').hidden=mode!=='campaign';
 $('daily-box').hidden=mode!=='daily';
 $('pk-area').hidden=!wildUnlocked();
 $('pk').checked=pk;
 $('pk-line').textContent=PK_LINE;
 $('era-list').replaceChildren(...ERAS.map((course,index)=>{
  const record=profile.eras[course.id];
  const button=document.createElement('button');button.type='button';
  button.textContent=course.name+(record?' · '+record.medal:unlocked(index)?'':' · Locked');
  button.disabled=!unlocked(index);
  button.setAttribute('aria-current',String(index===era));
  button.onclick=()=>{era=index;resetLine(true);startFrames();};
  const row=document.createElement('li');row.append(button);return row;
 }));
 const record=profile.days[day];
 $('daily-day').textContent=day;
 $('daily-best').textContent=record?record.medal+' · '+(record.ms/1000).toFixed(1)+' s':'No record yet';
}
function resetLine(focus=false){
 day=today();
 const course=mode==='daily'?dailyCourse(day):ERAS[era];
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
 else profile.eras[ERAS[era].id]=better(profile.eras[ERAS[era].id],result);
 profile=sanitize(profile);
 const saved=write(KEY,profile);
 say(state.course.target+' secured. '+result.medal+' · '+(result.ms/1000).toFixed(1)+' s.'+(saved?'':' Storage is unavailable.'));
 updateSidebar();
}
function tick(now){
 const elapsed=previous?Math.min(.05,(now-previous)/1000):0;previous=now;
 const oldPhase=state.phase;
 const message=advanceLine(state,elapsed);
 if(state.phase==='won'&&oldPhase!=='won')finish();
 else if(message)say(message);
 updateBoard();paint();
 if(state.phase!=='won')frame=requestAnimationFrame(tick);
}
function startFrames(){
 cancelAnimationFrame(frame);previous=0;
 frame=requestAnimationFrame(tick);
}
function select(view){
 mode=view;
 $('bubble-view').hidden=view!=='bubble';
 $('line-view').hidden=view==='bubble';
 for(const button of document.querySelectorAll('[data-view]'))button.setAttribute('aria-pressed',String(button.dataset.view===view));
 window.dispatchEvent(new Event('grapple-view'));
 cancelAnimationFrame(frame);
 if(view!=='bubble'){resetLine();resize();startFrames();}
 try{history.replaceState(null,'','#'+view);}catch{}
}
function cast(){
 if(state.phase!=='aim')return;
 const message=castLine(state);
 if(message)say(message);
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
$('next-era').onclick=()=>{if(era<ERAS.length-1&&unlocked(era+1)){era++;resetLine(true);startFrames();}};
$('pk').onchange=()=>{pk=$('pk').checked;resetLine(true);startFrames();};
window.addEventListener('blur',()=>{if(state)state.hold=false;});
window.addEventListener('keydown',event=>{
 if(mode==='bubble'||event.repeat||event.ctrlKey||event.metaKey||event.altKey||event.target.closest?.('input,textarea,select,a,summary'))return;
 if(event.code==='KeyR'&&state.phase==='reel'){event.preventDefault();reel();}
 if(event.code==='Space'&&!event.target.closest?.('button')&&state.phase!=='won'){
  event.preventDefault();if(state.phase==='aim')cast();else reel();
 }
});
for(const button of document.querySelectorAll('[data-view]'))button.onclick=()=>select(button.dataset.view);
window.addEventListener('grapple-progress',()=>{bubbles=sanitizeBubbles(read(BUBBLES));});
const transfer=$('save-code');
$('export-save').onclick=()=>{
 transfer.value=JSON.stringify({version:1,bubbles,profile});
 transfer.focus();transfer.select();
 $('save-status').textContent='Save code ready to copy.';
};
$('import-save').onclick=()=>{
 try{
  const data=JSON.parse(transfer.value);
  if(data?.version!==1||!data.bubbles||!data.profile)throw Error('format');
  const incoming=sanitize(data.profile), lift=sanitizeBubbles(data.bubbles);
  for(const [index,score] of Object.entries(lift))bubbles[index]=Math.min(bubbles[index]??Infinity,score);
  for(const group of ['eras','days'])for(const [id,record] of Object.entries(incoming[group]))profile[group][id]=better(profile[group][id],record);
  profile=sanitize(profile);
  const liftSaved=write(BUBBLES,bubbles), campaignSaved=write(KEY,profile);
  window.dispatchEvent(new CustomEvent('grapple-restore',{detail:bubbles}));
  if(mode!=='bubble')updateSidebar();
  $('save-status').textContent=liftSaved&&campaignSaved?'Progress restored.':'Progress loaded. This browser could not save it.';
 }catch{$('save-status').textContent='That save code could not be read.';}
};
const initial=location.hash.slice(1);
select(['campaign','daily'].includes(initial)?initial:'bubble');
if('serviceWorker' in navigator)navigator.serviceWorker.register('./sw.js').catch(()=>{});
