import {YARD_FLIGHT_MS,YARD_RESET_MS,yardRound,yardImpact,yardPoints,rankedYardImpact} from './yard-rules.mjs';
import {yardRewardThrow,yardRewardRound,yardCosmetic} from './yard-economy.mjs';

(() => {
 'use strict';
 const $ = id => document.getElementById(id);
 const canvas=$('game'), ctx=canvas.getContext('2d');
 const W=420,H=505,TAU=Math.PI*2;
 canvas.width=W*2;canvas.height=H*2;ctx.setTransform(2,0,0,2,0,0);
 const C={sky:'#78d6cc',wood:'#bd835b',cream:'#fff9cf',pink:'#ff6c9b',mint:'#5dfbd5',gold:'#ffe16a',dark:'#102d37'};
 const modes=['solo','cpu','local','practice','daily'];
 let ranked=null, rankedStart=0, shots=[], starting=false;
 const api='/api/yard-darts/';
 const challenge=new URLSearchParams(location.search).get('challenge');
 const challengeScore=challenge!==null&&/^\d{1,2}$/.test(challenge)&&Number(challenge)<=50 ? Number(challenge) : null;
 const dailyMessage=text=>{$('yard-daily-status').textContent=text;};
 async function request(path,body){
  const options=body===undefined?{}:{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)};
  const response=await fetch(api+path,options);
  const value=await response.json();
  if(!response.ok)throw new Error(value.error);
  return value;
 }
 async function openBoard(){
  const dialog=$('yard-board'), status=$('yard-board-status'), list=$('yard-board-scores');
  list.replaceChildren();status.textContent='Loading today’s scores…';
  if(!dialog.open)dialog.showModal();
  try{
   const board=await request('board');
   status.textContent=board.scores.length?'Scores for '+board.day+' · Eastern time':'No scores posted for '+board.day+'.';
   for(const row of board.scores){
    const li=document.createElement('li');
    li.textContent=row.alias+' · '+row.score+' pts · '+(row.durationMs/1000).toFixed(1)+' s';
    list.append(li);
   }
  }catch(error){status.textContent=error.message;}
 }
 async function startRanked(){
  if(starting||$('yard-submit').disabled)return;
  starting=true;
  const epoch=animEpoch;
  $('yard-start').disabled=true;dailyMessage('Opening the ranked court…');
  try{
   const start=await request('start',{});
   if(mode==='daily'&&epoch===animEpoch)begin('daily',start);
  }catch(error){if(mode==='daily'&&epoch===animEpoch)dailyMessage(error.message);}
  finally{starting=false;if(!ranked||state.done)$('yard-start').disabled=false;}
 }
 async function submitRanked(){
  if(!ranked||!state.done||!shots.length||$('yard-submit').disabled)return;
  const round=ranked, button=$('yard-submit');
  button.disabled=true;dailyMessage('Verifying your throws…');
  const alias=$('yard-alias').value.trim();
  try{
   const result=await request('submit',{token:round.token,alias,shots});
   safeWrite('yardDartsAlias',alias);
   yardRewardRound({mode:'daily',rankedDay:round.day});
   if(ranked!==round)return;
   $('yard-submit-panel').hidden=true;
   $('yard-share').hidden=false;
   ranked.accepted=result.accepted;
   dailyMessage('Verified score: '+result.accepted+' points.');
  }catch(error){if(ranked===round)dailyMessage(error.message);}
  finally{button.disabled=false;}
 }
 async function shareChallenge(){
  const url=new URL('/yard-darts',location.origin);
  url.searchParams.set('challenge',ranked.accepted);
  try{await navigator.clipboard.writeText(url.href);dailyMessage('Challenge link copied.');}
  catch{window.prompt('Copy this challenge link:',url.href);}
 }
 let mode='cpu', state, clock=0, hovering=false, dragging=false, audioCtx=null, soundOn=false, deferredInstall=null, animEpoch=0, timers=[];
 const safeRead = (key, fallback) => { try { const v=localStorage.getItem(key);return v === null?fallback:v; }catch{return fallback;} };
 const safeWrite = (key,val) => {try{localStorage.setItem(key,String(val));}catch{}};
 let best=Math.max(0,Number(safeRead('yardDartsBest',0))||0);
 function schedule(fn,ms){const id=setTimeout(fn,ms);timers.push(id);return id;}
 function clearTimers(){timers.forEach(clearTimeout);timers=[];}
 function rand(a,b){return a+Math.random()*(b-a)}
 function clamp(v,a,b){return Math.min(b,Math.max(a,v))}
 function fmt(n){return String(n).padStart(2,'0')}
 function labelPlayer(p){return p===0?(mode==='local'?'PLAYER 1':'YOU'):(mode==='cpu'?'COMPUTER':'PLAYER 2')}
 function begin(newMode=mode,newRanked=null){
  if(state&&!state.done)yardRewardRound({mode,complete:false});
  animEpoch++;clearTimers();mode=newMode;ranked=newRanked;rankedStart=performance.now();shots=[];dragging=false;
  $('yard-daily').hidden=mode!=='daily';$('yard-submit-panel').hidden=true;$('yard-share').hidden=true;
  $('yard-start').textContent='Start ranked round';
  $('yard-start').hidden=Boolean(ranked);$('yard-start').disabled=Boolean(ranked);
  $('windToggle').disabled=mode==='daily'||mode==='practice';$('yard-clock').textContent='2:00';
  if(mode==='daily')dailyMessage(challengeScore===null?'Highest score wins. Fastest finish breaks ties.':'Challenge target: '+challengeScore+' points.');
  state={round:1,total:mode==='solo'?5:mode==='daily'?4:mode==='practice'?1:3,player:0,shots:3,scores:[0,0],darts:[],target:{x:210,y:242,r:67},wind:0,aim:{x:210,y:242},flight:null,particles:[],done:false,busy:false};
  chooseRound(); $('endOverlay').classList.remove('open');$('helpOverlay').classList.remove('open');$('toast').classList.remove('show');
  for(const m of modes){$(m).classList.toggle('active',m===mode);$(m).setAttribute('aria-pressed',String(m===mode));}
  $('name1').textContent=labelPlayer(0);$('name2').textContent=mode==='solo'?'PERSONAL BEST':mode==='daily'?'DARTS USED':mode==='practice'?'TARGET':labelPlayer(1);
  announce(mode==='solo'?'SOLO ARCADE!':mode==='cpu'?'BEAT THE COMPUTER!':mode==='daily'?'DAILY TOURNAMENT':mode==='practice'?'PRACTICE THREE DARTS':'PASS & PLAY!',1000);
  updateHud();
 }
 function chooseRound(){
  state.target={x:rand(158,265),y:rand(190,275),r:67};
  state.wind=$('windToggle').checked?Math.round(rand(-3.2,3.2)*10)/10:0;
  if(mode==='practice'){state.target={x:210,y:242,r:67};state.wind=0;}
  if(ranked){state.target=yardRound(ranked.seed,state.round);state.wind=state.target.wind;}
  state.aim=ranked?{x:210,y:310}:{x:state.target.x-state.wind*3.5,y:state.target.y};
  state.darts=[];
 }
 function updateHud(){
  $('score1').textContent=fmt(state.scores[0]);$('score2').textContent=mode==='solo'?fmt(best):mode==='daily'?fmt(shots.length):mode==='practice'?'15':fmt(state.scores[1]);
  $('round').textContent=`ROUND ${state.round} / ${state.total}`;
  $('turn').textContent=state.done?'FINISH!':state.busy?'DART IN FLIGHT':state.player===0?(mode==='local'?'PLAYER 1 TURN':'YOUR TURN'):(mode==='cpu'?'COMPUTER TURN':'PLAYER 2 TURN');
  $('shots').textContent=state.done?'GAME COMPLETE':`${state.shots} ${state.shots===1?'DART':'DARTS'} LEFT`;
  const v=state.wind;
  $('wind').textContent=`WIND ${v>0?'→':v<0?'←':'•'} ${Math.abs(v).toFixed(1)}`;
  $('best').innerHTML=`SOLO BEST <strong>${fmt(best)}</strong>`;
  $('throw').disabled=(mode==='daily'&&!ranked)||state.done||state.busy||(mode==='cpu'&&state.player===1);
 }
 function announce(str,ms=950){
  const el=$('toast');el.textContent=str;el.classList.add('show');
  const marker=++announce.counter;
  schedule(()=>{if(marker===announce.counter)el.classList.remove('show')},ms);
 }
 announce.counter=0;
 function playTone(freq=440,duration=.1,type='sine',vol=.1){
  if(!soundOn)return;
  try{
   audioCtx??=new(window.AudioContext||window.webkitAudioContext)();
   if(audioCtx.state==='suspended')audioCtx.resume();
   const o=audioCtx.createOscillator(),g=audioCtx.createGain();o.type=type;o.frequency.value=freq;g.gain.setValueAtTime(vol,audioCtx.currentTime);g.gain.exponentialRampToValueAtTime(.001,audioCtx.currentTime+duration);o.connect(g);g.connect(audioCtx.destination);o.start();o.stop(audioCtx.currentTime+duration);
  }catch{}
 }
 function addParticles(x,y,points){
  for(let i=0;i<(points===5?33:points?13:4);i++){
   state.particles.push({x,y,vx:rand(-3.5,3.5),vy:rand(-6,-1.4),life:rand(35,70),size:rand(2,5),color:[C.gold,C.pink,C.mint,'#ffffff'][i%4]});
  }
 }
 function throwDart(x=state.aim.x,y=state.aim.y,fromCpu=false){
  if(state.done||state.busy||state.shots<=0||(mode==='daily'&&!ranked))return;
  if(mode==='cpu'&&state.player===1&&!fromCpu)return;
  x=clamp(x,30,W-30);y=clamp(y,95,380);
  state.aim={x,y};
  state.busy=true;const p=state.player;
  const releasedMs=Math.floor(performance.now()-rankedStart);
  if(ranked&&(releasedMs>=ranked.limitMs||shots.length>=ranked.maxShots)){end();return;}
  const jitter=fromCpu?rand(-19,19):rand(-8,8);
  const jitterY=fromCpu?rand(-19,19):rand(-7,7);
  const hit=ranked?rankedYardImpact(ranked.seed,shots.length,x,y):yardImpact(x,y,state.wind,jitter,jitterY);
  if(ranked)shots.push({x,y,releasedMs});
  state.flight={start:performance.now(),x:hit.x,y:hit.y,team:p,epoch:animEpoch};
  $('throw').disabled=true;
  playTone(p===0?350:290,.13,'triangle',.06);
  updateHud();
 }
 function finishFlight(f){
  const points=yardPoints(state.target,f.x,f.y);state.scores[f.team]+=points;state.shots--;
  state.darts.push({x:f.x,y:f.y,team:f.team,points});
  yardRewardThrow({points,mode,fromCpu:mode==='cpu'&&f.team===1,player:f.team});
  addParticles(f.x,f.y,points);
  if(points===5){playTone(740,.16,'square',.06);schedule(()=>playTone(1050,.2,'square',.04),140);announce('BULLSEYE!\n+5 POINTS',1150);}
  else if(points===3){playTone(580,.15,'sine',.08);announce('INNER RING!\n+3 POINTS',850);}
  else if(points===1){playTone(480,.12,'sine',.06);announce('ON THE RING!\n+1 POINT',820);}
  else{playTone(150,.16,'sawtooth',.035);announce('JUST MISSED!',750);}
  state.flight=null;
  if(mode==='solo'&&state.scores[0]>best){best=state.scores[0];safeWrite('yardDartsBest',best);}
  updateHud();
  schedule(()=>{
   if(state.done)return;
   if(ranked&&(shots.length===ranked.maxShots||performance.now()-rankedStart>=ranked.limitMs)){end();return;}
   if(state.shots>0){state.busy=false;updateHud();if(mode==='cpu'&&state.player===1)schedule(cpuTurn,600);return;}
   if((mode==='cpu'||mode==='local')&&state.player===0){state.player=1;state.shots=3;state.busy=false;updateHud();announce(mode==='cpu'?'COMPUTER UP!':'PLAYER 2 UP!',950);if(mode==='cpu')schedule(cpuTurn,1050);return;}
   if(state.round>=state.total){end();return;}
   state.round++;state.player=0;state.shots=ranked?Math.min(3,ranked.maxShots-shots.length):3;state.busy=false;chooseRound();updateHud();announce(`ROUND ${state.round}!`,1100);
  },YARD_RESET_MS);
 }
 function cpuTurn(){
  if(mode!=='cpu'||state.player!==1||state.done||state.busy)return;
  // Fair opponent: typically aims for the inner ring, with occasional near-perfect throws.
  const level=$('difficulty').value; const miss=level==='easy'?rand(26,90):level==='hard'?rand(0,30):(rand(0,1)<.21?rand(3,18):rand(19,60));
  const a=rand(0,TAU);
  throwDart(state.target.x+Math.cos(a)*miss-state.wind*4.0,state.target.y+Math.sin(a)*miss,true);
 }
 function end(){
  if(state.done)return;
  state.done=true;state.busy=false;updateHud();
  yardRewardRound({mode,complete:mode!=='daily'});
  if(mode==='daily'){
   $('yard-submit-panel').hidden=!shots.length;
   $('yard-start').hidden=false;$('yard-start').disabled=false;
   $('yard-start').textContent='Start another ranked round';
   dailyMessage(state.scores[0]+' points · '+(shots.length?'Post your score to the leaderboard.':'Start a new round to try again.'));
   if(shots.length)$('yard-alias').focus();
   return;
  }
  let result,detail;
  if(mode==='practice'){result='PRACTICE COMPLETE';detail='You scored '+state.scores[0]+' out of 15 in three throws.';}
  else if(mode==='solo'){result=state.scores[0]>=best?'ARCADE CHAMP!':'GREAT GAME!';detail=`You scored ${state.scores[0]} points in 15 throws. Personal best: ${best}.`;}
  else if(state.scores[0]===state.scores[1]){result="IT'S A TIE!";detail=`Both players scored ${state.scores[0]} points. That's a backyard showdown!`;}
  else{const winner=state.scores[0]>state.scores[1]?labelPlayer(0):labelPlayer(1);result=`${winner} WINS!`;detail=`Final score: ${state.scores[0]} – ${state.scores[1]} after 3 rounds.`;}
  $('endResult').textContent=result;$('endDetail').textContent=detail;
  announce('GAME OVER!',1300);schedule(()=>{$('endOverlay').classList.add('open');$('again').focus();},1150);
 }
 function roundedRect(x,y,w,h,r){ctx.beginPath();ctx.roundRect(x,y,w,h,r);}
 function ellipse(x,y,rx,ry,fill,stroke,lw=1){ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,TAU);if(fill){ctx.fillStyle=fill;ctx.fill();}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=lw;ctx.stroke();}}
 function line(x1,y1,x2,y2,col,lw=1){ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.strokeStyle=col;ctx.lineWidth=lw;ctx.stroke();}
 function drawDart(x,y,team,angle=-1.1,scale=1){
  ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.scale(scale,scale);
  ctx.shadowColor='#0c1c1b70';ctx.shadowBlur=4;ctx.shadowOffsetY=4;
  const cosmetic=team===0&&mode!=='daily';
  const shaft=team===0?(cosmetic&&yardCosmetic('finish')||'#fcec75'):'#ff80b0';
  const fins=team===0?(cosmetic&&yardCosmetic('tail')||'#59ffe0'):'#ee548f';
  ctx.lineCap='round';line(-20,0,13,0,'#243b44',7);line(-20,0,13,0,shaft,4);
  ctx.shadowBlur=0;ctx.shadowOffsetY=0;
  ctx.beginPath();ctx.moveTo(20,0);ctx.lineTo(10,-4.5);ctx.lineTo(10,4.5);ctx.closePath();ctx.fillStyle='#f3ffff';ctx.fill();
  ctx.beginPath();ctx.moveTo(-23,0);ctx.lineTo(-36,-14);ctx.lineTo(-20,-8);ctx.lineTo(-15,0);ctx.closePath();ctx.fillStyle=fins;ctx.fill();
  ctx.beginPath();ctx.moveTo(-23,0);ctx.lineTo(-35,13);ctx.lineTo(-20,7);ctx.lineTo(-15,0);ctx.closePath();ctx.fillStyle=fins;ctx.fill();
  ctx.restore();
 }
 function drawBackground(t){
  const sky=ctx.createLinearGradient(0,0,0,170);sky.addColorStop(0,(mode!=='daily'&&yardCosmetic('court'))||'#64caca');sky.addColorStop(1,'#b0eab6');ctx.fillStyle=sky;ctx.fillRect(0,0,W,172);
  ellipse(75,53,38,38,'#fff0ac');ellipse(75,53,28,28,'#ffe071');
  function cloud(x,y,s){ctx.fillStyle='#f8fcdaac';ellipse(x,y,23*s,11*s,'#f8fcdaac');ellipse(x+18*s,y-6*s,18*s,13*s,'#f8fcdaac');ellipse(x+33*s,y,24*s,11*s,'#f8fcdaac');}
  cloud(210,43,1);cloud(322,78,.8);
  ctx.fillStyle='#396b57';for(let i=0;i<9;i++){ellipse(-20+i*59,163,48,32,'#397962');}
  // Backyard picket fence with durable visual contrast.
  ctx.fillStyle='#bf8059';ctx.fillRect(0,140,W,13);ctx.fillRect(0,170,W,12);
  for(let i=0;i<19;i++){
   const x=i*24-10;ctx.fillStyle=i%2?'#eac48d':'#dbac73';ctx.beginPath();ctx.moveTo(x,183);ctx.lineTo(x,129);ctx.lineTo(x+11,120);ctx.lineTo(x+22,129);ctx.lineTo(x+22,183);ctx.closePath();ctx.fill();
   line(x+2,132,x+2,179,'#9f74565c',1);
  }
  // Retro bunting.
  line(0,102,W,102,'#396866',2);
  for(let i=0;i<15;i++){const x=i*30;ctx.fillStyle=i%3===0?C.gold:i%3===1?C.pink:C.mint;ctx.beginPath();ctx.moveTo(x,101);ctx.lineTo(x+22,101);ctx.lineTo(x+12,118+(i%2)*6);ctx.closePath();ctx.fill();}
  // Alternating mowed stripes with receding perspective.
  ctx.fillStyle='#3fae68';ctx.fillRect(0,182,W,H-182);
  ctx.save();ctx.beginPath();ctx.rect(0,182,W,H-182);ctx.clip();
  for(let i=-5;i<12;i++){
   const x=i*72 + Math.sin(t*.00018)*5;
   ctx.fillStyle=i%2?'#6bc77a72':'#21875b5e';ctx.beginPath();ctx.moveTo(210+(x-210)*.42,182);ctx.lineTo(210+(x+35-210)*.42,182);ctx.lineTo(x+72,H);ctx.lineTo(x,H);ctx.closePath();ctx.fill();
  }
  for(let i=0;i<20;i++){const y=202+i*19;ctx.strokeStyle=i%2?'#d4edac1d':'#183f3c12';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();}
  ctx.restore();
  // Side flower beds, keep target area open.
  for(let side=0;side<2;side++){
   const x=side?W-26:26;
   for(let i=0;i<8;i++){
    const y=205+i*38;ellipse(x+Math.sin(i*9)*10,y+12,19,8,'#164f3599');
    const cx=x+Math.sin(i*9)*11,cy=y+5;line(cx,cy+6,cx,cy-6,'#145c39',2);
    for(let j=0;j<5;j++){const a=TAU*j/5;ellipse(cx+Math.cos(a)*6,cy+Math.sin(a)*6,4.5,4.5,j%2?C.pink:C.gold);}
    ellipse(cx,cy,3,3,'#fffaf0');
   }
  }
  // Glow of the sun across grass.
  const glare=ctx.createRadialGradient(90,140,0,190,280,340);glare.addColorStop(0,'#edffad19');glare.addColorStop(1,'#edffad00');ctx.fillStyle=glare;ctx.fillRect(0,140,W,H-140);
 }
 function drawTarget(t){
  const {x,y,r}=state.target;
  ellipse(x+5,y+10,r+19,(r+19)*.64,'#0d432c5e');
  ellipse(x,y,r+10,(r+10)*.64,'#e8e6b2','#184c43',3);
  ellipse(x,y,r,(r)*.64,'#fb73a0','#bc2f72',3);
  ellipse(x,y,47,29,'#ffea7c','#f4ffff',3);
  ellipse(x,y,21,14,'#45e6cf','#136e68',3);
  ellipse(x,y,7,5,'#fffdeb');
  ctx.lineWidth=1;ctx.strokeStyle='#fcffb34d';ctx.setLineDash([5,7]);ctx.beginPath();ctx.ellipse(x,y,r+18,(r+18)*.64,0,0,TAU);ctx.stroke();ctx.setLineDash([]);
  // Stylized shadow hint / scoring markings.
  ctx.save();ctx.font='900 13px system-ui';ctx.textAlign='center';ctx.shadowColor='#113f32';ctx.shadowBlur=3;
  ctx.fillStyle='#145a56';ctx.fillText('5',x,y-24);ctx.fillText('3',x,y-53);ctx.fillStyle='#fff7db';ctx.fillText('1',x,y-73);ctx.restore();
  // The ring appears elliptical in perspective, but scoring uses circular distance
  // to keep aiming easy and fair across screen shapes.
 }
 function drawReticle(t){
  if(state.done||state.busy||(mode==='cpu'&&state.player===1))return;
  const {x,y}=state.aim;const pulse=2+Math.sin(t*.005)*2;
  ctx.save();ctx.strokeStyle='#fcfff1eb';ctx.lineWidth=2;ctx.setLineDash([6,5]);ctx.beginPath();ctx.arc(x,y,16+pulse,0,TAU);ctx.stroke();ctx.setLineDash([]);
  line(x-31,y,x-9,y,'#fff',2);line(x+9,y,x+31,y,'#fff',2);line(x,y-31,x,y-9,'#fff',2);line(x,y+9,x,y+31,'#fff',2);
  ellipse(x,y,3,3,C.gold);ctx.restore();
  if(dragging){
   ctx.strokeStyle='#fff7b7c5';ctx.lineWidth=3;ctx.setLineDash([8,8]);ctx.beginPath();ctx.moveTo(W/2,H-25);ctx.quadraticCurveTo((W/2+x)/2,320,x,y);ctx.stroke();ctx.setLineDash([]);
  }
 }
 function drawForeground(){
  ctx.fillStyle='#184d4388';ctx.fillRect(0,H-47,W,47);
  ctx.font='950 11px system-ui';ctx.fillStyle='#e1ffe4';ctx.textAlign='left';ctx.fillText('AIM',18,H-19);
  ctx.fillStyle='#f4f3ac';ctx.textAlign='right';ctx.fillText('FIRE & SCORE',W-18,H-19);
  // Launch dart waiting at bottom.
  if(!state.busy&&!state.done&&!(mode==='cpu'&&state.player===1))drawDart(W/2,H-21,state.player,-Math.PI/2,1.05);
 }
 function drawFlight(now){
  const f=state.flight;if(!f)return;
  if(f.epoch!==animEpoch){state.flight=null;return;}
  const p=clamp((now-f.start)/YARD_FLIGHT_MS,0,1);
  const ease=p*p*(3-2*p),x=W/2+(f.x-W/2)*ease;
  const y=H-31+(f.y-(H-31))*ease-Math.sin(Math.PI*p)*82;
  ctx.save();ellipse(x+9,y+34,9*p+4,4*p+1,'#0b432a66');drawDart(x,y,f.team,-1.48+p*.48,1.2-p*.35);ctx.restore();
  if(p>=1){finishFlight(f);}
 }
 function drawParticles(){
  state.particles=state.particles.filter(q=>q.life>0);
  for(const q of state.particles){ctx.globalAlpha=clamp(q.life/55,0,1);ctx.fillStyle=q.color;ctx.save();ctx.translate(q.x,q.y);ctx.rotate(q.life/7);ctx.fillRect(-q.size/2,-q.size/2,q.size,q.size);ctx.restore();ctx.globalAlpha=1;q.x+=q.vx;q.y+=q.vy;q.vy+=.13;q.life--;}
 }
 function draw(now=0){
  clock=now;
  if(ranked&&!state.done){
   const left=Math.max(0,Math.ceil((ranked.limitMs-(now-rankedStart))/1000));
   $('yard-clock').textContent=Math.floor(left/60)+':'+String(left%60).padStart(2,'0');
   if(left===0&&!state.flight)end();
  }
  ctx.clearRect(0,0,W,H);
  drawBackground(now);drawTarget(now);
  for(const dart of state.darts){
   drawDart(dart.x,dart.y,dart.team,-1.02,.85);
   if(dart.points===5){ctx.strokeStyle='#fff6a2b0';ctx.lineWidth=2;ctx.beginPath();ctx.arc(dart.x,dart.y,10+Math.sin(now*.007)*2,0,TAU);ctx.stroke();}
  }
  drawReticle(now);drawForeground();drawFlight(now);drawParticles();
  requestAnimationFrame(draw);
 }
 function pointerPos(ev){const box=canvas.getBoundingClientRect();return {x:(ev.clientX-box.left)/box.width*W,y:(ev.clientY-box.top)/box.height*H};}
 function aimAt(ev){const p=pointerPos(ev);state.aim={x:clamp(p.x,34,W-34),y:clamp(p.y,115,380)};}
 canvas.addEventListener('pointerdown',ev=>{
  if((mode==='daily'&&!ranked)||state.busy||state.done||(mode==='cpu'&&state.player===1))return;
  ev.preventDefault();dragging=true;hovering=true;canvas.setPointerCapture(ev.pointerId);aimAt(ev);playTone(380,.025,'sine',.025);
 });
 canvas.addEventListener('pointermove',ev=>{if(!dragging)return;ev.preventDefault();aimAt(ev);});
 canvas.addEventListener('pointerup',ev=>{if(!dragging)return;ev.preventDefault();aimAt(ev);dragging=false;throwDart();});
 canvas.addEventListener('pointercancel',()=>{dragging=false;});
 window.addEventListener('keydown',ev=>{
  if($('helpOverlay').classList.contains('open')||$('endOverlay').classList.contains('open')){if(ev.key==='Escape')$('helpOverlay').classList.remove('open');return;}
  if(ev.target.closest?.('input,select,textarea,a,dialog'))return;
  if(!state||state.busy||state.done||(mode==='cpu'&&state.player===1))return;
  const dirs={ArrowLeft:[-8,0],ArrowRight:[8,0],ArrowUp:[0,-8],ArrowDown:[0,8],a:[-8,0],d:[8,0],w:[0,-8],s:[0,8]};
  if(dirs[ev.key]){ev.preventDefault();const [dx,dy]=dirs[ev.key];state.aim={x:clamp(state.aim.x+dx,34,W-34),y:clamp(state.aim.y+dy,115,380)};}
  else if(ev.key===' '&&ev.target.tagName!=='BUTTON'){ev.preventDefault();throwDart();}
 });
 $('throw').addEventListener('click',()=>throwDart());$('new').addEventListener('click',()=>begin());
 for(const m of modes)$(m).addEventListener('click',()=>begin(m));
 $('help').addEventListener('click',()=>{$('helpOverlay').classList.add('open');$('closeHelp').focus();});
 $('closeHelp').addEventListener('click',()=>{$('helpOverlay').classList.remove('open');$('throw').focus();});
 $('again').addEventListener('click',()=>begin());
 $('changeMode').addEventListener('click',()=>{begin('solo');});
 for(const id of ['helpOverlay','endOverlay'])$(id).addEventListener('click',ev=>{if(ev.target.id===id&&id==='helpOverlay')$(id).classList.remove('open');});
 $('windToggle').addEventListener('change',()=>{if(mode!=='daily'&&mode!=='practice'&&state&&!state.busy){state.wind=$('windToggle').checked?Math.round(rand(-32,32))/10:0;updateHud();}});
 $('calm').addEventListener('change',()=>document.body.classList.toggle('calm',$('calm').checked));
 $('copyScore').addEventListener('click',()=>{const message=`YARD DARTS — THE GAME | ${mode.toUpperCase()} | ${state.scores[0]}${(mode==='solo'||mode==='daily'||mode==='practice')?'':` - ${state.scores[1]}`} | Personal best: ${best} | Digital only — don't play this for real.`; if(navigator.clipboard?.writeText)navigator.clipboard.writeText(message).then(()=>announce('SCORE COPIED!')).catch(()=>window.prompt('Copy score:',message));else window.prompt('Copy score:',message);});
 $('resetBest').addEventListener('click',()=>{if(window.confirm('Reset your personal-best score on this device?')){best=0;safeWrite('yardDartsBest',0);updateHud();announce('BEST RESET');}});
 $('hardwareHelp').addEventListener('click',()=>{window.alert('SAFE CONTROLLERS ONLY: phone touchscreen, keyboard, mouse, gamepad mapped to keyboard, or USB/Bluetooth accessibility switches. No physical dart, launcher, sharp point, or projectile is needed.');});
 $('sound').addEventListener('click',()=>{soundOn=!soundOn;$('sound').textContent=soundOn?'♫ SOUND ON':'♪ SOUND OFF';$('sound').setAttribute('aria-pressed',String(soundOn));playTone(650,.12);});
 window.addEventListener('beforeinstallprompt',ev=>{ev.preventDefault();deferredInstall=ev;$('install').hidden=false;});
 $('install').addEventListener('click',async()=>{if(!deferredInstall)return;const prompt=deferredInstall;deferredInstall=null;$('install').hidden=true;await prompt.prompt();});
 if('serviceWorker' in navigator&&location.protocol.startsWith('http'))navigator.serviceWorker.register('/sw.js').catch(()=>{});
 $('yard-start').onclick=startRanked;
 $('yard-submit').onclick=submitRanked;
 $('yard-board-open').onclick=openBoard;
 $('yard-board-close').onclick=()=>$('yard-board').close();
 $('yard-share').onclick=shareChallenge;
 $('yard-alias').value=safeRead('yardDartsAlias','');
 begin(challengeScore===null?'cpu':'daily');requestAnimationFrame(draw);
})();
