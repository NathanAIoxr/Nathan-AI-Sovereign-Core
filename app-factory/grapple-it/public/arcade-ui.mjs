import {CAST,EXPEDITIONS,GEAR,REWARD,RULES,TIERS,WORDMARK} from './roster.mjs';
import {actionArcade,actor,assistNathan,cleanProgress,completeArcade,isNathanTurn,newArcade,scores,shotBoard,stepArcade,turn,unlockedTier} from './arcade-engine.mjs';

const at=id=>document.getElementById(id);
const storageKey='grapple-it-arcade-v1';
function saved(){
  try{return cleanProgress(JSON.parse(localStorage.getItem(storageKey))??{});}
  catch{return cleanProgress();}
}
let profile=saved(), state, mode='classic', visible=false, frame=0, last=0, processed=0, buttonsDirty=true;
const session={nathan:false};
const canvas=at('gr-gear-board'), ctx=canvas.getContext('2d');
let width=0,height=0,scoreboard;
const controls={
  action:at('gr-play'), gear:at('gr-gear'), mission:at('gr-mission'), form:at('gr-form'),
  notice:at('gr-notice'), ledger:at('gr-gear-ledger'), status:at('gr-current')
};
const modes={
  classic:['Gear Trials','Clear a trial in each tier to unlock the next tier. Three attempts per station.'],
  expedition:['Expeditions','Latch and retrieve at least two anchors, and reach the expedition’s score target. Expedition gear is supplied.'],
  coach:['Nathan AI 🚀 · Coach','Watch the release cue. A wider window gives you time to learn each gear mechanic.'],
  'nathan-full':['Nathan AI 🚀 · Full On','Clear 225 points on tighter, faster timing. A clear arms the Family Reunion challenge for your next completed run.'],
  'pk-wild':['PK 🐽 · Wild Card','The target moves between releases. Clear 170 points.'],
  'pk-chaos':['PK 🐽 · Full Chaos','The target shifts further and retrieval tension surges. Clear 210 points. Win immediately after Nathan Full On for Family Reunion.'],
  'solo-bracket':['Solo Bracket','You and Nathan AI 🚀 alternate two attempts per round. Three rounds decide the bracket.'],
  'team-bracket':['Local 2v2','Four players share this device. Grape 1, Apple 1, Grape 2, and Apple 2 throw in each of three rounds.'],
};
function element(tag,value){const node=document.createElement(tag);node.textContent=value;return node;}
function option(value,label){const node=element('option',label);node.value=value;return node;}
function persist(){
  try{localStorage.setItem(storageKey,JSON.stringify(profile));return true;}
  catch{return false;}
}
function drawLocker(){
  const opened=unlockedTier(profile), old=controls.gear.value;
  const groups=TIERS.map((tier,index)=>{
    const group=document.createElement('optgroup');group.label=tier.name;
    for(const item of tier.gear){
      const best=profile.records[item.id];
      const entry=option(item.id,item.name+(best?' · '+best:''));
      entry.disabled=index>opened;group.append(entry);
    }
    return group;
  });
  if(profile.reunion)groups.push(option(REWARD.gear.id,REWARD.gear.name));
  controls.gear.replaceChildren(...groups);
  if(GEAR.has(old)&&!controls.gear.querySelector('option[value="'+old+'"]')?.disabled)controls.gear.value=old;
  if(!controls.gear.value)controls.gear.value='brass-ring';
  at('gr-roster').replaceChildren(...TIERS.map((tier,index)=>{
    const card=document.createElement('article');
    card.append(element('h3',tier.name),element('p',tier.scene+' · '+tier.target+' · '+(index<=opened?'Open':'Locked')));
    const list=document.createElement('ul');
    for(const item of tier.gear){
      const row=document.createElement('li');
      const record=profile.records[item.id];
      row.append(element('strong',item.icon+' '+item.name),element('span',RULES[item.rule].name+(record?' · Best '+record:'')));
      list.append(row);
    }
    card.append(list);return card;
  }));
  at('gr-locker-score').textContent=profile.coins.toLocaleString()+' coins · '+profile.wins+' trial clears · '+profile.tournamentWins+' bracket wins';
  at('gr-reward').textContent=profile.reunion?REWARD.badge+' · '+REWARD.gear.name+' unlocked':
    REWARD.title+' · '+REWARD.badge+' · 2,500 coins · '+REWARD.gear.name;
}
function resize(){
  const rect=canvas.getBoundingClientRect();
  if(!rect.width||!rect.height)return;
  width=rect.width;height=rect.height;
  const dpi=Math.min(devicePixelRatio||1,2);
  canvas.width=Math.round(width*dpi);canvas.height=Math.round(height*dpi);
  ctx.setTransform(dpi,0,0,dpi,0,0);
  paint();
}
function circle(x,y,r,stroke,fill){
  ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);
  if(fill){ctx.fillStyle=fill;ctx.fill();}
  ctx.strokeStyle=stroke;ctx.lineWidth=3;ctx.stroke();
}
function caption(label,x,y,size=14){
  ctx.font='bold '+size+'px system-ui';ctx.textAlign='center';ctx.fillStyle='#f0f5eb';ctx.fillText(label,x,y);
}
function paint(){
  if(!state||!width||!height)return;
  const b=shotBoard(state), theme=state.gear.tier.color;
  const form=CAST.forms.find(x=>x.id===profile.form);
  const gradient=ctx.createLinearGradient(0,0,0,height);
  gradient.addColorStop(0,'#20383f');gradient.addColorStop(1,'#132125');
  ctx.fillStyle=gradient;ctx.fillRect(0,0,width,height);
  const top=height*.26, bottom=height*.76, rail=bottom-top, left=width*.07, length=width*.86;
  const x=f=>left+length*f;
  ctx.strokeStyle=theme+'66';ctx.lineWidth=2;
  ctx.strokeRect(left,top,length,rail);
  const near=Math.max(0,b.target-b.margin), far=Math.min(1,b.target+b.margin);
  ctx.fillStyle=theme+'35';ctx.fillRect(x(near),top,length*(far-near),rail);
  ctx.strokeStyle=theme;ctx.beginPath();ctx.moveTo(x(b.target),top);ctx.lineTo(x(b.target),bottom);ctx.stroke();
  const spot=state.phase==='reel'?b.target:b.pos;
  const pY=state.phase==='reel'?top+rail*state.progress:top+rail*.48;
  if(state.phase==='reel'){
    ctx.strokeStyle=state.stress>.78?'#ff9d95':'#ede6b9';
    ctx.beginPath();ctx.moveTo(width/2,bottom);ctx.lineTo(x(spot),pY);ctx.stroke();
  }
  circle(x(spot),pY,18,form.color,'#1d2e34');
  caption(state.gear.icon,x(spot),pY+6,19);
  if(state.gear.rule==='spin'){
    ctx.strokeStyle=b.spinOK?'#e6f29c':'#f4a59b';ctx.lineWidth=3;ctx.beginPath();
    ctx.moveTo(x(spot),pY);ctx.lineTo(x(spot)+Math.sin(b.rotation*3)*25,pY-Math.cos(b.rotation*3)*25);ctx.stroke();
  }
  caption(state.expedition?.target??state.gear.tier.target,width/2,top-13,13);
  if(mode==='coach')caption(Math.abs(b.pos-b.target)<b.margin*.48?'RELEASE NOW':'WATCH THE WINDOW',width/2,bottom+24,12);
  else if(state.gear.rule==='return')caption(b.returning?'RETURNING':'OUTBOUND',width/2,bottom+24,12);
  else caption('Wind '+(b.wind<-.012?'←':b.wind>.012?'→':'·'),width/2,bottom+24,12);
}
function update(){
  const t=turn(state), totals=scoreboard;
  const limit=state.tournament?12:3;
  const current=state.receipts.length<limit?actor(state):'Complete';
  const counter=state.tournament?'Round '+Math.min(3,t.round+1)+' / 3':'Attempt '+Math.min(3,state.receipts.length+1)+' / 3';
  controls.status.textContent=counter+' · '+current+' · '+(state.tournament?totals.teams.join(' – '):totals.teams[0]+' points');
  controls.action.disabled=state.phase==='done'||isNathanTurn(state);
  controls.action.textContent=state.phase==='reel'?(state.reeling?'Ease':'Reel'):
    state.phase==='second'?'Catch second target':state.gear.rule==='heavy'?(state.phase==='charge'?'Release':'Charge'):'Release';
  const meter=at('gr-meter'), label=at('gr-meter-name'), details=at('gr-meter-text');
  const active=['reel','charge','second'].includes(state.phase);
  at('gr-meter-wrap').hidden=!active;
  if(active){
    if(state.phase==='reel'){
      meter.value=state.stress;label.textContent='Line tension';
      details.textContent=(state.stress>.78?'Ease now':state.stress>=.23?'Green':'Slack')+' · '+Math.floor(state.progress*100)+'% retrieved';
    }else if(state.phase==='charge'){
      meter.value=state.charge;label.textContent='Charge';
      details.textContent=Math.floor(state.charge*100)+'% · 55% required';
    }else{
      meter.value=Math.max(0,state.second/2.2);label.textContent='Second window';details.textContent=state.second.toFixed(1)+' s';
    }
  }
}
function emit(type,detail){
  window.dispatchEvent(new CustomEvent('grapple-it:arcade',{detail:{type,mode,gameId:state.gear.id,...detail}}));
}
function updateReceipt(){
  if(processed!==state.receipts.length){
    scoreboard=scores(state);
    while(processed<state.receipts.length){
      const shot=state.receipts[processed++];
      controls.ledger.append(element('li',(state.tournament?'Round '+(shot.round+1)+' · ':'')+shot.actor+' · '+shot.score+' · '+shot.note));
      emit('consumeShot',{remainingShots:(state.tournament?12:3)-processed});
      emit(shot.success?'emitTopHit':'emitMiss',shot);
    }
    buttonsDirty=true;
  }
  if(state.phase==='done'&&!state.reported){
    state.reported=true;
    if(!state.result.won)session.nathan=false;
    const amount=completeArcade(profile,state,session);
    const summary=state.tournament?(state.result.tie?'Bracket tied.':state.result.teams[0]>state.result.teams[1]?'Grape wins the bracket.':mode==='solo-bracket'?'Nathan AI 🚀 wins the bracket.':'Apple wins the bracket.'):
      state.result.won?state.result.grade+' · Trial cleared.':'Target '+state.result.target+' · Try again.';
    state.notice=summary+(amount?' +'+amount.toLocaleString()+' coins.':'');
    if(amount&&!persist())state.notice+=' Save code is available from this open tab.';
    drawLocker();
    emit('onMiniGameComplete',state.result);
    buttonsDirty=true;
  }
  if(buttonsDirty){controls.notice.textContent=state.notice;buttonsDirty=false;}
}
function loop(now){
  if(!visible)return;
  const dt=last?Math.min((now-last)/1000,.045):0;last=now;
  if(state.phase!=='done'){
    stepArcade(state,dt);assistNathan(state);updateReceipt();update();paint();
  }
  if(state.phase!=='done')frame=requestAnimationFrame(loop);
}
function reset(){
  cancelAnimationFrame(frame);
  state=newArcade({mode,id:controls.gear.value,mission:mode==='expedition'?controls.mission.value:null});
  controls.ledger.replaceChildren();processed=0;last=0;scoreboard=scores(state);
  controls.notice.textContent=state.notice;
  at('gr-rule').textContent=state.gear.name+' · '+RULES[state.gear.rule].name+'. '+RULES[state.gear.rule].hint;
  at('gr-mode-help').textContent=modes[mode][1];
  at('gr-gear-wrap').hidden=mode==='expedition';
  at('gr-mission-wrap').hidden=mode!=='expedition';
  emit('initMiniGame',{gear:state.gear.id,mission:state.expedition?.id??null});
  update();resize();
  if(visible)frame=requestAnimationFrame(loop);
}
controls.mission.replaceChildren(...EXPEDITIONS.map(x=>option(x.id,x.name+' · '+x.goal+' points')));
controls.form.replaceChildren(...CAST.forms.map(x=>option(x.id,x.mark+' '+x.name+' · '+x.pronouns)));
controls.form.value=profile.form;
at('gr-mode').replaceChildren(...Object.entries(modes).map(([key,[name]])=>option(key,name)));
at('gr-wordmark').textContent=WORDMARK;
at('gr-pk-line').textContent=CAST.pk.line;
at('gr-pk-origin').textContent=CAST.pk.origin;
controls.form.onchange=()=>{profile.form=controls.form.value;persist();paint();};
at('gr-mode').onchange=()=>{mode=at('gr-mode').value;reset();};
controls.mission.onchange=reset;controls.gear.onchange=reset;
at('gr-reset').onclick=reset;
controls.action.onclick=()=>{
  if(state.phase==='done'||isNathanTurn(state))return;
  actionArcade(state);
  buttonsDirty=true;updateReceipt();update();paint();
};
new ResizeObserver(resize).observe(canvas);
window.addEventListener('grapple-view',event=>{
  visible=event.detail==='arcade';
  if(!visible){cancelAnimationFrame(frame);if(event.detail)session.nathan=false;return;}
  reset();
});
window.grappleArcadeSave=Object.freeze({
  export(){return structuredClone(profile);},
  restore(incoming){
    const next=cleanProgress(incoming);
    for(const [key,value] of Object.entries(next.records))profile.records[key]=Math.max(profile.records[key]??0,value);
    for(const key of ['coins','wins','tournamentWins'])profile[key]=Math.max(profile[key],next[key]);
    profile.reunion||=next.reunion;
    profile.form=next.form;controls.form.value=profile.form;
    drawLocker();if(visible)reset();
    return persist();
  }
});
drawLocker();reset();
