import {WristFlipEngine,clamp} from './engine.mjs';
import {cartridges,evaluateThrow} from './games.mjs';
import {HybridKineticEngine,classifyAirPath} from './kinetic.mjs';

const $=(id)=>document.getElementById(id);
const gameCanvas=$('game'),ctx=gameCanvas.getContext('2d');
const pad=$('pad');
let cartridge='ten_pin_bowling',score=0,rounds=0;
let lastOutcome=null,animation=null,history=[];
let lastPattern=null, drawnPattern=[], patternPointer=null;
let motionEnabled=false,motionSeen=false;
let lastMotionAt=0;
const gameLabel={ten_pin_bowling:'Ten-pin bowling',beanbag_toss:'Cornhole',pub_darts:'Pub darts',baseball_pitching:'Baseball pitching',air_patterns:'Air conductor patterns'};
function handleThrow(g){
  if(cartridge==='air_patterns') return;
  const outcome=evaluateThrow(cartridge,g);
  lastOutcome={...outcome,g};
  history.push({timestamp:new Date().toISOString(),cartridge,gesture:g,result:outcome});
  score+=outcome.score;rounds++;
  $('scoreText').textContent=`SCORE ${score}`;
  $('roundText').textContent=`${outcome.kind}  •  THROW ${rounds}`;
  $('metricPower').textContent=Math.round(g.power*100)+'%';
  $('metricSpin').textContent=g.spin.toFixed(2);
  $('metricGrip').textContent=g.fingerCount+' DIGIT';
  $('status').textContent=`${gameLabel[cartridge]}: ${outcome.kind} (${outcome.score} pts). ${g.fingerCount}-contact grip, ${g.motionUsed?'motion + touch':'touch only'}. ${outcome.hint}`;
  animation={t:performance.now(),duration:870,result:outcome,cartridge};
  if(navigator.vibrate) navigator.vibrate(18);
}
const engine=new WristFlipEngine({padWidth:pad.clientWidth,padHeight:pad.clientHeight,onThrow:handleThrow});
const kinetic=new HybridKineticEngine({onThrow:g=>{if(cartridge==='baseball_pitching')handleThrow(g);},onPattern:(shape,points)=>showPattern(shape,points,'air rotation')});
function showPattern(shape,points,source){
  lastPattern={shape,points,source};
  history.push({timestamp:new Date().toISOString(),cartridge:'air_patterns',source,shape,pointCount:points.length});
  rounds++;if(shape!=='unknown')score++;
  $('scoreText').textContent=`SCORE ${score}`;
  $('roundText').textContent=`PATTERN ${rounds}`;
  $('metricGrip').textContent=source==='air rotation'?'AIR':'DRAW';
  $('metricSpin').textContent=shape;
  $('status').textContent=`${source.toUpperCase()}: ${shape}. Pattern detection uses projected motion; this is not calibrated 3D tracking.`;
}

function setGame(id){
  if(!cartridges.some(g=>g.id===id))return;
  cartridge=id;score=0;rounds=0;lastOutcome=null;animation=null;lastPattern=null;drawnPattern=[];
  kinetic.setMode(motionEnabled?(id==='baseball_pitching'?'throw':id==='air_patterns'?'trace':'off'):'off');
  $('holdAir').hidden=!['baseball_pitching','air_patterns'].includes(id);
  $('airDemo').hidden=!['baseball_pitching','air_patterns'].includes(id);
  $('holdAir').textContent=id==='air_patterns'?'HOLD TO TRACE':'HOLD TO ARM';
  $('gameTitle').textContent=gameLabel[id];
  $('gameDescription').textContent=cartridges.find(g=>g.id===id).description+' • Shared 1/2/3-contact wrist-flip control';
  document.querySelectorAll('.tab').forEach(b=>{b.classList.toggle('active',b.dataset.game===id);b.setAttribute('aria-pressed',String(b.dataset.game===id));});
  $('roundText').textContent='READY TO PLAY';$('scoreText').textContent='SCORE 0';
  $('status').textContent=id==='air_patterns'?'Air patterns: enable sensors, hold TRACE and rotate the device gently; or DRAW on the pad for a screen-based preview. Never throw the device.':id==='baseball_pitching'?'Baseball: use touch flicks, or enable motion and hold ARM for a controlled virtual pitch. Keep the phone in your hand.':`${gameLabel[id]} selected. Place fingers on the pad, swipe upward and release. Do not toss the device.`;
}
document.querySelectorAll('.tab').forEach(btn=>btn.addEventListener('click',()=>setGame(btn.dataset.game)));
$('reset').addEventListener('click',()=>setGame(cartridge));

function coords(e){const r=pad.getBoundingClientRect();return {x:e.clientX-r.left,y:e.clientY-r.top};}
function capturePad(e){if(e.pointerType==='mouse'&&e.button!==0)return;
  if(cartridge==='air_patterns'){const p=coords(e);patternPointer=e.pointerId;drawnPattern=[p];pad.setPointerCapture?.(e.pointerId);e.preventDefault();return;}
  e.preventDefault(); const {x,y}=coords(e);pad.setPointerCapture?.(e.pointerId);
  engine.down(e.pointerId,x,y,performance.now());showTouches();}
pad.addEventListener('pointerdown',capturePad);
pad.addEventListener('pointermove',e=>{
  if(cartridge==='air_patterns'&&e.pointerId===patternPointer){e.preventDefault();drawnPattern.push(coords(e));return;}
  if(!engine.contacts.has(e.pointerId))return; e.preventDefault();
  const events=typeof e.getCoalescedEvents==='function'?e.getCoalescedEvents():[];
  // Browser coalesced event timestamps share the performance timebase.
  for(const s of events){const p=coords(s);engine.move(e.pointerId,p.x,p.y,s.timeStamp);}
  const p=coords(e);engine.move(e.pointerId,p.x,p.y,performance.now());showTouches();
});
pad.addEventListener('pointerup',e=>{
  if(cartridge==='air_patterns'&&patternPointer===e.pointerId){e.preventDefault();drawnPattern.push(coords(e));showPattern(classifyAirPath(drawnPattern),drawnPattern.slice(),'on-screen drawing');drawnPattern=[];patternPointer=null;return;}
  e.preventDefault();const p=coords(e);engine.up(e.pointerId,p.x,p.y,performance.now());showTouches();});
pad.addEventListener('pointercancel',()=>{patternPointer=null;drawnPattern=[];engine.cancel();showTouches();$('status').textContent='Gesture canceled by the system. Try again.';});
pad.addEventListener('lostpointercapture',e=>{if(engine.contacts.has(e.pointerId)){engine.cancel();showTouches();}});
function showTouches(){
  const snap=engine.snapshot();
  pad.querySelectorAll('.touchdot').forEach(n=>n.remove());
  for(const c of snap.contacts){const dot=document.createElement('div');dot.className='touchdot'+(c.id===snap.bottomId?' anchor':'');dot.style.left=c.x+'px';dot.style.top=c.y+'px';dot.textContent=c.id===snap.bottomId?'A':'C';pad.append(dot);}
  $('gripText').textContent=`${snap.touchCount} CONTACT${snap.touchCount===1?'':'S'} • ${snap.fingerCount}-DIGIT ${snap.releasePending?'RELEASE WINDOW':'GRIP'}`;
}

$('demo').addEventListener('click',()=>{
  if(cartridge==='air_patterns'){const points=Array.from({length:91},(_,i)=>({x:125+55*Math.cos(i*2*Math.PI/90),y:130+55*Math.sin(i*2*Math.PI/90)}));showPattern('circle',points,'simulated on-screen');return;}
  if(engine.contacts.size) return;
  const t=performance.now();const w=pad.clientWidth,h=pad.clientHeight;
  const thumb=w*.50,lower=h*.85;
  engine.down(101,thumb,lower,t);engine.down(102,w*.38,h*.58,t);engine.down(103,w*.64,h*.58,t);
  engine.move(102,w*.39,h*.45,t+20);engine.move(103,w*.64,h*.44,t+20);
  engine.move(102,w*.39,h*.28,t+42);engine.move(103,w*.66,h*.29,t+42);
  engine.up(101,thumb,lower,t+48);engine.up(102,w*.39,h*.25,t+66);engine.up(103,w*.66,h*.25,t+67);
  showTouches();
});

$('motion').addEventListener('click',async()=>{
  if(motionEnabled){motionEnabled=false;engine.enableMotion(false);kinetic.setMode('off');$('motion').textContent='ENABLE DEVICE MOTION';$('status').textContent='Device motion disabled. Touch-only controls remain active.';return;}
  if(typeof DeviceMotionEvent==='undefined'){$('status').textContent='Device-motion API is not available on this browser. Touch-only mode still works.';return;}
  if(!window.isSecureContext){$('status').textContent='Device motion generally requires HTTPS or localhost. Touch-only mode works without it.';return;}
  try {
    if(typeof DeviceMotionEvent.requestPermission==='function'){
      const res=await DeviceMotionEvent.requestPermission();
      if(res!=='granted'){$('status').textContent='Motion permission not granted. Touch-only mode stays active.';return;}
    }
    if(!motionEnabled){window.addEventListener('devicemotion',handleMotion,{passive:true});}
    motionEnabled=true;engine.enableMotion(true);kinetic.setMode(cartridge==='baseball_pitching'?'throw':cartridge==='air_patterns'?'trace':'off');$('motion').textContent='DISABLE DEVICE MOTION';
    $('status').textContent='Motion requested. Gyroscope effects apply only when the device supplies recent sensor data. Touch-only is always supported.';
  }catch(err){$('status').textContent='Motion permission or hardware unavailable. Touch-only mode remains available.';}
});
function handleMotion(e){if(!motionEnabled)return;const r=e.rotationRate||{};
  const t=performance.now();
  if(Number.isFinite(r.beta)||Number.isFinite(r.gamma)||Number.isFinite(e.acceleration?.y)){
    motionSeen=true;lastMotionAt=t;
    engine.motion({beta:r.beta,gamma:r.gamma,accelerationY:e.acceleration?.y,t});
    // Browser DeviceMotion rotationRate is degrees/sec; native CoreMotion is rad/sec.
    const deg=Math.PI/180;kinetic.ingest({t,ay:(e.acceleration?.y||0)/9.80665,az:(e.acceleration?.z||0)/9.80665,
      rx:(r.beta||0)*deg,ry:(r.gamma||0)*deg,rz:(r.alpha||0)*deg,pitch:0});
  }
}
function holdState(v){if(!motionEnabled&&v){$('status').textContent='Enable device motion to use real handheld input, or use SIMULATE AIR INPUT.';return;}
  if(cartridge==='baseball_pitching')kinetic.arm(v);else if(cartridge==='air_patterns')kinetic.trace(v);}
const hold=$('holdAir');
hold.addEventListener('pointerdown',e=>{hold.setPointerCapture?.(e.pointerId);holdState(true);});
hold.addEventListener('pointerup',()=>holdState(false));
hold.addEventListener('pointercancel',()=>holdState(false));
hold.addEventListener('keydown',e=>{if(e.key===' '||e.key==='Enter')holdState(true);});
hold.addEventListener('keyup',e=>{if(e.key===' '||e.key==='Enter')holdState(false);});
$('airDemo').addEventListener('click',()=>{
  if(cartridge==='baseball_pitching'){kinetic.setMode('throw');kinetic.arm(true);const t=performance.now();kinetic.ingest({t,ay:1.2,az:.1,rx:.6,ry:2});kinetic.ingest({t:t+35,ay:.12,az:0,rx:.15,ry:.2});kinetic.setMode(motionEnabled?'throw':'off');}
  else if(cartridge==='air_patterns'){const points=Array.from({length:101},(_,i)=>({x:200+60*Math.sin(i*2*Math.PI/100),y:140+46*Math.sin(i*4*Math.PI/100)}));showPattern(classifyAirPath(points),points,'simulated gesture');}
});

function text(x,y,value,size=20,color='#e9fafb',align='center'){
  ctx.fillStyle=color;ctx.font=`${size}px system-ui`;ctx.textAlign=align;ctx.fillText(value,x,y);
}
function circle(x,y,r,color,stroke='#ffffff66',line=2){ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fillStyle=color;ctx.fill();ctx.lineWidth=line;ctx.strokeStyle=stroke;ctx.stroke();}
function rounded(x,y,w,h,r,fill){ctx.fillStyle=fill;ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fill();}
function boardBase(){ctx.clearRect(0,0,600,690);const g=ctx.createLinearGradient(0,0,600,690);g.addColorStop(0,'#12334a');g.addColorStop(1,'#0c152c');ctx.fillStyle=g;ctx.fillRect(0,0,600,690);}
function bowling(){
  boardBase(); text(300,43,'TEN-PIN BOWLING',27,'#c7eff0');
  ctx.fillStyle='#31475d';ctx.beginPath();ctx.moveTo(175,92);ctx.lineTo(425,92);ctx.lineTo(565,641);ctx.lineTo(35,641);ctx.closePath();ctx.fill();
  ctx.fillStyle='#cfa673';ctx.beginPath();ctx.moveTo(194,102);ctx.lineTo(405,102);ctx.lineTo(509,625);ctx.lineTo(94,625);ctx.closePath();ctx.fill();
  ctx.strokeStyle='#816039';ctx.lineWidth=2;for(let i=1;i<9;i++){let x=194+(405-194)*i/9;ctx.beginPath();ctx.moveTo(x,102);ctx.lineTo(94+(509-94)*i/9,625);ctx.stroke();}
  text(300,87,'PINS',12,'#ffe4b9');
  const pins=[[300,180],[277,167],[323,167],[254,154],[300,154],[346,154],[232,140],[277,140],[323,140],[368,140]];
  pins.forEach(([x,y])=>{rounded(x-7,y-10,14,26,6,'#f0f6e7');rounded(x-7,y-2,14,4,1,'#e95366');});
  const x=lastOutcome?.x*400+100||300;const y=lastOutcome?.y*330+120||495;
  if(lastOutcome){circle(x,y,33,'#202533','#b9dfe7',3);circle(x-12,y-10,5,'#64728d');circle(x+3,y-13,5,'#64728d');circle(x+12,y,5,'#64728d');}
  else{circle(300,563,32,'#202533','#b9dfe7',3);text(300,681,'Aim with contact position • Flip upward to roll',15,'#b5d1d1');}
}
function cornhole(){
  boardBase();text(300,43,'CORNHOLE',29,'#e9d7aa');
  ctx.fillStyle='#3f6171';ctx.fillRect(0,525,600,165);
  ctx.fillStyle='#d7a36b';ctx.beginPath();ctx.moveTo(239,110);ctx.lineTo(365,110);ctx.lineTo(520,580);ctx.lineTo(80,580);ctx.closePath();ctx.fill();
  ctx.strokeStyle='#805831';ctx.lineWidth=12;ctx.stroke();circle(300,205,42,'#142839','#9c6e45',8);
  text(300,92,'THE BAG BOARD',15,'#ffe9c6');
  if(lastOutcome){const x=135+lastOutcome.x*330,y=155+lastOutcome.y*365;
    ctx.save();ctx.translate(x,y);ctx.rotate(lastOutcome.g.spin*.35);
    rounded(-27,-19,54,38,9,'#89e1da');ctx.strokeStyle='#d1fff9';ctx.lineWidth=3;ctx.strokeRect(-23,-15,46,30);ctx.restore();
  }else{text(300,660,'Flat landing = points • Hole = 3',17,'#e8edca');}
}
function darts(){
  boardBase();text(300,43,'PUB DARTS',29,'#eff8eb');const cx=300,cy=338,R=243;
  circle(cx,cy,R+12,'#715c4b','#c9ae81',13);
  const wedgeColors=['#e2d6af','#273c3d'];
  for(let i=0;i<20;i++){
    const start=-Math.PI/2+(i-.5)*Math.PI/10,end=start+Math.PI/10;
    ctx.beginPath();ctx.moveTo(cx,cy);ctx.arc(cx,cy,R,start,end);ctx.closePath();ctx.fillStyle=wedgeColors[i%2];ctx.fill();
  }
  const rings=[{r:R*.98,w:18,col:'#153c31'},{r:R*.95,w:12,col:'#c33e3c'},{r:R*.61,w:17,col:'#17483b'},{r:R*.59,w:11,col:'#b6373e'}];
  for(const q of rings){ctx.beginPath();ctx.arc(cx,cy,q.r,0,Math.PI*2);ctx.strokeStyle=q.col;ctx.lineWidth=q.w;ctx.stroke();}
  circle(cx,cy,34,'#165b4b','#e3e4a2',1);circle(cx,cy,17,'#be4a44','#e5c4a0',1);
  for(let i=0;i<20;i++){const a=-Math.PI/2+i*Math.PI/10;text(cx+Math.cos(a)*222,cy+Math.sin(a)*222,String([20,1,18,4,13,6,10,15,2,17,3,19,7,16,8,11,14,9,12,5][i]),13,'#fff5cb');}
  if(lastOutcome){const x=cx+(lastOutcome.x-.5)*R*2,y=cy+(lastOutcome.y-.5)*R*2;ctx.strokeStyle='#e6ffff';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(x-38,y+47);ctx.lineTo(x,y);ctx.stroke();circle(x,y,7,'#b7f5ee','#153337',2);}
  else{text(300,657,'Center bull = 50 • Outer ring doubles',16,'#c1e5dc');}
}
function baseball(){
 boardBase();text(300,43,'BASEBALL PITCHING',27,'#d9faf2');
 const g=ctx.createLinearGradient(0,80,0,640);g.addColorStop(0,'#0b523e');g.addColorStop(1,'#184d3a');ctx.fillStyle=g;ctx.fillRect(50,90,500,530);
 rounded(155,160,290,360,8,'#ba9270');rounded(215,240,170,200,4,'#eef9f5');
 ctx.lineWidth=3;ctx.strokeStyle='#e05b47';ctx.strokeRect(215,240,170,200);
 text(300,190,'STRIKE ZONE',17,'#183c30');
 if(lastOutcome){const x=150+lastOutcome.x*300,y=210+lastOutcome.y*300;circle(x,y,16,'#f9faf5','#d64747',3);}
 text(300,665,'ARCADE power / spin — not actual MPH',15,'#c0dbd3');
}
function airPatterns(){
 boardBase();text(300,43,'AIR CONDUCTOR',29,'#cdf8e9');text(300,79,'CIRCLE • TRIANGLE • FIGURE EIGHT • SWISH',15,'#acd6de');
 ctx.strokeStyle='#68d4c7';ctx.lineWidth=5;ctx.beginPath();
 const p=drawnPattern.length>1?drawnPattern:lastPattern?.points||[];
 if(p.length>1){
   const xs=p.map(v=>v.x),ys=p.map(v=>v.y),
     minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys);
   const scale=Math.min(310/Math.max(1,maxX-minX),380/Math.max(1,maxY-minY),3);
   const xy=v=>({x:300+(v.x-(minX+maxX)/2)*scale,y:348+(v.y-(minY+maxY)/2)*scale});
   const first=xy(p[0]);ctx.moveTo(first.x,first.y);
   for(const v of p.slice(1)){const point=xy(v);ctx.lineTo(point.x,point.y);}ctx.stroke();
 }else{ctx.strokeStyle='#3b716c';ctx.lineWidth=3;ctx.beginPath();ctx.arc(300,340,155,0,Math.PI*2);ctx.stroke();text(300,350,'TRACE OR DRAW',24,'#baf7ed');}
 text(300,654,lastPattern?`${lastPattern.shape} (${lastPattern.source})`:'Hold TRACE with sensors, or draw on touch pad',17,'#cdf8e9');
}
function animateShot(now){
 if(!animation)return;const t=clamp((now-animation.t)/animation.duration,0,1);
 const sx=300,sy=640,tx=180+animation.result.x*240,ty=190+animation.result.y*180;
 if(t<1){const x=sx+(tx-sx)*t,y=sy+(ty-sy)*t-135*Math.sin(t*Math.PI);
   circle(x,y,Math.max(6,27*(1-t)),'#b7fff2','#ffffffaa',2);
 }else{animation=null;}
}
function loop(now){engine.tick(now);if(cartridge==='ten_pin_bowling')bowling();else if(cartridge==='beanbag_toss')cornhole();else if(cartridge==='pub_darts')darts();else if(cartridge==='baseball_pitching')baseball();else airPatterns();animateShot(now);requestAnimationFrame(loop);}
window.addEventListener('resize',()=>{engine.size(pad.clientWidth,pad.clientHeight);});
setGame(cartridge);requestAnimationFrame(loop);
