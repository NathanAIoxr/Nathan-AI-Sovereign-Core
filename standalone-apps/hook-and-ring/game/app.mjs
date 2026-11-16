import { STEP, MODES, SKINS, DAILY_MS, DAILY_SHOTS, TRICKS, trickResult, defaultThrow, clamp, normalizeThrow, heldPoint,
  createShot, advanceShot, freshMatch, recordShot, breezeFor, dayKey } from './physics.mjs';
import { OneEuro, guardedRelease, inBezel, CSS_MM } from './input.mjs';
import { createScene } from './render.mjs?v=3';
import { GIFT_RINGS, BOARDS, rewardState, playRewards, rankReward, buyBoard, awardReward } from './rewards.mjs';
import { throwBreakState, countThrow, settleThrowBreak, acknowledgeBreak, THANKS_COINS, HOUSE_GIFT_COINS } from './throw-breaks.mjs';
import { NATHAN_NAME, LEVELS, opponentSettings, opponentToss, opponentLine, OPPONENT_MODES } from './opponent.mjs';
import { winsWildCard } from './arcade-progress.mjs?v=9';

const $ = id => document.getElementById(id);
const canvas = $('scene');
const scene = createScene(canvas);
const key = 'nathan-hook-ring-v1';
const saved = (() => {try {return JSON.parse(localStorage.getItem(key)) ?? {};}catch {return {};}})();
const profile = { catches:0, skin:0, flat:false, sound:false, haptic:true, scale:1, adaptive:true,
  grip:1, control:'touch', last:null, ...saved };
profile.rewards=rewardState(profile.rewards);
profile.throwBreak=throwBreakState(profile.throwBreak);
profile.opponent=opponentSettings(profile.opponent);
function persist() { try {localStorage.setItem(key,JSON.stringify(profile));}catch {} }
let match = freshMatch('practice'), versus = false, phase = 'ready';
let sessionEnded=false;
let opponent=null, opponentSeed='', aiAt=0, playerAttempts=0, playedLine='';
const aiTurn=()=>Boolean(opponent&&match.player===1&&!match.ended);
let throwSetup = {...defaultThrow}, shot, lastShot, replaying = false, showUntil = 0, audio;
lastShot = profile.last;
let daily, pendingShot, finishAfterShot = false, dailyMessage = '', breezeAt = 0, wind = 0, windName = '';
let pendingGrip, tilt = { x:0,y:0, latest:null, zero:null, active:false, filters:[new OneEuro(1.8),new OneEuro(1.8)] };
const preferences = ['sound','flat','haptic','adaptive'];
const labelByPhase = {ready:'Ready to swing',held:'Ring in hand',swing:'Ring in motion',result:'Toss complete',ended:'Round complete'};
const linkParams = new URLSearchParams(location.search);
const challenge = linkParams.get('target');
const challengeDay = linkParams.get('day');
const challengeTarget = /^\d+$/.test(challenge ?? '') && Number(challenge)<=DAILY_SHOTS ? Number(challenge) : null;

function renderRewards() {
  const state=profile.rewards;
  $('reward-balance').textContent=state.coins+' Coins';
  $('reward-days').textContent='Play days: '+state.days+'. Coins unlock boards.';
  const buttonFor=(name,active,action)=>{
    const button=document.createElement('button');
    button.type='button';button.textContent=name;
    button.setAttribute('aria-pressed',String(active));
    button.onclick=action;
    return button;
  };
  const rings=GIFT_RINGS.filter(ring=>state.unlocks.includes(ring.id));
  $('gift-rings').replaceChildren(...rings.map(ring=>buttonFor(ring.name,state.ring===ring.id,()=>{
    profile.rewards={...profile.rewards,ring:ring.id};persist();layoutSkins();renderRewards();draw();
  })));
  if(!rings.length) $('gift-rings').textContent='Your gift rings will appear here.';
  $('gift-boards').replaceChildren(...BOARDS.map(board=>{
    const owned=state.boards.includes(board.id);
    const label=owned?board.name:board.name+' · Unlock for '+board.price+' Coins';
    const button=buttonFor(label,state.board===board.id,()=>{
      const selected=profile.rewards;
      profile.rewards=owned?{...selected,board:board.id}:buyBoard(selected,board.id);
      persist();renderRewards();draw();
    });
    button.disabled=!owned&&state.coins<board.price;
    return button;
  }));
  $('gift-history').replaceChildren(...state.history.slice(0,15).map(gift=>{
    const row=document.createElement('li');
    const ring=GIFT_RINGS.find(item=>item.id===gift.ring);
    row.textContent=gift.name+' · '+gift.coins+' Coins'+(ring?' + '+ring.name:'');
    return row;
  }));
  if(!state.history.length) {
    const row=document.createElement('li');
    row.textContent='Play a round to start earning rewards.';
    $('gift-history').append(row);
  }
}
let giftToastTimer;
function showGifts(notices) {
  if(!notices.length) return;
  const coins=notices.reduce((total,gift)=>total+gift.coins,0);
  const rings=notices.map(gift=>GIFT_RINGS.find(ring=>ring.id===gift.ring)?.name).filter(Boolean);
  $('gift-title').textContent=notices.length===1?notices[0].name:'A gift for you';
  $('gift-detail').textContent=coins+' Coins'+(rings.length?' + '+rings.join(', '):'')+' added to your rewards.';
  $('gift-card').hidden=false;
  showBanner($('gift-title').textContent,$('gift-detail').textContent);
}
function showBanner(title,detail) {
  $('gift-toast').querySelector('strong').textContent=title;
  $('gift-toast-detail').textContent=detail;
  $('gift-toast').hidden=false;
  clearTimeout(giftToastTimer);
  giftToastTimer=setTimeout(()=>{ $('gift-toast').hidden=true; },4500);
}
function settleBreak(boundary) {
  const resolution=settleThrowBreak(profile.throwBreak,boundary);
  if(!resolution.gifts.length&&resolution.slot===null) return;
  profile.throwBreak=resolution.state;
  const day=dayKey();
  const gifts=[];
  for(const milestone of resolution.gifts) {
    profile.rewards=awardReward(profile.rewards,day,'throw-gift:'+milestone,
      {name:'On the House',coins:HOUSE_GIFT_COINS,surprise:true},gifts);
  }
  const giftCoins=gifts.reduce((total,gift)=>total+gift.coins,0);
  let title='On the House', amount=giftCoins;
  if(!giftCoins&&resolution.slot!==null){
    // This web build uses a house thank-you at the queued slot.
    // A future ad provider should acknowledge only after displaying an ad.
    profile.throwBreak=acknowledgeBreak(profile.throwBreak,resolution.slot);
    title='Thanks for hanging out'; amount=THANKS_COINS;
    profile.rewards=awardReward(profile.rewards,day,'throw-break:'+resolution.slot,{name:title,coins:amount},[]);
  }
  if(!amount) return;
  persist(); renderRewards();
  $('break-title').textContent=title;
  $('break-detail').textContent='+'+amount+' Coins added to your rewards.';
  $('break-card').hidden=false;
  showBanner(title,$('break-detail').textContent);
}
$('dismiss-break').onclick=()=>{ $('break-card').hidden=true; };
function openRewards() { renderRewards(); $('rewards').showModal(); }
$('open-rewards').onclick=openRewards;
$('view-gift').onclick=openRewards;
$('dismiss-gift').onclick=()=>{ $('gift-card').hidden=true; $('gift-toast').hidden=true; };

function layoutSkins() {
  $('skins').replaceChildren(...SKINS.map((skin,index)=>{
    const button=document.createElement('button');
    button.type='button';
    button.disabled=profile.catches<skin.catches;
    button.setAttribute('aria-pressed',String(!profile.rewards.ring&&profile.skin===index));
    button.title=button.disabled?`${skin.catches} total catches to unlock`:skin.name;
    const ring=document.createElement('b');
    ring.style.setProperty('--ring',skin.color);
    button.append(ring,skin.name);
    button.onclick=()=>{profile.skin=index;profile.rewards={...profile.rewards,ring:null};persist();layoutSkins();draw();};
    return button;
  }));
  const earned=SKINS.filter(skin=>profile.catches>=skin.catches);
  const next=SKINS[earned.length];
  $('unlocked').textContent=`${earned.length} / ${SKINS.length}`;
  $('progress-caption').textContent=next?`${next.catches-profile.catches} catches to unlock ${next.name}`:'All rings unlocked';
  $('progress').max=next?.catches??35;
  $('progress').value=Math.min(profile.catches,$('progress').max);
}
function updateSliders() {
  $('aim').value=Math.round(throwSetup.aim*100);
  $('pull').value=Math.round(throwSetup.pull*100);
  $('aim-value').textContent=throwSetup.aim===0?'Center':`${Math.round(Math.abs(throwSetup.aim)*100)}% ${throwSetup.aim<0?'left':'right'}`;
  $('pull-value').textContent=`${Math.round(throwSetup.pull*100)}%`;
}
function cue(message) { $('cue').textContent=message; }
function setPhase(next) {
  phase=next;
  $('arena').dataset.phase=next;
  $('phase-label').textContent=replaying?'Replay':labelByPhase[next];
}
function feedback(message, outcome) {
  $('feedback').hidden=!message;
  $('feedback').textContent=message;
  $('feedback').dataset.outcome=outcome ?? '';
  if(message) $('announce').textContent=message;
}
function modeMessage() {
  if(sessionEnded) return 'Session complete. Start another when you are ready.';
  if(match.mode==='daily') return dailyMessage || (challengeTarget!==null?`Challenge target: ${challengeTarget} catches${challengeDay&&challengeDay!==dayKey()?' (from '+challengeDay+')':''}.`:'10 tosses. Same breeze for every player today.');
  if(match.ended && match.winner!==null && opponent) return match.winner===0?(winsWildCard(opponent,match)?'You win. PK Wild Card earned.':'You win.'):opponent.name+' wins.';
  if(match.ended && match.winner!==null) return versus?`Player ${match.winner+1} wins.`:'Round won. Reset to play again.';
  if(match.ended && match.mode==='trick') return `Trick round complete. ${match.scores[0]} of ${TRICKS.length} cleared.`;
  if(match.ended) return `Streak ended at ${match.scores[0]}.`;
  if(opponent) return aiTurn()?opponent.name+' to toss.':'Your toss · '+LEVELS[opponent.level];
  if(versus) return `Player ${match.player+1} to toss.`;
  if(match.mode==='trick'){ const trick=TRICKS[match.attempts]; return trick.label+' · '+trick.tip; }
  if(match.mode==='breeze') return 'Watch the breeze before each toss.';
  if(match.mode==='streak') return 'Keep the streak alive. One miss ends the round.';
  return 'Set your aim and swing.';
}
function updateScore() {
  const caught=opponent?match.scores[0]:match.scores[0]+match.scores[1];
  const attempts=opponent?playerAttempts:match.attempts;
  $('catches').textContent=caught;
  $('p1').textContent=match.scores[0]; $('p2').textContent=match.scores[1];
  $('throws').textContent=attempts;
  $('accuracy').textContent=attempts?Math.round(caught/attempts*100)+'%':'—';
  $('mode-tag').textContent=MODES[match.mode];
  $('p1-name').textContent=opponent?'You':'Player 1';
  $('p2-name').textContent=opponent?opponent.name:'Player 2';
  $('play-opponent').hidden=Boolean(daily?.active);
  $('play-opponent').textContent=opponent?'AI settings':'Play AI';
  $('leave-opponent').hidden=!opponent;
  $('opponent-banter').hidden=!playedLine;
  $('opponent-banter').textContent=playedLine;
  $('match-status').textContent=modeMessage();
  $('solo-score').hidden=versus; $('versus-score').hidden=!versus;
  $('ladder').hidden=match.mode!=='ladder';
  [...$('ladder').children].forEach((node,index)=>node.classList.toggle('active',index===match.ladder+3));
  $('players').hidden=Boolean(opponent)||['daily','streak','breeze','trick'].includes(match.mode);
  $('players').textContent=versus?'Switch to solo':'Play local versus';
  $('daily-controls').hidden=match.mode!=='daily';
  $('start-daily').disabled=Boolean(daily?.active);
  $('start-daily').textContent=daily?.active?'Ranked round in progress':daily?.results?'Start another round':'Start ranked round';
  $('share').disabled=!daily?.results;
  $('reset').disabled=Boolean(daily?.active);
  $('reset').textContent=match.ended&&match.mode!=='daily'?'Next round':'Reset';
  const openSession=['practice','breeze'].includes(match.mode)&&!match.ended;
  $('end-session').hidden=!openSession;
  $('end-session').disabled=phase!=='ready'||match.attempts===0;
  $('export-replay').disabled=!lastShot;
  $('replay').disabled=!lastShot||['swing','held','result'].includes(phase)||Boolean(daily?.active)||aiTurn();
  for(const id of ['aim','pull']) $(id).disabled=aiTurn();
  $('launch').disabled=phase!=='ready'||aiTurn()||(match.mode==='daily'&&!daily?.active)||performance.now()<breezeAt;
}
function draw() {
  const display=profile.control==='hybrid'?aimWithTilt(throwSetup):throwSetup;
  const ring=GIFT_RINGS.find(item=>item.id===profile.rewards.ring)??SKINS[profile.skin]??SKINS[0];
  const board=BOARDS.find(item=>item.id===profile.rewards.board)??BOARDS[0];
  scene.draw({point:shot?.p??heldPoint(display),phase,color:ring.color,board,
    flat:profile.flat,guide:match.mode==='practice'&&['ready','held'].includes(phase)});
}
function prepareShot() {
  shot=null;pendingShot=null;
  throwSetup={...defaultThrow,pull:match.mode==='practice'?defaultThrow.pull:.44};
  setPhase(match.ended?'ended':'ready');
  updateSliders();
  const trick=match.mode==='trick'&&!match.ended?TRICKS[match.attempts]:null;
  const useWind=match.mode==='breeze'||Boolean(trick?.wind)||(match.mode==='daily'&&daily?.active);
  if(useWind&&!match.ended){
    const breeze=trick?{lateral:trick.wind,direction:trick.wind<0?'left':'right'}:breezeFor(daily?.seed??dayKey(),match.attempts);
    wind=breeze.lateral; windName=breeze.direction;
    breezeAt=performance.now()+1500;
    cue(`Breeze pushing ${windName}. Get ready.`);
  }else{
    wind=0;breezeAt=0;
    cue(match.ended?'Reset to play again.':match.mode==='daily'&&!daily?.active?'Start a ranked round.':'Grab the ring, pull back, then release.');
  }
  aiAt=aiTurn()?performance.now()+850:0;
  if(aiAt) cue(opponent.name+' is lining up a toss.');
  updateScore();draw();
}
function resetRound(mode=match.mode, two=versus, bot=opponent) {
  if(match.ended&&phase==='result'&&!replaying) settleBreak('match-ended');
  sessionEnded=false;
  pendingGrip=null; daily=null; dailyMessage='';finishAfterShot=false;replaying=false;
  opponent=bot; opponentSeed=String(Math.random());
  playerAttempts=0; aiAt=0; playedLine='';
  versus=Boolean(opponent)||two;match=freshMatch(mode);
  $('mode').value=mode;
  $('mode').disabled=false;
  if(['daily','streak','breeze','trick'].includes(mode)) versus=false;
  $('clock').textContent='2:00';
  feedback('');prepareShot();
}

function soundFor(outcome) {
  if(profile.haptic && navigator.vibrate) navigator.vibrate(outcome==='catch'?[25,30,35]:16);
  if(!profile.sound||!audio) return;
  const now=audio.currentTime;
  const notes=outcome==='catch'?[660,880,1175]:outcome==='rim'?[490,350]:[210];
  for(const [i,note] of notes.entries()){
    const oscillator=audio.createOscillator(),gain=audio.createGain(),time=now+i*.085;
    oscillator.type=outcome==='catch'?'sine':'triangle';oscillator.frequency.value=note;
    gain.gain.setValueAtTime(.001,time);
    gain.gain.exponentialRampToValueAtTime(.125,time+.02);
    gain.gain.exponentialRampToValueAtTime(.001,time+.18);
    oscillator.connect(gain).connect(audio.destination);oscillator.start(time);oscillator.stop(time+.19);
  }
}
function activateAudio() {
  if(!profile.sound) return;
  try { audio ??= new (window.AudioContext||window.webkitAudioContext)(); audio.resume().catch(()=>{}); }catch {}
}
function aimWithTilt(setup) {
  if(profile.control==='touch'||!tilt.active) return setup;
  if(profile.control==='tilt') return {...setup,aim:clamp(tilt.x/31,-1,1)};
  return {...setup,aim:clamp(setup.aim+tilt.x/48,-1,1),flick:clamp(setup.flick+tilt.y/95,-1,1)};
}
function startSwing(setup=throwSetup, replay=null, computer=false) {
  if(!replay&&aiTurn()!==computer) return false;
  if(!replay && (!['ready','held'].includes(phase)||performance.now()<breezeAt||(match.mode==='daily'&&!daily?.active))) return false;
  if(!replay && daily?.active && performance.now()>=daily.deadline){endDaily();return false;}
  activateAudio();
  const raw=replay?.throw ?? normalizeThrow(computer?setup:aimWithTilt(setup));
  const appliedWind=replay?.wind ?? wind;
  shot=createShot(raw,appliedWind);
  if(!replay) pendingShot={throw:raw,wind:appliedWind,computer,...(daily?.active?{releasedMs:Math.round(performance.now()-daily.started)}:{})};
  accumulator=0;
  replaying=Boolean(replay);
  feedback('');
  setPhase('swing');
  cue(replaying?'Playing your last toss.':computer?opponent.name+' sent the ring.':'Watch the ring approach the hook.');
  updateScore();
  return true;
}
function endDaily() {
  if(!daily?.active) return;
  daily.active=false;
  $('mode').disabled=false;
  daily.results=true;
  if(daily.shots.length===DAILY_SHOTS){profile.rewards=rankReward(profile.rewards);persist();renderRewards();}
  if(finishAfterShot || match.attempts<DAILY_SHOTS) $('clock').textContent='0:00';
  dailyMessage=`Round complete. ${match.scores[0]} of ${match.attempts} caught.`;
  match={...match,ended:true};
  if(phase!=='result'){setPhase('ended');settleBreak('match-ended');}
  updateScore();
}
function score(result) {
  const raw=result;
  if(!replaying && match.mode==='trick') result=trickResult(result,match.attempts);
  if(replaying && lastShot?.trick!==undefined) result=trickResult(result,lastShot.trick);
  setPhase('result');
  feedback(result.detail,result.outcome);
  const speed=raw.speed?' · '+(raw.speed/1000).toFixed(2)+' m/s':'';
  cue(`Reach ${(result.depth/1000).toFixed(2)} m · Off-center ${Math.abs(result.lateral)} mm${speed}`);
  soundFor(result.outcome);
  if(!replaying){
    const counted=pendingShot;
    if(daily?.active) daily.shots.push({...counted.throw,releasedMs:counted.releasedMs});
    const attempt=match.attempts;
    match=recordShot(match,result.outcome,versus);
    if(opponent){
      const line=opponentLine(opponent,match,match.ended);
      if(line) playedLine=line;
    }
    if(winsWildCard(opponent,match)&&!profile.pkWildCard){
      profile.pkWildCard=true;
      persist();
    }
    if(!counted.computer){
      if(opponent) playerAttempts++;
      profile.throwBreak=countThrow(profile.throwBreak);
      lastShot={throw:counted.throw,wind:counted.wind,result,...(match.mode==='trick'?{trick:attempt}:{})};
      profile.last=lastShot;
      if(result.outcome==='catch'){profile.catches++;layoutSkins();}
      const rewards=playRewards(profile.rewards,{mode:match.mode,outcome:result.outcome,ended:match.ended,versus,localCompleted:match.ended&&versus&&!opponent});
      profile.rewards=rewards.state;
      persist();
      renderRewards();
      showGifts(rewards.notices);
    }
    if(daily?.active&&(match.ended||finishAfterShot)) endDaily();
  }
  showUntil=performance.now()+850;
  updateScore();
}
let lastTime=0,accumulator=0, drawNeeded=true;
function frame(now) {
  if(daily?.active){
    const left=Math.max(0,Math.ceil((daily.deadline-now)/1000));
    $('clock').textContent=`${Math.floor(left/60)}:${String(left%60).padStart(2,'0')}`;
    if(!left && phase==='swing') finishAfterShot=true;
    else if(!left){pendingGrip=null;endDaily();cue('Open the leaderboard to post your score.');}
  }
  if(breezeAt && now>=breezeAt && phase==='ready'){
    breezeAt=0;cue(`Breeze pushing ${windName}. Swing when ready.`);updateScore();
  }
  if(aiAt&&now>=aiAt&&phase==='ready'&&aiTurn()&&!document.querySelector('dialog[open]')){
    aiAt=0;startSwing(opponentToss(opponent,match,opponentSeed),null,true);
  }
  if(phase==='swing'){
    accumulator+=Math.min(0.06,(now-lastTime)/1000);
    while(accumulator>=STEP && !shot.result){accumulator-=STEP;advanceShot(shot);}
    if(shot.result) score(shot.result);
    drawNeeded=true;
  }else if(phase==='result'&&now>=showUntil){
    if(!replaying&&match.ended) settleBreak('match-ended');
    replaying=false;
    feedback('');
    prepareShot();
    if(daily?.results) cue('Open the leaderboard to post your score.');
  }
  if(drawNeeded){draw();drawNeeded=false;}
  lastTime=now;
  requestAnimationFrame(frame);
}

function coords(event) {
  const box=canvas.getBoundingClientRect();
  return {x:event.clientX-box.left,y:event.clientY-box.top,t:event.timeStamp,w:box.width,h:box.height};
}
function gripPoint(grip,time) {
  const points=[...grip.contacts.values()];
  return {x:points.reduce((sum,p)=>sum+p.x,0)/points.length,y:points.reduce((sum,p)=>sum+p.y,0)/points.length,t:time};
}
function trackGrip(grip,t) {
  const p=gripPoint(grip,t);
  const sample={x:grip.fx.sample(p.x,t),y:grip.fy.sample(p.y,t),t};
  grip.history.push(sample);
  while(grip.history.length>2 && grip.history[1].t<t-240) grip.history.shift();
  return sample;
}
function pointerSetup(grip,p) {
  const density=CSS_MM*profile.scale;
  const sensitivity=profile.adaptive?profile.grip:1;
  const dx=(p.x-grip.origin.x)/density;
  const dy=(p.y-grip.origin.y)/density;
  return {aim:clamp(grip.base.aim-dx*.037,-1,1),pull:clamp(grip.base.pull+dy*.023*sensitivity,0,1),flick:0};
}
canvas.addEventListener('pointerdown',event=>{
  const p=coords(event);
  if(event.button>0||aiTurn()||inBezel(p.x,p.y,p.w,p.h)) return;
  if(phase==='ready'){
    if((match.mode==='daily'&&!daily?.active)||p.t<breezeAt||!scene.hit(heldPoint(profile.control==='hybrid'?aimWithTilt(throwSetup):throwSetup),p.x,p.y)) return;
    pendingGrip={base:{...throwSetup},contacts:new Map(),history:[],fx:new OneEuro(),fy:new OneEuro(),maxTravel:0};
    setPhase('held');updateScore();
  }
  if(phase!=='held'||!pendingGrip||pendingGrip.contacts.size===3) return;
  event.preventDefault();
  const grip=pendingGrip;
  grip.base={...throwSetup};
  grip.contacts.set(event.pointerId,p);
  grip.origin=gripPoint(grip,p.t);
  grip.fx=new OneEuro();grip.fy=new OneEuro();grip.history=[];
  trackGrip(grip,p.t);
  canvas.setPointerCapture(event.pointerId);
  cue('Pull back to load the swing. Move left or right to aim.');
  drawNeeded=true;
});
canvas.addEventListener('pointermove',event=>{
  const grip=pendingGrip;
  if(!grip?.contacts.has(event.pointerId)) return;
  const events=event.getCoalescedEvents?.();
  for(const movement of events?.length?events:[event]){
    const p=coords(movement);
    grip.contacts.set(event.pointerId,p);
    const sample=trackGrip(grip,p.t);
    grip.maxTravel=Math.max(grip.maxTravel,Math.abs(sample.y-grip.origin.y));
    throwSetup=pointerSetup(grip,sample);
  }
  updateSliders();drawNeeded=true;
});
function cancelGrip() {
  if(!pendingGrip) return;
  pendingGrip=null;
  setPhase('ready');cue('Grip canceled. Grab the ring to try again.');updateScore();drawNeeded=true;
}
canvas.addEventListener('pointercancel',cancelGrip);
canvas.addEventListener('pointerup',event=>{
  const grip=pendingGrip;
  if(!grip?.contacts.has(event.pointerId)) return;
  const p=coords(event);
  if(inBezel(p.x,p.y,p.w,p.h)){ cancelGrip();return; }
  const sampled=guardedRelease(grip.history,p.t);
  grip.contacts.delete(event.pointerId);
  if(grip.contacts.size && phase==='held'){
    grip.base={...throwSetup};grip.origin=gripPoint(grip,p.t);
    grip.fx=new OneEuro();grip.fy=new OneEuro();grip.history=[];
    trackGrip(grip,p.t);
    return;
  }
  const setup=sampled?pointerSetup(grip,sampled):throwSetup;
  setup.flick=clamp(-(sampled?.velocityY??0)/(CSS_MM*profile.scale)*2.0,-1,1);
  pendingGrip=null;
  if(grip.maxTravel>15 && profile.adaptive){
    const normalized=grip.maxTravel/(CSS_MM*profile.scale);
    profile.grip=clamp(profile.grip*.92+clamp(16/normalized,.75,1.3)*.08,.78,1.24);
    persist();
  }
  if(!startSwing(setup) && phase==='held') prepareShot();
});
canvas.addEventListener('lostpointercapture',event=>{if(pendingGrip?.contacts.has(event.pointerId)) cancelGrip();});
new ResizeObserver(()=>{drawNeeded=true;}).observe(canvas);
window.addEventListener('orientationchange',()=>{tilt.zero=null;cancelGrip();});

function sensor(event) {
  if(!Number.isFinite(event.beta)||!Number.isFinite(event.gamma)) return;
  const angle=screen.orientation?.angle??window.orientation??0;
  const oriented=Math.abs(angle)===90?[event.beta*Math.sign(angle),-event.gamma*Math.sign(angle)]:[event.gamma,event.beta];
  tilt.latest=oriented;
  tilt.zero??=oriented;
  tilt.x=tilt.filters[0].sample(oriented[0]-tilt.zero[0],event.timeStamp);
  tilt.y=tilt.filters[1].sample(oriented[1]-tilt.zero[1],event.timeStamp);
  tilt.active=true;
  if(profile.control!=='touch'&&phase==='ready'){
    if(profile.control==='tilt') { throwSetup={...throwSetup,aim:clamp(tilt.x/31,-1,1)}; updateSliders(); }
    drawNeeded=true;
  }
  if($('settings').open) $('motion-note').textContent='Tilt connected. Keep the phone in your hands.';
}
async function enableMotion(request) {
  if(!window.DeviceOrientationEvent){$('motion-note').textContent='Tilt is unavailable here. Touch and sliders still work.';return;}
  try{
    if(typeof DeviceOrientationEvent.requestPermission==='function'){
      if(!request||await DeviceOrientationEvent.requestPermission()!=='granted') throw Error('permission');
    }
    window.addEventListener('deviceorientation',sensor);
    $('motion-note').textContent='Move the phone to check tilt. Touch and sliders are also available.';
  }catch{$('motion-note').textContent='Tilt permission is off. Select a motion control again to enable it.';}
}
$('controls').addEventListener('change',()=>{
  profile.control=$('controls').value;persist();
  if(profile.control!=='touch') enableMotion(true);
  else $('motion-note').textContent='Touch or use the aim and pull sliders.';
});
$('zero-motion').onclick=()=>{tilt.zero=tilt.latest;tilt.x=0;tilt.y=0;tilt.filters=[new OneEuro(1.8),new OneEuro(1.8)];if(!tilt.active)enableMotion(true);};
function setScale(value) {
  profile.scale=clamp(value,.65,1.7);
  $('scale').value=profile.scale;
  $('scale-value').textContent=profile.scale.toFixed(2)+'×';
  persist();
}
$('scale').oninput=()=>setScale(Number($('scale').value));
$('apply-scale').onclick=()=>{
  const mm=$('calibration').valueAsNumber;
  if(mm<10||mm>120||!Number.isFinite(mm)){ $('calibration').reportValidity(); return; }
  setScale($('ruler').getBoundingClientRect().width/mm/CSS_MM);
};
$('reset-scale').onclick=()=>{profile.grip=1;$('calibration').value='';setScale(1);};
for(const pref of preferences){
  const button=$(pref==='flat'?'view':pref);
  function renderPreference(){
    if(pref==='flat'||pref==='sound'){
      button.setAttribute('aria-pressed',String(profile[pref]));
      button.textContent=pref==='flat'?(profile.flat?'3D view':'2D view'):(profile.sound?'Sound on':'Sound off');
    }else button.checked=profile[pref];
  }
  renderPreference();
  button.addEventListener('click',()=>{
    profile[pref]=!profile[pref];renderPreference();persist();drawNeeded=true;
    if(pref==='sound') activateAudio();
  });
}
for(const target of ['aim','pull']) $(target).oninput=()=>{
  throwSetup={...throwSetup,[target]:Number($(target).value)/100};
  updateSliders();drawNeeded=true;
};
$('mode').onchange=()=>{
  const mode=$('mode').value;
  if(opponent&&OPPONENT_MODES.includes(mode)){
    profile.opponent={...profile.opponent,mode};persist();
    resetRound(mode,true,profile.opponent);
  }else resetRound(mode,false,null);
};
$('players').onclick=()=>resetRound(match.mode,!versus,null);
$('leave-opponent').onclick=()=>resetRound('practice',false,null);
$('reset').onclick=()=>resetRound();
$('end-session').onclick=()=>{
  if(phase!=='ready'||match.ended||!match.attempts||!['practice','breeze'].includes(match.mode)) return;
  sessionEnded=true;
  match={...match,ended:true};
  setPhase('ended');
  cue('Session complete.');
  settleBreak('session-ended');
  updateScore();draw();
};
$('launch').onclick=()=>startSwing();
$('replay').onclick=()=>{if(lastShot) startSwing(throwSetup,lastShot);};
$('export-replay').onclick=()=>{
  if(!lastShot) return;
  const file=new Blob([JSON.stringify({game:'Hook & Ring by Nathan Tabor',cartridge:'TACTILECORE-C01-HOOK-RING',version:1,...lastShot},null,2)],{type:'application/json'});
  const url=URL.createObjectURL(file), anchor=document.createElement('a');
  anchor.href=url;anchor.download='hook-and-ring-replay.json';
  anchor.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
};
window.addEventListener('keydown',event=>{
  if(event.code==='Space'&&event.target===document.body&&!document.querySelector('dialog[open]')){
    event.preventDefault();startSwing();
  }
});
const levelHints={
  warmup:'More misses and time to find your rhythm.',
  steady:'A steady opponent who lands plenty of catches.',
  sharp:'Accurate from the opening toss.',
  full:'Your opponent may give you an early lead, then turn it all the way up.',
};
function updateOpponentForm() {
  const isNathan=($('opponent-name').value.trim()||NATHAN_NAME)===NATHAN_NAME;
  const level=$('opponent-level').value;
  $('opponent-hint').textContent=level==='full'&&isNathan?
    'PK .. that’s the wild card .. that boy ain’t rite. He might let you think you’re winning 🥇 … 🤣':levelHints[level];
  $('opponent-bio').hidden=!isNathan;
}
$('play-opponent').onclick=()=>{
  $('opponent-name').value=profile.opponent.name;
  $('opponent-level').value=profile.opponent.level;
  $('opponent-mode').value=profile.opponent.mode;
  $('opponent-talk').checked=profile.opponent.banter;
  updateOpponentForm();
  $('opponent-settings').showModal();
};
$('opponent-level').onchange=updateOpponentForm;
$('opponent-name').oninput=updateOpponentForm;
$('opponent-form').onsubmit=event=>{
  event.preventDefault();
  profile.opponent=opponentSettings({name:$('opponent-name').value,level:$('opponent-level').value,
    mode:$('opponent-mode').value,banter:$('opponent-talk').checked});
  persist();
  $('opponent-settings').close();
  resetRound(profile.opponent.mode,true,profile.opponent);
};
$('open-settings').onclick=()=>$('settings').showModal();
for(const button of document.querySelectorAll('[data-close]')) button.onclick=()=>$(button.dataset.close).close();
async function api(path,payload) {
  const options=payload===undefined?{}:{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)};
  const response=await fetch('/api/'+path,options);
  const data=await response.json().catch(()=>({}));
  if(!response.ok) throw Error(data.error??'The tournament service is unavailable.');
  return data;
}
$('start-daily').onclick=async()=>{
  $('start-daily').disabled=true;
  dailyMessage='Connecting to today’s tournament…';$('match-status').textContent=dailyMessage;
  try{
    const config=await api('start',{});
    if(match.mode!=='daily') return;
    resetRound('daily');
    const start=performance.now();
    daily={...config,active:true,shots:[],started:start,deadline:start+DAILY_MS};
    $('mode').disabled=true;
    dailyMessage='Catch as many as you can in 10 tosses.';
    prepareShot();
  }catch(error){dailyMessage=error.message;updateScore();}
};
$('share').onclick=async()=>{
  const url=new URL(location.origin+'/');
  url.searchParams.set('target',String(match.scores[0]));
  url.searchParams.set('day',daily.day);
  try{
    if(navigator.share) await navigator.share({title:'Hook & Ring by Nathan Tabor',text:`Can you beat my ${match.scores[0]} catches?`,url:url.href});
    else await navigator.clipboard.writeText(url.href);
    dailyMessage='Challenge link ready.';updateScore();
  }catch(error){if(error.name!=='AbortError'){dailyMessage='Challenge link: '+url.href;updateScore();}}
};
function renderBoard(data) {
  const list=$('board-list');
  list.replaceChildren(...data.scores.map(entry=>{
    const li=document.createElement('li'),number=document.createElement('span');
    number.textContent=`${entry.score}/${DAILY_SHOTS} · ${(entry.durationMs/1000).toFixed(1)}s`;
    li.append(entry.alias,number); return li;
  }));
  $('board-status').textContent=data.scores.length?`${data.day} · Ranked by catches, then time`:'No scores posted today.';
}
$('board').onclick=async()=>{
  $('leaderboard').showModal();
  $('board-list').replaceChildren();
  $('board-status').textContent='Loading scores…';
  $('submit-score').hidden=!(daily?.results&&daily.shots.length&&!daily.posted);
  try{renderBoard(await api('board'));}catch(error){$('board-status').textContent=error.message;}
};
$('submit-score').onsubmit=async event=>{
  event.preventDefault();
  const button=event.currentTarget.querySelector('button');
  if(!daily?.results||daily.posted||button.disabled) return;
  button.disabled=true;
  try{
    const data=await api('submit',{token:daily.token,alias:$('alias').value,shots:daily.shots});
    daily.posted=true;
    $('submit-score').hidden=true;
    renderBoard(data);
    $('board-status').textContent=`Score posted: ${data.accepted}. `+$('board-status').textContent;
  }catch(error){$('board-status').textContent=error.message;}
  finally{button.disabled=false;}
};

$('controls').value=profile.control;
setScale(profile.scale);
if(profile.control!=='touch') enableMotion(false);
layoutSkins();
resetRound(challengeTarget!==null?'daily':'practice');
requestAnimationFrame(frame);
if('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(()=>{});
