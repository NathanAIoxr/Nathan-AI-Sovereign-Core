import {TAU,clamp,gap} from "./track-baller.mjs";

const profiles = {
  storm:["Hurricane","Weather","Circle either way and lift. Bigger loops reach farther. Sweep up the field of debris.","Make a loop", "SWIRL_RPM_ACCUMULATOR"],
  whirl:["Whirlpool","Water","Draw tight circles over the floating markers. Match the arrow to pull them into the whirlpool.","Make a whirlpool","SWIRL_RPM_ACCUMULATOR"],
  sword:["Swordplay","Rhythm","Swipe through the arrow target. Match its direction for a bonus. Hold and release when the guard ring turns green.","Try the slash","DIRECTIONAL_SNAP_FLICK"],
  ball:["Spin Ball","Sports","Flick from the ball toward a pocket. Add a curved finish for side spin.","Try a shot","AIMED_ROLL_AND_CURVE"],
  magic:["Spellcasting","Magic","Trace a figure-eight to open a portal. A steady circle conjures a ward.","Trace a figure-eight","SWIRL_RPM_ACCUMULATOR"],
  dj:["DJ Deck","Music","Scrub the platter back and forth. Keep your drag and releases in rhythm with the beat ring.","Try a scratch","SCRUB_REVERSALS"],
  forge:["Forge Bellows","Craft","Scrub left and right to stoke the forge. Heat falls between strokes. Release above the green line.","Pump bellows","SCRUB_REVERSALS"],
  globe:["Globe Explorer","Navigation","Drag in any direction to rotate the globe. Bring amber landmarks into the center window.","Roll toward a landmark","CONTINUOUS_ROLL"],
  dial:["Combination Dial","Precision","Turn the fictional puzzle dial in the arrow’s direction. Reach each marked turn and lift.","Turn the dial","PRECISION_MICRO_TURN"],
  pottery:["Pottery Wheel","Craft","Tap one of the three clay bands to select it. Turn around the wheel to shape that band to its dashed outline.","Shape a band","PRECISION_MICRO_TURN"],
  lift:["Propeller Lift","Flight","Circle to keep the propeller turning. Rise to the marked band and stay there through the next checkpoint.","Spin to lift","SWIRL_RPM_ACCUMULATOR"],
  fish:["Fishing Reel","Tension","Use controlled clockwise turns. Reel toward the center while keeping tension inside the green band.","Reel in","PRECISION_MICRO_TURN"],
};
export const catalog=Object.fromEntries(Object.entries(profiles).map(([id,[title,group,hint,example,gestureOutputMode]])=>
  [id,{id,title,group,hint,example,controllerOverlay:{widgetType:"TABOR_TRACKBALL",gestureOutputMode}}]));
const swordTargets=[{x:0,y:0,angle:-.24},{x:.19,y:-.14,angle:2.2},{x:-.17,y:.12,angle:-1.13}];
export const dialTargets=[.25,-.4,.19];
export const pockets=[-.24,0,.24];
export const potteryTargets=[.72,1.28,.78];
export const globeTargets=[[.62,.24,.747],[-.43,.47,.771],[.11,-.51,-.852],[-.65,-.15,.745]];
export const guardOpen=clock=>clock%2.6>=1.58&&clock%2.6<=2.16;
const ballStart={x:0,y:.36};

export function createRound(id){
  if(!catalog[id]) throw new RangeError("Unknown game");
  const debris=Array.from({length:13},(_,i)=>({x:Math.cos(i*2.399)*(.1+(i%6)*.052),
    y:Math.sin(i*2.399)*(.1+(i%6)*.052),active:true,i}));
  return {id,time:0,score:0,progress:0,notice:"",debris,vortex:null,shot:null,target:0,clock:0,
    spark:0,heat:0,height:.16,lift:0,tension:.4,reel:0,band:1,clay:[1,1,1],dial:0,landmarks:new Set(),done:false};
}
function say(game,text,points=0){
  game.notice=text;game.score+=points;
}
function objective(game,text,bonus=0){
  say(game,text,bonus);game.done=true;
}
function segmentGap(a,b,p){
  const dx=b.x-a.x,dy=b.y-a.y;
  const t=clamp(((p.x-a.x)*dx+(p.y-a.y)*dy)/(dx*dx+dy*dy||1),0,1);
  return gap(p,{x:a.x+t*dx,y:a.y+t*dy});
}
export function updateLive(game,stroke,last){
  if(game.done||!stroke) return;
  const bandDelta=stroke.dial-(last?.dial??0);
  const reversalDelta=Math.max(0,stroke.reversals-(last?.reversals??0));
  if(game.id==="forge"&&reversalDelta){
    game.heat=clamp(game.heat+reversalDelta*.17,0,1.1);
  }
  if(game.id==="lift"&&stroke.length>.25&&Math.abs(stroke.rpm)>20){
    game.lift=clamp(game.lift+Math.abs(stroke.turn-(last?.turn??0))*.8,0,1);
  }
  if(game.id==="dj"&&stroke.length>.13) game.spark=Math.max(game.spark,.06+Math.abs(stroke.vx)*.055);
  if(game.id==="fish"&&bandDelta){
    game.tension=clamp(game.tension+Math.abs(bandDelta)*.12-(bandDelta<0?.13:0),0,1);
    if(bandDelta>0&&game.tension>=.32&&game.tension<=.76) game.reel=clamp(game.reel+bandDelta/11,0,1);
  }
  if(game.id==="pottery"&&bandDelta){
    game.clay[game.band]=clamp(game.clay[game.band]+bandDelta*.11,.52,1.48);
  }
}
export function vortexFor(game,stroke){
  if(stroke?.kind!=="swirl") return null;
  const turn=Math.abs(stroke.turn), radius=clamp(stroke.length/Math.max(.8,turn)*.32,.15,.61);
  if(game.id==="whirl"&&(radius>.34||Math.sign(stroke.turn)!==(game.progress%2?-1:1))) return null;
  return {x:stroke.center.x,y:stroke.center.y,radius,sign:Math.sign(stroke.turn),force:clamp(turn,.68,3),age:0};
}
export function endMove(game,s,gain=1){
  if(game.done||!s) return;
  switch(game.id){
    case "storm":
    case "whirl": {
      const vortex=vortexFor(game,s);
      if(!vortex){say(game,game.id==="whirl"?"Try a tighter loop in the direction of the arrow.":"Draw a wider loop in one direction.");break;}
      game.vortex=vortex; game.progress++;
      say(game,(vortex.sign>0?"Clockwise":"Counterclockwise")+" vortex released.");
      break;
    }
    case "sword": {
      if(s.kind==="hold"){
        if(guardOpen(game.clock)){game.progress++;say(game,"Timed parry. +80",80);}
        else say(game,"Guard raised. Lift during the green window for a timed parry.");
        break;
      }
      const t=swordTargets[game.target%swordTargets.length];
      const hit=s.path.slice(1).some((p,i)=>segmentGap(s.path[i],p,t)<.086);
      if(!hit||s.length<.14){say(game,"Draw a slash through the target.");break;}
      const matched=Math.cos(s.angle-t.angle)>.76;
      game.target++; game.progress++; game.spark=.45;
      say(game,matched?"On-angle slash. +100":"Target hit. +45",matched?100:45);
      break;
    }
    case "ball": {
      if(game.shot) break;
      if(gap(ballStart,s.start)>.17||s.dy>-.085){say(game,"Start near the ball and flick toward the pockets.");break;}
      const useVelocity=s.vy<-.14;
      const angle=Math.atan2(useVelocity?s.vx:s.dx,-(useVelocity?s.vy:s.dy));
      const speed=.55+.95*clamp(s.power*gain,0,1);
      game.shot={...ballStart,vx:Math.sin(angle)*speed,vy:-Math.cos(angle)*speed,
        spin:clamp(s.turn*5*gain,-2,2),age:0};
      say(game,Math.abs(game.shot.spin)>.1?"Curved shot rolling.":"Straight shot rolling.");
      break;
    }
    case "magic":
      if(s.kind==="figure-eight"){
        game.progress++; game.spark=1.4;
        say(game,"Portal opened. +150",150);
      }else if(s.kind==="swirl"){
        game.spark=.7; say(game,"A ward is up. +35",35);
      }else say(game,"Cross the center and loop in the opposite direction to open a portal.");
      break;
    case "dj":
      if(s.reversals<2){say(game,"Make at least two back-and-forth reversals.");break;}
      game.progress++;
      {const bonus=game.clock%.6<.16?40:0;const points=s.reversals*12+bonus;
        say(game,(bonus?"On beat. ":"Scratch recorded. ")+"+"+points,points);}
      break;
    case "forge":
      if(game.heat>=.72){game.progress++; game.heat=.38; say(game,"Metal ready. +100",100);}
      else say(game,"Keep scrubbing until the forge reaches the green line.");
      break;
    case "globe": say(game,"Center an amber landmark in the reticle.");break;
    case "dial": {
      const target=dialTargets[game.progress%dialTargets.length];
      if(Math.abs(s.dial/TAU-target)>.063){say(game,"The dial reads "+Math.round(s.dial/TAU*360)+"°. Follow the marked angle.");break;}
      game.progress++; game.dial=0; say(game,"Tumbler "+game.progress+" set. +90",90); break;
    }
    case "pottery":
      if(s.kind==="tap"){game.band=clamp(Math.floor((s.end.y+.33)/.22),0,2);say(game,"Clay band "+(game.band+1)+" selected.");}
      else if(game.clay.every((r,i)=>Math.abs(r-potteryTargets[i])<.105)) objective(game,"Vessel shaped. +300",300);
      else say(game,"Finish matching each of the three dashed outlines.");
      break;
    case "lift":
      if(s.kind==="swirl") game.lift=clamp(game.lift+.35,0,1);
      say(game,"Keep circling to hold altitude."); break;
    case "fish":
      if(game.tension>.88){game.tension=.44; game.reel=Math.max(0,game.reel-.16);say(game,"Line slipped. Use smaller turns.");}
      else if(game.reel>=1) objective(game,"Catch reeled in. +300",300);
      else say(game,"Keep the tension inside the green band.");
      break;
  }
  const goals={sword:5,ball:3,magic:3,dj:5,forge:3,dial:3};
  if(goals[game.id]&&game.progress>=goals[game.id]) objective(game,"Round complete. "+game.score+" pts.");
}
export function tickGame(game,dt,live,pins=[]){
  if(game.done) return;
  game.time+=dt;game.clock+=dt;game.spark=Math.max(0,game.spark-dt);
  if(game.id==="forge") game.heat=Math.max(0,game.heat-dt*.08);
  if(game.id==="fish") game.tension=Math.max(.24,game.tension-dt*.15);
  if(game.id==="lift"){
    game.lift=Math.max(0,game.lift-dt*.49);
    game.height=clamp(game.height+(game.lift-.27)*dt*.68,.12,1);
    if(game.height>.51&&game.height<.84) game.progress+=dt;
    if(game.height>=.88) game.progress=Math.max(0,game.progress-dt*.8);
    if(game.progress>=2.2) objective(game,"Flight checkpoint held. +300",300);
  }
  if(game.id==="globe"){
    pins.forEach(([x,y,z],i)=>{
      if(z>0&&Math.hypot(x,y)<.19&&!game.landmarks.has(i)){
        game.landmarks.add(i); say(game,"Landmark "+game.landmarks.size+" centered. +75",75);
      }
    });
    if(game.landmarks.size===globeTargets.length) objective(game,"Globe charted. "+game.score+" pts.");
  }
  if(game.vortex){
    game.vortex.age+=dt;
    if(game.vortex.age>3) game.vortex=null;
  }
  const vortex=(game.id==="storm"?vortexFor(game,live):null)??game.vortex;
  if(vortex){
    for(const item of game.debris){
      const x=vortex.x-item.x,y=vortex.y-item.y,d=Math.hypot(x,y);
      if(!item.active||d>vortex.radius) continue;
      if(d<.04){item.active=false; game.score+=15;continue;}
      const factor=dt*(1.2+vortex.force*.8);
      item.x+=(x-vortex.sign*y*.59)*factor;item.y+=(y+vortex.sign*x*.59)*factor;
    }
    if(game.debris.every(item=>!item.active)) objective(game,"Field cleared. "+game.score+" pts.");
  }
  if(game.shot){
    const shot=game.shot;
    shot.age+=dt;shot.vx+=shot.spin*dt;shot.spin*=Math.exp(-dt*1.95);
    shot.x+=shot.vx*dt;shot.y+=shot.vy*dt;
    if(shot.y<=-.3||Math.abs(shot.x)>.72||shot.age>3){
      const pocket=shot.y<=-.3?pockets.findIndex(x=>Math.abs(x-shot.x)<.087):-1;
      if(pocket>=0){
        game.progress++;
        say(game,pocket===1?"Center pocket. +100":"Outside pocket. +60",pocket===1?100:60);
      }else say(game,"Missed the pockets. Try another release angle.");
      game.shot=null;
      if(game.progress>=3) objective(game,"Three pockets sunk. "+game.score+" pts.");
    }
  }
}
export function getSwordTarget(game){return swordTargets[game.target%swordTargets.length];}
export function makeExample(game,alternative=false){
  const count=97;
  return Array.from({length:count},(_,i)=>{
    const f=i/(count-1);
    let x=0,y=0,t=f*840;
    if(["storm","whirl","dial","pottery","lift","fish"].includes(game.id)){
      const sign=alternative?-1:1;
      const turns=game.id==="dial"?dialTargets[game.progress%dialTargets.length]:
        game.id==="whirl"?(game.progress%2?-1:1)*1.07:game.id==="pottery"?
        (potteryTargets[game.band]-game.clay[game.band])/(TAU*.11):game.id==="fish"?.43:1.22*sign;
      const radius=game.id==="whirl"?.123:game.id==="fish"?.15:.22;
      x=Math.cos(turns*f*TAU)*radius;y=Math.sin(turns*f*TAU)*radius;
    }else if(game.id==="sword"){
      const target=getSwordTarget(game);
      const d=alternative?0:(f-.5)*.51;x=target.x+Math.cos(target.angle)*d;y=target.y+Math.sin(target.angle)*d;t=f*(alternative?520:250);
    }else if(game.id==="ball"){
      x=(alternative?.185:0)*Math.sin(f*2.15);y=.36-f*.52;t=f*255;
    }else if(game.id==="magic"){
      const second=f>=.5;
      const a=(second?1:-1)*(f*2-(second?1:0))*TAU+(second?Math.PI:0);
      x=(second?1:-1)*.15+Math.cos(a)*.15;y=Math.sin(a)*.15;t=f*1070;
    }else if(game.id==="globe"){
      x=f*.29-.13;y=-f*.115;t=f*420;
    }else{
      x=Math.sin(f*TAU*3)*.24;t=f*690;
    }
    return {x,y,t,pointerType:"sample",pressure:0};
  });
}
