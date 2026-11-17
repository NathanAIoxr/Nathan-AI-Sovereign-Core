import { eventResults } from './event-results.mjs';
import { STEP, createShot, advanceShot, heldPoint, HOOK, competitionWind } from './physics.mjs';

const node = id => document.getElementById(id);
let playerKey;
try {
  playerKey = localStorage.getItem('tabor-competition-player-v1');
  if (!/^[a-f0-9]{32}$/.test(playerKey??'')) {
    playerKey=crypto.randomUUID().replaceAll('-','');
    localStorage.setItem('tabor-competition-player-v1',playerKey);
  }
} catch {playerKey=crypto.randomUUID().replaceAll('-','');}
let event, busy=false, poll, pollCursor=0, animateId, capture=null, tossAnimating=false;
const initialCode = new URLSearchParams(location.search).get('event')??'';
const setStatus = message => {node('status').textContent=message;};
const court=node('court'), ctx=court.getContext('2d');
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const codeValue = value => value.trim().toLowerCase();
const inviteUrl = code => new URL('/competition?event='+code,location.origin).href;
const inputOf = form => Object.fromEntries(new FormData(form));
const positionOnCourt = point => ({x:330+point.x*150,y:222-point.z*84+(-point.y-1.5)*60});

async function request(path, payload) {
  const headers={'X-Player-Key':playerKey};
  if(payload)headers['Content-Type']='application/json';
  const response=await fetch('/api/events'+path,{method:payload?'POST':'GET',headers,body:payload?JSON.stringify(payload):undefined});
  if(response.status===204)return null;
  let data;
  try {data=await response.json();}catch {throw new Error('Online events are unavailable. Try again in a moment.');}
  if(!response.ok)throw new Error(data.error??'Online events are unavailable.');
  return data;
}
function matchFor(data) {
  return data.rounds.at(-1)?.find(match => match.players.includes(data.me));
}
function update(next) {
  if(event?.code===next.code && event.revision>next.revision)return;
  const previous=event;
  event=next;
  const match=matchFor(event);
  const prior=previous?.code===event.code && previous.rounds.length===event.rounds.length?matchFor(previous):null;
  if(match?.last&&match.turn!==prior?.turn)node('match-detail').textContent=event.players[match.last.position]+' · '+match.last.detail;
  if(previous?.code!==event.code || previous.rounds.length!==event.rounds.length)node('match-detail').textContent='';
  node('entrance').hidden=true;
  node('event').hidden=false;
  node('event-title').textContent=event.name;
  node('event-subtitle').textContent=event.players.length+' / '+event.capacity+' seats · First to '+event.goal+' with an equal number of tosses';
  if(!match?.last)node('match-detail').textContent='';
  const roster=event.players.map((name,index)=>{
    const li=document.createElement('li');
    li.textContent=name+(index===0?' · Host':'')+(index===event.me?' · You':'');
    return li;
  });
  node('players').replaceChildren(...roster);
  const rounds=event.rounds.map((round,index)=>{
    const section=document.createElement('section'), title=document.createElement('h3');
    title.textContent=round.length===1?'Final':'Round '+(index+1);
    section.append(title);
    for(const pair of round){
      const line=document.createElement('div');
      line.className='match'+(pair.players.includes(event.me)?' mine':'');
      const left=document.createElement('span'), right=document.createElement('span'), score=document.createElement('strong');
      left.textContent=event.players[pair.players[0]];
      right.textContent=event.players[pair.players[1]];
      score.textContent=pair.scores.join(' – ');
      if(pair.winner!==null) (pair.winner===pair.players[0]?left:right).className='winner';
      line.append(left,score,right);
      section.append(line);
    }
    return section;
  });
  node('bracket').replaceChildren(...rounds);
  history.replaceState(null,'',inviteUrl(event.code));
  controls();
}
function canToss() {
  if (!event || event.champion!==null || tossAnimating) return false;
  const match=matchFor(event);
  return !!match && match.winner===null && match.players[match.turn%2]===event.me
    && (!match.last || match.last.position!==event.me);
}
function controls() {
  const match=matchFor(event);
  const turn=canToss();
  node('toss-controls').hidden=!turn;
  node('toss').hidden=!turn;
  node('toss').disabled=busy;
  node('host-start').hidden=!!event.rounds.length || event.me!==0 || event.capacity===2;
  node('host-start').disabled=busy || event.players.length!==event.capacity;
  node('download-results').hidden=event.champion===null;
  node('cancel-room').hidden=!!event.rounds.length||event.me!==0;
  node('cancel-room').disabled=busy;
  const wind=turn?competitionWind(event.code,event.rounds.length,match.turn):0;
  node('wind-readout').textContent=turn?(Math.abs(wind)<.02?'Steady air':'Light breeze '+(wind>0?'→ right':'← left')):'';
  let message='Waiting for players';
  if(event.champion!==null)message=event.players[event.champion]+' wins!';
  else if(!event.rounds.length&&event.players.length===event.capacity)message='The bracket is full. The host can start it.';
  else if(match?.winner!==null&&match?.winner!==undefined)message=event.players[match.winner]+' advances.';
  else if(match)message=(turn?'Your toss':event.players[match.players[match.turn%2]]+' to toss')+' · '+match.scores.join(' – ');
  else if(event.rounds.length)message='Waiting for the next round';
  if(node('turn-status').textContent!==message)node('turn-status').textContent=message;
}
function draw(point=heldPoint({pull:Number(node('pull').value)/100,aim:Number(node('aim').value)/100,flick:0})){
  const paint=ctx.createLinearGradient(0,0,0,340);
  paint.addColorStop(0,'#316160');paint.addColorStop(1,'#102929');ctx.fillStyle=paint;ctx.fillRect(0,0,660,340);
  ctx.strokeStyle='#7b99904e';ctx.lineWidth=1;
  for(let y=108;y<=323;y+=29){ctx.beginPath();ctx.moveTo(40,y);ctx.lineTo(620,y);ctx.stroke();}
  const hook=positionOnCourt(HOOK), ring=positionOnCourt(point);
  ctx.fillStyle='#d9a967';ctx.fillRect(hook.x-16,hook.y-19,32,38);
  ctx.strokeStyle='#483422';ctx.lineWidth=3;ctx.beginPath();ctx.arc(hook.x,hook.y,6,.15,Math.PI*1.55);ctx.stroke();
  ctx.strokeStyle='#e8deba';ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(330,18);ctx.lineTo(ring.x,ring.y);ctx.stroke();
  ctx.strokeStyle='#fde197';ctx.lineWidth=5;ctx.beginPath();ctx.ellipse(ring.x,ring.y,13,8,0,0,Math.PI*2);ctx.stroke();
}
function animate(input,wind){
  if(reduced.matches)return;
  const shot=createShot({...input,flick:0},wind);
  const start=performance.now();
  function frame(now){
    while(!shot.result&&shot.time+STEP<=(now-start)/1000)advanceShot(shot);
    draw(shot.p);
    if(!shot.result)animateId=requestAnimationFrame(frame);
  }
  animateId=requestAnimationFrame(frame);
}
async function submitAction(action,payload){
  if(busy)return;
  busy=true;setStatus('');
  if(event)controls();
  try {update(await request(action,payload));}
  catch(error){setStatus(error.message);}
  finally {busy=false;if(event)controls();}
}
function beginPolling(){
  clearTimeout(poll);
  const cycle=++pollCursor;
  let delay=1800;
  const timeout=()=>event?.rounds.length?delay:Math.max(delay,4000);
  async function refresh(){
    if(cycle!==pollCursor||!event||event.champion!==null)return;
    if(!busy&&!document.hidden){
      const code=event.code;
      try{
        const next=await request('/'+code+'?revision='+event.revision);
        if(cycle===pollCursor&&event?.code===code&&next)update(next);
        if(delay>1800&&cycle===pollCursor)setStatus('');
        delay=1800;
      }catch(error){
        if(cycle===pollCursor&&event?.code===code)setStatus(error.message);
        delay=Math.min(15000,delay*2);
      }
    }
    if(cycle===pollCursor&&event?.champion===null)poll=setTimeout(refresh,timeout());
  }
  poll=setTimeout(refresh,timeout());
}
document.addEventListener('visibilitychange',()=>{
  if(!document.hidden&&event?.champion===null)beginPolling();
});
node('create-event').onsubmit=async e=>{
  e.preventDefault();const data=inputOf(e.currentTarget);
  await submitAction('',{...data,capacity:Number(data.capacity),goal:Number(data.goal)});
  if(event)beginPolling();
};
node('join-event').onsubmit=async e=>{
  e.preventDefault();const data=inputOf(e.currentTarget);
  await submitAction('/'+codeValue(data.code)+'/join',{name:data.name});
  if(event)beginPolling();
};
node('host-start').onclick=()=>submitAction('/'+event.code+'/start',{});
node('toss').onclick=async()=>{
  if(!canToss()||busy)return;
  const input={round:event.rounds.length,turn:matchFor(event).turn,pull:Number(node('pull').value)/100,aim:Number(node('aim').value)/100};
  tossAnimating=true;
  cancelAnimationFrame(animateId);
  animate(input,competitionWind(event.code,input.round,input.turn));
  await submitAction('/'+event.code+'/toss',input);
  tossAnimating=false;
  if(event)controls();
};
node('download-results').onclick=()=>{
  const results=eventResults(event);
  if(!results)return;
  const download=document.createElement('a');
  const url=URL.createObjectURL(new Blob([JSON.stringify(results,null,2)+'\n'],{type:'application/json'}));
  download.href=url;
  download.download='hook-and-ring-'+event.code+'-results.json';
  download.click();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
  setStatus('Tournament results downloaded.');
};
node('copy-invite').onclick=async()=>{
  const link=inviteUrl(event.code);
  try{await navigator.clipboard.writeText(link);setStatus('Invite copied. Send it to the other players.');}
  catch{const output=node('invite-display');output.textContent=link;output.hidden=false;}
};
function exitRoom(){
  if(busy)return;
  pollCursor++;clearTimeout(poll);cancelAnimationFrame(animateId);event=null;history.replaceState(null,'','/competition');
  node('event').hidden=true;node('entrance').hidden=false;node('invite-display').hidden=true;setStatus('');
}
node('exit-room').onclick=exitRoom;
node('cancel-room').onclick=async()=>{
  if(busy||!event||!window.confirm('Cancel this lobby and close its invite?'))return;
  busy=true;controls();
  try {await request('/'+event.code+'/cancel',{});busy=false;exitRoom();setStatus('Event cancelled.');}
  catch(error){busy=false;controls();setStatus(error.message);}
};
for(const key of ['pull','aim'])node(key).oninput=()=>{node(key+'-read').value=node(key).value;cancelAnimationFrame(animateId);draw();};
function drag(event){
  const bounds=court.getBoundingClientRect();
  node('aim').value=Math.round((event.clientX-bounds.left)/bounds.width*200-100);
  node('pull').value=Math.round((event.clientY-bounds.top)/bounds.height*90+5);
  node('aim').oninput();node('pull').oninput();
}
court.onpointerdown=e=>{if(canToss()&&!busy&&e.button===0){capture=e.pointerId;court.setPointerCapture(capture);drag(e);}};
court.onpointermove=e=>{if(e.pointerId===capture)drag(e);};
court.onpointerup=e=>{if(e.pointerId===capture){drag(e);capture=null;node('toss').click();}};
for(const kind of ['pointercancel','lostpointercapture'])court.addEventListener(kind,e=>{if(e.pointerId===capture)capture=null;});
draw();
if(/^[a-f0-9]{10}$/.test(initialCode)){
  node('join-event').elements.code.value=initialCode;
  try {
    const existing=await request('/'+initialCode);
    if(existing.me>=0){update(existing);beginPolling();}
    else setStatus('Invite to '+existing.name+'. Enter your name to take a seat.');
  } catch(error){setStatus(error.message);}
}
