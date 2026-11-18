import {atlasEntry} from "./atlas.mjs";
import {CHASSIS,arena,flight,checkpoints,tracePoint,scoreChallenge,arcadeGrade} from "./arcade.mjs";

const $=id=>document.getElementById(id);
const game=atlasEntry($("game").dataset.id);
if(!game)throw Error("Unknown game cartridge");
const board=$("board"),ctx=board.getContext("2d"),aimControls=$("aim-controls");
const chassis=CHASSIS[game.chassis],craft=game.chassis==="craft",timed=["rhythm","rope"].includes(game.chassis);
const key="tabor-standalone:best:"+game.id;
const origin=performance.now();
let aim={x:.5,y:.55},round=0,total=0,caught=0,lastPointer=null,elapsed=0,best=0;
try{const value=Number(localStorage.getItem(key));if(Number.isInteger(value)&&value>=0&&value<=300)best=value;}catch{}
const ink={mint:"#9eedc4",blue:"#89bdec",gold:"#ffd188",muted:"#b5c9c2",grid:"#243e38",dark:"#10231e"};
const directions={left:[-.035,0],right:[.035,0],up:[0,-.035],down:[0,.035]};
const clamp=n=>Math.min(.96,Math.max(.04,n));
$("mechanic").textContent=chassis.name;
$("tip").textContent=chassis.hint;
aimControls.hidden=timed;
$("action").textContent=craft?"Check point":game.chassis==="rhythm"?"Strike":game.chassis==="rope"?"Release ring":"Throw";
function say(text){$("game-status").textContent=text;}
function play(){
  if(round>=3)return;
  if(craft&&caught<5){
    caught=tracePoint(checkpoints(game,round),caught,aim.x,aim.y);
    if(caught<5){say(caught+" of 5 checkpoints · reach the next number.");return;}
  }
  const points=scoreChallenge(game,elapsed,round,aim,false,caught);
  total+=points;round++;caught=0;
  $("score").textContent=total+" points";
  if(round<3){say(points+" points · attempt "+(round+1)+" of 3");return;}
  if(total>best){
    best=total;
    try{localStorage.setItem(key,String(best));}catch{}
  }
  say((arcadeGrade(total)??"Round complete")+" · "+total+" points · best "+best);
  $("action").disabled=true;
}
function reset(){
  round=0;total=0;caught=0;lastPointer=null;aim={x:.5,y:.55};
  $("score").textContent="0 points";$("action").disabled=false;
  say("Attempt 1 of 3"+(best?" · best "+best:""));
}
function coordinates(event){
  const r=board.getBoundingClientRect();
  return {x:clamp((event.clientX-r.left)/r.width),y:clamp((event.clientY-r.top)/r.height)};
}
function trace(from,to){
  const path=checkpoints(game,round);
  const count=Math.max(1,Math.ceil(Math.hypot(to.x-from.x,to.y-from.y)/.025));
  for(let i=1;i<=count;i++){
    caught=tracePoint(path,caught,from.x+(to.x-from.x)*i/count,from.y+(to.y-from.y)*i/count);
  }
  if(caught===5)return true;
  say(caught+" of 5 checkpoints · continue through the numbered path.");
  return false;
}
board.addEventListener("pointerdown",event=>{
  if(round>=3||lastPointer||event.button!==0)return;
  board.setPointerCapture(event.pointerId);aim=coordinates(event);
  lastPointer={id:event.pointerId,...aim};
  if(craft)trace(aim,aim);
});
board.addEventListener("pointermove",event=>{
  if(lastPointer?.id!==event.pointerId||round>=3)return;
  aim=coordinates(event);
  if(craft)trace(lastPointer,aim);
  lastPointer={id:event.pointerId,...aim};
});
board.addEventListener("pointerup",event=>{
  if(lastPointer?.id!==event.pointerId||round>=3)return;
  aim=coordinates(event);
  const done=craft&&trace(lastPointer,aim);lastPointer=null;
  if(done||!craft)play();
});
for(const event of ["pointercancel","lostpointercapture"])
  board.addEventListener(event,()=>{lastPointer=null;});
function nudge(direction){
  const move=directions[direction];if(!move)return;
  aim={x:clamp(aim.x+move[0]),y:clamp(aim.y+move[1])};
}
for(const b of aimControls.querySelectorAll("button"))b.addEventListener("click",()=>nudge(b.dataset.aim));
board.addEventListener("keydown",event=>{
  if(event.key.startsWith("Arrow")){event.preventDefault();if(!timed)nudge(event.key.slice(5).toLowerCase());}
  else if(event.key===" "||event.key==="Enter"){event.preventDefault();if(!event.repeat)play();}
});
$("action").addEventListener("click",play);$("replay").addEventListener("click",reset);
const {width:w,height:h}=board;
function dot(x,y,r,color,filled=false){
  ctx.beginPath();ctx.arc(x*w,y*h,r,0,Math.PI*2);
  ctx.strokeStyle=color;ctx.lineWidth=3;ctx.fillStyle=color;
  if(filled)ctx.fill();else ctx.stroke();
}
function line(points,color){
  ctx.beginPath();ctx.strokeStyle=color;ctx.lineWidth=2;
  points.forEach(([x,y],i)=>i?ctx.lineTo(x*w,y*h):ctx.moveTo(x*w,y*h));
  ctx.stroke();
}
function label(txt,x,y,color=ink.muted){
  ctx.font="600 20px system-ui";ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillStyle=color;ctx.fillText(txt,x*w,y*h);
}
function render(now){
  elapsed=(now-origin)/1000;
  const step=Math.min(round,2), v=arena(game,elapsed,step);
  ctx.fillStyle=ink.dark;ctx.fillRect(0,0,w,h);
  for(let x=0;x<=1;x+=.1)line([[x,0],[x,1]],ink.grid);
  for(let y=0;y<=1;y+=.1)line([[0,y],[1,y]],ink.grid);
  if(craft){
    const trail=checkpoints(game,step);line(trail,ink.muted);
    trail.forEach(([x,y],i)=>{dot(x,y,19,i<caught?ink.mint:ink.blue);label(String(i+1),x,y);});
    dot(aim.x,aim.y,5,ink.gold,true);
  }else if(game.chassis==="rhythm"){
    line([[.1,.5],[.9,.5]],ink.muted);
    dot(.1+.8*.72,.5,23,ink.gold);dot(.1+.8*v.pulse,.5,12,ink.mint,true);
    label("Strike inside the gold ring",.5,.3);
  }else if(game.chassis==="rope"){
    line([[.5,.15],[v.swing,.55]],ink.muted);
    dot(v.x,.55,25,ink.gold);dot(v.swing,.55,11,ink.mint,true);
    label("Release at the target",.5,.78);
  }else{
    dot(v.x,v.y,29,ink.gold);dot(v.x,v.y,8,ink.gold);
    line(flight(aim.x,aim.y,v.drift,game.id==="boomerang"),ink.mint);
    dot(aim.x,aim.y,6,ink.blue,true);
    if(game.chassis==="spin"){
      const angle=v.rotation*Math.PI*2;
      dot(.82,.77,30,ink.blue);line([[.82,.77],[.82+Math.cos(angle)*.04,.77+Math.sin(angle)*.067]],ink.mint);
      label("Spin position",.82,.9);
    }
  }
  requestAnimationFrame(render);
}
reset();requestAnimationFrame(render);
if("serviceWorker" in navigator&&location.protocol==="https:")
  navigator.serviceWorker.register("./sw.js").catch(()=>{});
