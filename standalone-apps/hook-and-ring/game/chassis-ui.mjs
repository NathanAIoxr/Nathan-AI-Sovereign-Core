import { CHASSIS,THEMES,arcEvent,validatePlugins,playChassis,traceOutline,boardNodes } from './chassis.mjs?v=11';
import { createBridge } from './universal-bridge.mjs';
import { STAGES } from './grapple.mjs';

const $=id=>document.getElementById(id);
const canvas=$('lab-board'),ctx=canvas.getContext('2d'),width=canvas.width,height=canvas.height;
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const bridge=createBridge();
const embedded=window.parent!==window&&new URLSearchParams(location.search).has('duplex');
if(embedded)document.body.classList.add('duplex');
let bridgeMode='charge',bridgeEnded=false,bridgeAmmo=0,bridgeRound=0;
const notifyParent=(type,detail={})=>window.parent.postMessage({channel:'tabor-arcade-v1',type,...detail},location.origin);
window.addEventListener('message',event=>{
  if(!embedded||event.source!==window.parent||event.origin!==location.origin||event.data?.channel!=='tabor-arcade-v1')return;
  if(event.data.type==='state'){
    if(bridgeRound!==event.data.round&&flight&&!flight.done){flight=null;$('run').disabled=false;}
    bridgeMode=event.data.mode;bridgeEnded=event.data.ended;bridgeAmmo=event.data.ammo;bridgeRound=event.data.round;
  }
  if(event.data.type==='load'&&games.length)select(games.find(item=>item.id===event.data.game)??games[0]);
});
function playLedger(){
  try{return JSON.parse(localStorage.getItem('tabor-chassis-records-v1'))??{};}catch{return {};}
}
const saved=playLedger();
const ledger={wins:Object.assign(Object.create(null),saved.wins), favorites:new Set(Array.isArray(saved.favorites)?saved.favorites:[]),gift:Number.isSafeInteger(saved.gift)?saved.gift:0};
function saveLedger(){
  try{localStorage.setItem('tabor-chassis-records-v1',JSON.stringify({...ledger,favorites:[...ledger.favorites]}));}catch{}
}
function showRecord(){
  const fav=ledger.favorites.has(game.id);
  $('favorite').setAttribute('aria-pressed',fav);
  $('favorite').textContent=fav?'★ Favorited':'☆ Favorite';
  const wins=ledger.wins[game.id];
  $('local-record').textContent=wins?wins+' local clear'+(wins===1?'':'s'):'First clear ahead';
}

const art={horseshoe:'∩',bottle:'▮',skillet:'🍳',ring:'○',bubble:'◌',quintain:'◇',pillow:'□',stamp:'✣',pumpkin:'◆'};
const instructions={
  A:'Drag on the board or use the sliders to aim. Follow the arc preview and reach the marked target.',
  B:'Set lift and spin. Land with the marked edge aligned to the pad.',
  C:'Set the tether input, then run the course.',
  D:'Select the marked lane and tap the timing target during the green window. Parry in blue for a wider green window.',
  E:'Trace the numbered path with a finger, mouse, or numbered buttons. Then check your pattern.',
};
const controls={
  A:[['angle','Angle',0,78],['force','Power',20,100],['spin','Spin',0,100]],
  B:[['power','Lift',20,100],['spin','Spin',0,100]],
  C:[['power','Pull',10,95],['aim','Aim',-100,100]],
};
let games=[],game,values={},action,flight,trace=[],frame,epoch=performance.now(),guardUntil=0;
let dragging=false,sound=false,audio;
let practiceHits=0;
const buttons=new Map();
let pointerId=null;
const cycle=now=>((now-epoch)%game.parameters.beatMs)/game.parameters.beatMs;
function circle(x,y,r,fill){
  ctx.beginPath();ctx.arc(x*width,y*height,r,0,Math.PI*2);
  ctx.fillStyle=fill;ctx.fill();
}
function line(points,color,dash=[]){
  if(points.length<2) return;
  ctx.beginPath();ctx.setLineDash(dash);
  ctx.moveTo(points[0].x*width,points[0].y*height);
  for(const point of points.slice(1))ctx.lineTo(point.x*width,point.y*height);
  ctx.strokeStyle=color;ctx.lineWidth=2;ctx.stroke();ctx.setLineDash([]);
}
function put(text,x,y,color,size=22){
  ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle=color;
  ctx.font='700 '+size+'px system-ui';ctx.fillText(text,x*width,y*height);
}
function stageTarget(now){
  if(game.baseChassis==='D'){
    for(let n=0;n<3;n++){
      const y=.3+n*.19;
      line([{x:.14,y},{x:.85,y}],n===game.parameters.lane?'#d7ed8180':'#8ab2b954');
      circle(.75,y,18,n===game.parameters.lane?'#ddf68d':'#577278');
    }
    const p=game.parameters, a=cycle(now);
    ctx.fillStyle='#304b50';ctx.fillRect(width*.12,height*.87,width*.76,11);
    for(const [phase,color] of [[p.strikePhase-.24,'#80c5ed'],[p.strikePhase,'#d8f58a']]){
      const spread=p.window+(now<guardUntil&&phase===p.strikePhase?.035:0);
      ctx.fillStyle=color;
      ctx.fillRect(width*(.12+(phase-spread)*.76),height*.87,width*.76*spread*2,11);
    }
    circle(.12+.76*a,.884,6,'#fff');
  }else if(game.baseChassis==='E'){
    const outline=traceOutline(game.parameters.path);
    line(outline,'#a3ccb3',[5,6]);
    boardNodes.forEach((mark,i)=>circle(mark.x,mark.y,14,'#345b60'));
    const labeled=new Set();
    outline.forEach((mark,i)=>{
      const node=game.parameters.path[i];
      if(labeled.has(node)) return;
      labeled.add(node);const numbers=game.parameters.path.flatMap((n,j)=>n===node?[j+1]:[]);put(numbers.join('/'),mark.x,mark.y,'#e4f2c3',15);
    });
    line(trace,'#e5ef97');
  }else{
    if(game.baseChassis==='C'&&game.parameters.mode==='buoyancy'){
      const course=STAGES[game.parameters.course];
      course.anchors.forEach(([x,y],i)=>{circle(x,y,16,'#dff190');put(String(i+1),x,y,'#25402f',14);});
    }
    const guide=game.baseChassis==='A'?arcEvent(game.parameters).target:
      game.baseChassis==='B'?[.75,.78]:game.parameters.mode==='pendulum'?[.5,.395]:null;
    if(guide){circle(...guide,18,'#dff190');circle(...guide,8,'#446a56');}
    if(game.baseChassis==='A'&&!flight){
      const preview=playChassis(game,values);
      line(preview.points,'#d8e8b887',[4,5]);
    }
  }
}
function draw(now){
  if(!game)return;
  const bg=ctx.createLinearGradient(0,0,width,height);
  const [top,bottom]=THEMES[game.theme]??['#1d4652','#0d2832'];
  bg.addColorStop(0,top);bg.addColorStop(1,bottom);
  ctx.fillStyle=bg;ctx.fillRect(0,0,width,height);
  for(let x=.1;x<1;x+=.1)line([{x,y:.13},{x,y:.85}],'#aacdd41c');
  line([{x:.07,y:.78},{x:.94,y:.78}],'#a4cbbc47');
  stageTarget(now);
  let point;
  if(flight){
    const end=reduced.matches?flight.points.length-1:Math.min(flight.points.length-1,Math.floor((now-flight.start)/13));
    const path=flight.points.slice(0,end+1);
    line(path,'#f7eab2a4');point=path.at(-1);
    if(end>=flight.points.length-1&&!flight.done){
      flight.done=true;
      complete(flight,action);
    }
  }
  if(!point&&game.baseChassis!=='E') point={x:game.baseChassis==='C'?.5:.18,y:.72};
  if(point){
    ctx.save();ctx.translate(point.x*width,point.y*height);
    ctx.rotate((point.angle??0)*Math.PI/180);
    ctx.fillStyle='#ecf5a2';ctx.font='700 29px system-ui';ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.fillText(game.mark??art[game.art],0,0);ctx.restore();
  }
}
function renderBridge(){
  const count=bridge.snapshot();
  $('points').textContent=count.points;$('shots').textContent=count.loadedShots;$('round').textContent=count.round;
  $('consume').disabled=count.loadedShots===0;
}
function playSound(success){
  if(!sound||!audio||game.sound==='silent')return;
  const osc=audio.createOscillator(),gain=audio.createGain();
  osc.type=game.sound==='clang'?'triangle':'sine';
  osc.frequency.value=success?(game.sound==='bell'?740:420):210;
  const now=audio.currentTime;
  gain.gain.setValueAtTime(.105,now);gain.gain.exponentialRampToValueAtTime(.002,now+.17);
  osc.connect(gain).connect(audio.destination);osc.start();osc.stop(now+.18);
}
function complete(outcome,attempt){
  if(bridge.emitTopHit(attempt,outcome)) $('bridge-result').textContent='Loaded one shot from '+game.name+'.';
  if(outcome.success){
    ledger.wins[game.id]=(ledger.wins[game.id]??0)+1;
    const unique=Object.keys(ledger.wins).length;
    if(unique>=5&&Math.floor(unique/5)>ledger.gift){
      ledger.gift=Math.floor(unique/5);
      $('arcade-gift').hidden=false;
      $('arcade-gift').textContent='On the House · '+unique+' different boards cleared. Here are two extra practice shots.';
      if(!embedded)bridge.grantShots(2);
      else notifyParent('gift',{round:bridgeRound});
      if(embedded)$('arcade-gift').textContent='On the House · '+unique+' different boards cleared. Here are two extra Bridge charges.';
    }
    saveLedger();showRecord();filterGames();
    if(embedded)notifyParent('hit',{round:bridgeRound});
  }
  if(embedded&&!outcome.success)notifyParent('miss',{round:bridgeRound});
  $('result').textContent=outcome.message+(game.baseChassis==='E'?' '+outcome.score+'% matched.':'');
  $('run').disabled=false;
  playSound(outcome.success);renderBridge();
}
function select(next){
  game=next;flight=null;trace=[];dragging=false;pointerId=null;guardUntil=0;epoch=performance.now();
  $('arcade-gift').hidden=true;
  showRecord();
  const url=new URL(location.href);
  url.searchParams.set('game',game.id);
  history.replaceState(null,'',url);

  for(const [id,button] of buttons)button.setAttribute('aria-pressed',String(id===game.id));
  $('chassis-name').textContent=game.baseChassis+' · '+CHASSIS[game.baseChassis];
  $('game-name').textContent=game.name;$('config').textContent=JSON.stringify(game,null,2);
  $('result').textContent='';
  $('instructions').textContent=game.baseChassis==='C'?
    (game.parameters.mode==='pendulum'?'Pull back and line up the ring with the center hook.':'Set air pulses and steering to lift the bubble into the latch.') : instructions[game.baseChassis];
  $('rhythm-controls').hidden=game.baseChassis!=='D';
  $('trace-controls').hidden=game.baseChassis!=='E';
  $('trace-controls').replaceChildren();
  if(game.baseChassis==='E') for(const [index,point] of boardNodes.entries()){
    const button=document.createElement('button');
    const occurrences=game.parameters.path.flatMap((node,step)=>node===index?[step+1]:[]);
    const order=occurrences.length?occurrences[0]-1:-1;
    button.type='button';button.textContent=order<0?'·':occurrences.join(' / ');
    button.setAttribute('aria-label',order<0?'Unused point '+(index+1):'Trace point '+(order+1)+(index===game.parameters.path.at(-1)?', also the finish':''));

    button.disabled=order<0;
    button.onclick=()=>{trace.push(point);$('result').textContent=trace.length+' points recorded.';};
    $('trace-controls').append(button);
  }
  values={angle:game.parameters.angle??32,force:game.parameters.force??75,power:game.baseChassis==='C'?49:70,spin:game.parameters.spin??(game.baseChassis==='A'?55:60),aim:0,pulses:game.parameters.course?12:4};
  const fields=game.parameters.mode==='buoyancy'?[['pulses','Air pulses',1,12],['aim','Steering',-100,100]]:controls[game.baseChassis]??[];
  $('sliders').replaceChildren(...fields.map(([id,label,min,max])=>{
    const field=document.createElement('label'),slider=document.createElement('input'),readout=document.createElement('output');
    slider.type='range';slider.id='control-'+id;slider.min=min;slider.max=max;slider.value=values[id];
    readout.textContent=slider.value;readout.htmlFor=slider.id;
    slider.oninput=()=>{values[id]=Number(slider.value);readout.textContent=slider.value;if(flight?.done)flight=null;};
    field.append(label,readout,slider);
    return field;
  }));
  if(game.parameters.mode==='buoyancy'){
    const assistLabel=document.createElement('label'),assist=document.createElement('input');
    assist.type='checkbox';assist.checked=true;assist.id='assist';
    assistLabel.append('Steering assist',assist);$('sliders').append(assistLabel);
  }
  $('lane').value='1';
  $('run').textContent={A:'Toss',B:'Flip',C:game.parameters.mode==='buoyancy'?'Pump air':'Release ring',D:'Tap target',E:'Check pattern'}[game.baseChassis];
  $('run').disabled=false;
}
$('run').onclick=()=>{
  if(!game)return;
  const input={...values,assist:$('assist')?.checked,phase:game.baseChassis==='D'?cycle(performance.now()):0,lane:Number($('lane').value),trace,guarded:performance.now()<guardUntil};
  if(embedded&&bridgeMode!=='solo'&&bridgeEnded){$('result').textContent='Start a new Bridge round.';return;}
  if(embedded&&bridgeMode!=='solo'&&game.baseChassis!=='E'){
    if(bridgeEnded||bridgeAmmo<1){$('result').textContent=bridgeEnded?'Start a new Bridge round.':'Reload with the lower puzzle.';return;}
    bridgeAmmo--;
    notifyParent('spend',{round:bridgeRound});
  }
  action=bridge.startAttempt(game);
  const outcome=playChassis(game,input);
  guardUntil=0;
  if(game.baseChassis==='E'){complete(outcome,action);return;}
  flight={...outcome,start:performance.now(),done:false};
  $('run').disabled=true;
};
$('parry').onclick=()=>{
  const attempt=playChassis(game,{phase:cycle(performance.now()),guard:true});
  guardUntil=attempt.score?performance.now()+game.parameters.beatMs*.5:0;
  $('result').textContent=attempt.message;
};
$('reset-chassis').onclick=()=>{if(game)select(game);};
$('consume').onclick=()=>{
  if(!bridge.consumeShot())return;
  practiceHits++;
  $('bridge-target').value=practiceHits%3||3;
  $('bridge-result').textContent=practiceHits%3===0?'Practice target cleared.':'Practice target hit ('+(practiceHits%3)+'/3).';
  renderBridge();
};
$('sound-toggle').onclick=()=>{
  sound=!sound;
  $('sound-toggle').textContent=sound?'Sound on':'Sound off';
  $('sound-toggle').setAttribute('aria-pressed',String(sound));
  if(sound){try{audio??=new AudioContext();audio.resume().catch(()=>{});}catch{}}
};
function position(event){
  const bounds=canvas.getBoundingClientRect();
  return {x:(event.clientX-bounds.left)/bounds.width,y:(event.clientY-bounds.top)/bounds.height};
}
function boardInput(event){
  const point=position(event);
  if(game.baseChassis==='E'){
    if(trace.length<900)trace.push(point);
    return;
  }
  if(game.baseChassis==='B'||game.baseChassis==='C'){
    const sliders=game.baseChassis==='B'?[['power',point.y,-100,100],['spin',point.x,100,0]]:
      [[game.parameters.mode==='buoyancy'?'pulses':'power',point.y,game.parameters.mode==='buoyancy'?-12:-100,game.parameters.mode==='buoyancy'?12:100],['aim',point.x,200,-100]];
    for(const [key,coord,scale,offset] of sliders){
      const slider=$('control-'+key);
      slider.value=Math.round(Math.max(Number(slider.min),Math.min(Number(slider.max),coord*scale+offset)));
      slider.dispatchEvent(new Event('input'));
    }
    return;
  }
  const inputs={force:Math.round(Math.min(100,Math.max(20,point.x*100))),angle:Math.round(Math.min(78,Math.max(0,(.76-point.y)*115)))};
  for(const [key,val] of Object.entries(inputs)){
    const slider=$('control-'+key);slider.value=val;slider.dispatchEvent(new Event('input'));
  }
}
canvas.onpointerdown=event=>{
  if(!game||game.baseChassis==='D'||$('run').disabled||dragging||event.button!==0) return;
  dragging=true;pointerId=event.pointerId;
  if(game.baseChassis==='E') trace=[];
  canvas.setPointerCapture(event.pointerId);boardInput(event);
};
canvas.onpointermove=event=>{if(dragging&&event.pointerId===pointerId)boardInput(event);};
canvas.onpointerup=event=>{
  if(!dragging||event.pointerId!==pointerId)return;
  boardInput(event);dragging=false;pointerId=null;
  if(game.baseChassis!=='E')$('run').click();
};
for(const name of ['pointercancel','lostpointercapture'])canvas.addEventListener(name,event=>{if(event.pointerId===pointerId){dragging=false;pointerId=null;}});
function filterGames(){
  const query=$('game-search').value.trim().toLowerCase();
  const chassis=$('game-filter').value;
  let count=0;
  for(const item of games){
    const shown=(chassis==='favorites'?ledger.favorites.has(item.id):!chassis||chassis===item.baseChassis)
      && (!query||(item.name+' '+CHASSIS[item.baseChassis]).toLowerCase().includes(query));
    const button=buttons.get(item.id);
    button.hidden=!shown;
    button.firstChild.textContent=(ledger.favorites.has(item.id)?'★ ':'')+item.name;
    count+=Number(shown);
  }
  $('catalog-count').textContent=count===games.length?count+' games':count+' of '+games.length+' games';
}
$('game-filter').append(...Object.entries(CHASSIS).map(([key,label])=>new Option(key+' · '+label,key)),new Option('Favorites','favorites'));
$('game-filter').onchange=filterGames;
$('game-search').oninput=filterGames;
$('favorite').onclick=()=>{
  const id=game.id;
  if(ledger.favorites.has(id))ledger.favorites.delete(id);else ledger.favorites.add(id);
  saveLedger();showRecord();filterGames();
};
$('copy-game').onclick=async()=>{
  const url=new URL(location.href);
  url.searchParams.delete('duplex');
  try{
    await navigator.clipboard.writeText(url.href);
    $('result').textContent='Game link copied.';
  }catch{$('result').textContent='Game link '+url.href;}
};

function tick(now){draw(now);frame=requestAnimationFrame(tick);}
try{
  const response=await fetch('/game-plugins.json');
  if(!response.ok)throw new Error('Catalog unavailable');
  games=validatePlugins(await response.json());
  for(const item of games){
    const button=document.createElement('button'),label=document.createElement('small');
    button.type='button';label.textContent=item.baseChassis+' · '+CHASSIS[item.baseChassis];
    button.append(item.name,label);button.onclick=()=>select(item);
    buttons.set(item.id,button);$('games').append(button);
  }
  filterGames();
  const requested=new URLSearchParams(location.search).get('game');
  select(games.find(item=>item.id===requested)??games.find(item=>item.id==='hook-ring')??games[0]);renderBridge();frame=requestAnimationFrame(tick);
  if(embedded)notifyParent('ready');
}catch(error){$('game-name').textContent='Game catalog unavailable';$('result').textContent=error.message;}
window.addEventListener('pagehide',()=>cancelAnimationFrame(frame));
window.addEventListener('pageshow',event=>{if(event.persisted)frame=requestAnimationFrame(tick);});
if('serviceWorker' in navigator)navigator.serviceWorker.register('/sw.js').catch(()=>{});
