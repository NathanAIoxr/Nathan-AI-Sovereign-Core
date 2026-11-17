// Generated from the Dual-Screen Arcade by ../build.mjs.
const TOP = {
  ring: ["Hook & Ring","Release when the swinging ring lines up with the hook."],
  darts: ["Darts","Drag to aim. Release over the bullseye."],
  hoops: ["Basketball Free Throws","Hold, then release in the green power band."],
  bottle: ["Bottle Flip","Hold to set spin. Release in the green band."],
  archery: ["Archery","Drag to aim. Hold to draw, then release."],
  cornhole: ["Cornhole","Drag sideways to aim. Release in the green band."],
  ramp: ["Ramp Roll","Drag toward a pocket. Hold to build power."],
  bank: ["Bank Shot Billiards","Drag to aim at the upper rail. Follow the bank line."]
};
const BOTTOM = {
  chain:["Chain Link","Drag matching orbs. Close a square to clear its color."],
  gravity:["Gravity Drop & Merge","Tap to drop. Match spheres and stay below the line."],
  fit:["Block Fit","Drag a shape, or select it and tap an anchor."],
  slam:["Slide & Slam","Swipe to slide. Collide matching blocks; chain the slams."],
  tube:["Tube Sort","Tap a source vial and a destination."],
  mines:["Micro-Mines","Tap to uncover. Hold to flag."],
  dice:["Dice Rollover","Swipe a die into empty space, or select it and tap a neighbor."],
  pipe:["Pipe Connect","Rotate tiles, connect both valves, then open the valve."]
};
const RULE = Object.freeze({enemy:180,health:100,shield:60,armor:3,load:8,capacity:12,initial:3,attackMs:6500});
const clamp = (value,min,max) => Math.min(max,Math.max(min,value));
const random = (max) => Math.floor(Math.random()*max);
const shuffled = (source) => {
  const out = [...source];
  for(let i=out.length-1;i>0;i--){ const j=random(i+1); [out[i],out[j]]=[out[j],out[i]]; }
  return out;
};
const coordinate = (n,x,y) => x>=0 && y>=0 && x<n && y<n ? y*n+x : -1;
const around = (size,index,diagonal=false) => {
  const x=index%size,y=Math.floor(index/size);
  const offsets=diagonal?[[0,-1],[1,0],[0,1],[-1,0],[-1,-1],[1,-1],[-1,1],[1,1]]:[[0,-1],[1,0],[0,1],[-1,0]];
  return offsets.map(([dx,dy])=>coordinate(size,x+dx,y+dy)).filter(i=>i>=0);
};
function newRound(top,bottom,pace) {
  if(!TOP[top]||!BOTTOM[bottom]||!["charge","frenzy"].includes(pace)) throw new Error("Unknown game or pace");
  return {top,bottom,pace,result:null,enemy:RULE.enemy,health:RULE.health,shield:RULE.shield,armor:RULE.armor,
    ammo:RULE.initial,charge:0,bonus:0,critical:false,guaranteed:0,assist:0,rapid:0,freeze:0,beam:0,beamCarry:0,
    attack:RULE.attackMs,boards:{},elapsed:0,hits:0,shots:0,puzzleMoves:0,puzzleDamage:0,topDamage:0,
    playedBottom:new Set([bottom]),attempt:null};
}
function damage(round,raw,pierce=false,source="bottom"){
  if(round.result||raw<=0) return 0;
  const dealt=Math.min(round.enemy,Math.max(1,Math.round(raw)-(pierce?0:round.armor)));
  round.enemy-=dealt;
  if(source==="top")round.topDamage+=dealt;else round.puzzleDamage+=dealt;
  if(round.enemy===0)round.result="won";
  return dealt;
}
function loadAttempts(round,amount){
  round.ammo=Math.min(RULE.capacity,round.ammo+amount);
}
function grant(round,reward={}){
  if(round.result)return;
  round.puzzleMoves++;
  const {charge=0,extra=0,damage:hit=0,pierce=false,shield=0,heal=0,bonus=0,critical=false,guaranteed=0,assist=0,rapid=0,beam=0,freeze=0}=reward;
  const total=round.charge+charge;
  round.charge=total%RULE.load;
  loadAttempts(round,Math.floor(total/RULE.load)+extra);
  round.shield=Math.min(RULE.shield,round.shield+shield);
  round.health=Math.min(RULE.health,round.health+heal);
  round.bonus=Math.min(300,round.bonus+bonus);
  round.critical||=critical;
  round.guaranteed+=guaranteed;
  round.assist=Math.max(round.assist,assist);
  round.rapid=Math.max(round.rapid,rapid);
  round.freeze=Math.max(round.freeze,freeze);
  round.beam=Math.max(round.beam,beam);
  damage(round,hit,pierce);
}
function beginAttempt(round){
  if(round.result||round.attempt||(round.ammo===0&&round.rapid===0))return null;
  if(round.rapid===0)round.ammo--;
  const guaranteed=round.guaranteed>0;
  if(guaranteed)round.guaranteed--;
  round.shots++;
  round.attempt={id:round.shots,guaranteed};
  return round.attempt;
}
function endAttempt(round,attempt,result){
  if(round.attempt!==attempt)return 0;
  round.attempt=null;
  if(round.result||result<=0)return 0;
  round.hits++;
  const raw=result*(1+round.bonus/100)*(round.critical?1.75:1);
  round.bonus=0;
  round.critical=false;
  return damage(round,raw,false,"top");
}
function updateBridge(round,dt){
  if(round.result)return;
  round.elapsed+=dt;
  const activeBeam=Math.min(dt,round.beam);
  for(const effect of ["assist","rapid","freeze","beam"])round[effect]=Math.max(0,round[effect]-dt);
  if(activeBeam){
    round.beamCarry+=activeBeam;
    while(round.beamCarry>=250&&!round.result){round.beamCarry-=250;damage(round,4,true);}
  }
  if(round.result||round.pace!=="frenzy"||round.freeze>0)return;
  round.attack-=dt;
  if(round.attack>0)return;
  round.attack+=RULE.attackMs;
  const shieldLost=Math.min(round.shield,20);
  round.shield-=shieldLost;
  round.health=Math.max(0,round.health-(20-shieldLost));
  if(round.health===0)round.result="lost";
}



const W=560,H=208;
const GREEN="#61edb6",GOLD="#fbd18b",WHITE="#f2f5fc",DIM="#9aafcd";
const aimGames=new Set(["darts","archery","cornhole","ramp","bank"]);
const meterGames=new Set(["hoops","bottle","archery","cornhole","ramp"]);
const pill=(c,x,y,w,h,r=5)=>{
  c.beginPath();c.roundRect(x,y,w,h,r);c.fill();
};
function line(c,points,color=WHITE,width=2){
  c.beginPath();c.moveTo(...points[0]);
  for(const p of points.slice(1))c.lineTo(...p);
  c.strokeStyle=color;c.lineWidth=width;c.stroke();
}
function dot(c,x,y,r,color){
  c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fillStyle=color;c.fill();
}
function label(c,text,x,y,color=DIM,size=13){
  c.font="600 "+size+"px system-ui";c.fillStyle=color;c.fillText(text,x,y);
}
function aimPoint(id,aim,time,assist){
  const drift=assist ? .38 : 1;
  if(id==="darts")return [aim.x+Math.sin(time/195)*13*drift,aim.y+Math.cos(time/244)*9*drift];
  if(id==="archery")return [aim.x+Math.sin(time/239)*19*drift,aim.y+Math.cos(time/273)*12*drift];
  return [aim.x,aim.y];
}
function ringX(time,assist){return 280+Math.sin(time/(assist?640:435))*(assist?126:148);}
function ringY(x){return 12+Math.sqrt(150**2-(x-280)**2);}
function powerAt(held){return clamp(held/1000,0,1);}
const defaultAim=id=>({x:id==="bank"?245:id==="cornhole"?205:id==="ramp"?210:265,y:108});
function arc(from,to,height){return (t)=>[from[0]+(to[0]-from[0])*t,from[1]+(to[1]-from[1])*t-Math.sin(Math.PI*t)*height];}
function pathThrough(points,t){
  const segment=Math.min(points.length-2,Math.floor(t*(points.length-1)));
  const fraction=t*(points.length-1)-segment;
  return points[segment].map((v,i)=>v+(points[segment+1][i]-v)*fraction);
}
function evaluateShot(id,input){
  const {aim,time,held,assist,guaranteed}=input;
  const p=powerAt(held);
  const [x,y]=aimPoint(id,aim,time,assist);
  const tolerance=assist?1.5:1;
  let score=0,geo,kind=id,angle=0,duration=630,rank="";
  switch(id){
    case "ring": {
      const start=ringX(time,assist), travel=guaranteed?370:start;
      const error=Math.abs(travel-370);
      score=error<=19*tolerance?24:0;
      geo=arc([start,ringY(start)],[score?370:travel,119],45);
      rank=score?"Ringer":"Missed the hook";
      duration=480;break;
    }
    case "darts": {
      const end=guaranteed?[280,103]:[x,y],error=Math.hypot(end[0]-280,end[1]-103);
      score=error<=13*tolerance?29:error<=36*tolerance?21:error<=68*tolerance?13:0;
      geo=arc([280,182],end,20);rank=score===29?"Bullseye":score?"Dart scored":"Off the board";
      duration=360;break;
    }
    case "hoops": {
      const error=guaranteed?0:p-.62;
      score=Math.abs(error)<=.105*tolerance?25:0;
      geo=arc([100,169],[score?427:427+error*280,score?103:103+Math.abs(error)*65],68);
      rank=score?"Basket":"Missed the basket";break;
    }
    case "bottle": {
      const spin=guaranteed?1:.25+1.55*p;
      score=Math.abs(spin-1)<=.16*tolerance?24:0;
      geo=arc([211,145],[333,145],78);angle=score?1:spin;
      rank=score?"Upright landing":"Bottle tipped";break;
    }
    case "archery": {
      const end=guaranteed?[280,108]:[x,y+(Math.max(0,.54-p)*95)];
      const error=Math.hypot(end[0]-280,end[1]-108);
      score=error<=13*tolerance?30:error<=36*tolerance?21:error<=64*tolerance?13:0;
      geo=arc([95,164],end,16);rank=score===30?"Bullseye":score?"Arrow scored":"Off the target";
      duration=410;break;
    }
    case "cornhole": {
      const end=guaranteed?[280,90]:[x,90+(.62-p)*145];
      const error=Math.hypot(end[0]-280,end[1]-90);
      score=error<=16*tolerance?29:Math.abs(end[0]-280)<=69&&end[1]>=68&&end[1]<=150?14:0;
      geo=arc([280,178],end,71);rank=score===29?"Through the hole":score?"On the board":"Missed the board";break;
    }
    case "ramp": {
      const aimX=guaranteed?280:x;
      const nearest=[160,220,280,340,400].reduce((a,b)=>Math.abs(aimX-a)<Math.abs(aimX-b)?a:b);
      const width=nearest===280?16:nearest===220||nearest===340?21:25;
      const reach=guaranteed||p>=.40&&p<=.93;
      score=reach&&Math.abs(aimX-nearest)<=width*tolerance?(nearest===280?30:(nearest===220||nearest===340?20:10)):0;
      geo=arc([280,184],[score?nearest:aimX,reach?69:146],22);rank=score===30?"Center pocket":score?"Pocket scored":"Missed the pockets";break;
    }
    case "bank": {
      const bx=guaranteed?337:clamp(x,220,430);
      const rightY=36+(495-bx)*(150-36)/(bx-179);
      score=Math.abs(rightY-150)<=18*tolerance?29:0;
      const points=[[103,174],[179,150],[bx,36],[495,score?150:clamp(rightY,48,181)]];
      geo=t=>pathThrough(points,t);rank=score?"Bank shot":"Missed the pocket";
      duration=790;break;
    }
  }
  return {score,geo,kind,angle,duration,rank};
}

export {newRound,grant,beginAttempt,endAttempt,updateBridge,evaluateShot,ringX};
