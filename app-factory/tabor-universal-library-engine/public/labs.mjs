import { addTrackBallerToArcadeAction } from "../../tabor-tracker-ball/public/track-baller.mjs";
import { createClock } from "../../grapple-it/public/fixed-clock.mjs";
import { makeRope, stepRope } from "../../grapple-it/public/rope.mjs";
import { evaluateShot, ringX } from "./arcade-core.mjs";
import { arm, force, project, stepProbe } from "./engine.mjs";

export const active=Object.freeze({
  ring:["Hook & Ring drill","Release at the hook","Tap or swipe to release when the ring meets the hook."],
  grapple:["Grapple It swing drill","Release swing","Swing on the original 16-node rope. Release at the green gate."],
  village:["BIBLeTopia village drill","Place tile","Place roads and homes on the village grid. A swipe reports a Tracker Ball action."],
  sword:["Gesture Sword-Play drill","Strike selected rune","Swipe across a glowing rune or move the marker with the direction controls."],
  fishing:["Fishing-Rod Line Release drill","Cast the line","Flick to cast toward the ripple. Use direction buttons to place the cast marker."],
  65:["Molecular Geometry & Bond Rotator","Lock bond angle","Roll a helix in three axes. Pinch to change the simplified bond angle, then snap to 109.5°."],
  66:["Orbital Mechanics & Gravity-Assist Lab","Launch probe","Move the launch marker. Adjust speed to compare paths around a moving secondary body."],
  67:["Wave Interference & Superposition Pool","Switch second source","Drag to move the ripple source. Compare interference with one source and two."],
  68:["Vector Field & Force Line Mapper","Reverse blue pole","Swipe a path through the arrows or move the blue pole. Tilt rotates the field."],
  69:["Fractal & Chaos Attractor Explorer","Change Lorenz parameter","Roll to inspect the trajectory. Select a different Lorenz parameter to change the long-run path."],
  77:["Irrigation Network & Contour Flow Map","Release water","Move the outlet, then release water. Drops follow the modeled slope, including tilt."],
  80:["Mechanical Linkage & Gear Train Spinner","Change gear ratio","Swipe the gears and watch the driven gear reverse. Change its tooth count to change speed."],
  81:["Circuit Breaker & Field Lab","Snap component","Pinch or drag the field probe onto the green terminal. Compare the simulated capacitive field."],
  84:["Robotics Inverse-Kinematics Solver","Switch target","Move the endpoint target. Compare the solved joint angles with the end-effector reach."],
  94:["Call-Number Spatial Sorter","Shelve book","Choose the correct Library of Tabor class for the call-number prefix, then shelve it."],
  96:["Personal Knowledge Vault Sphere","Rotate vault","Save a note with tags on this browser. Search notes and rotate the vault."],
  98:["Digital Preservation & Bit-Rot Visualizer","Flip one stored bit","Introduce a bit error and compare the stored CRC with the original checksum."],
  101:["Universal Module Loader & Test Harness","Verify engine","Check the ledger slots, active cartridges, bridge rewards, and quaternion orientation."]
});
const C={white:"#eaf4ef",muted:"#86a99e",gold:"#edc572",mint:"#8ff1ca",blue:"#7ebbf8",rose:"#f794a4",dark:"#0a1818"};
const clamp=(v,min,max)=>Math.min(max,Math.max(min,v));
const near=(a,b,r)=>Math.hypot(a[0]-b[0],a[1]-b[1])<=r;
const TAU=2*Math.PI;
const presets=["QA","TK","SB","GV","BS","Z"];
const bytes=()=>[84,65,66,79,82,32,86,55,32,65,82,67,72,73,86,69];
const crc=values=>{
  let hash=0xffffffff;
  for(const byte of values){
    hash^=byte;
    for(let b=0;b<8;b++)hash=(hash>>>1)^((hash&1)?0xedb88320:0);
  }
  return ((hash^0xffffffff)>>>0).toString(16).padStart(8,"0").toUpperCase();
};
export function labState(id){
  const lut={
    ring:()=>({}),grapple:()=>({clock:createClock(),rope:makeRope([0,-.72],[0,.48],1.23)}),
    village:()=>({tiles:Array(9).fill(0),tile:4}),
    sword:()=>({rune:0,spark:0}),fishing:()=>({flight:null,landing:null}),
    65:()=>({angle:102}),66:()=>({speed:.72,probe:null,trail:[]}),
    67:()=>({two:true,source:[.65,.05]}),68:()=>({source:[.53,0],negative:true,trace:[]}),
    69:()=>({rho:28,abc:[.12,1,1.01],trail:[]}),77:()=>({drops:[]}),
    80:()=>({turn:0,teeth:14}),81:()=>({locked:false}),
    84:()=>({target:[.61,-.29]}),94:()=>({order:0,correct:0}),96:()=>({}),98:()=>({original:bytes(),stored:bytes(),flips:0}),101:()=>({})
  };
  if(!lut[id])throw RangeError("Cartridge is not runnable");
  return {time:0,point:[0,0],...lut[id]()};
}
function area(ctx,canvas){
  const width=canvas.clientWidth,height=canvas.clientHeight;
  if(width<=0||height<=0)return null;
  const ratio=Math.min(2,globalThis.devicePixelRatio||1);
  const w=Math.round(width*ratio),h=Math.round(height*ratio);
  if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}
  ctx.setTransform(ratio,0,0,ratio,width/2,height/2);
  return {width,height,scale:Math.min(width,height)/2.3};
}
export function labPoint(canvas,point){
  const w=canvas.clientWidth,h=canvas.clientHeight,scale=Math.min(w,h)/2.3||1;
  return [point.x*Math.min(w,h)/scale,point.y*Math.min(w,h)/scale];
}
function polar(x,y,d,a){return [x+d*Math.cos(a),y+d*Math.sin(a)];}
function ropeEnd(l){return [.86*Math.sin(l.time*2.65),.44+.22*Math.cos(l.time*5.3)];}
function secondary(t){return [.55*Math.cos(t*.57),.55*Math.sin(t*.57)];}
function terrain(x,y,tilt){return .28*Math.sin(x*4)*Math.cos(y*3)+.34*y+tilt[0]*x+tilt[1]*y;}
const runes=[[0,0],[-.64,-.36],[.59,-.19],[-.34,.43],[.71,.38]];
function crossRune(path,p,r=.16){
  for(let i=1;i<path.length;i++){
    const [a,b]=[path[i-1],path[i]],dx=b[0]-a[0],dy=b[1]-a[1],s=dx*dx+dy*dy;
    const t=s?clamp(((p[0]-a[0])*dx+(p[1]-a[1])*dy)/s,0,1):0;
    if(near([a[0]+dx*t,a[1]+dy*t],p,r))return true;
  }
  return false;
}
function strike(l,bus,hit){
  if(!bus.emit("skill-shot",{score:hit?24:0}))return "Reload using the lower sequence, or reset the bridge.";
  if(!hit)return "The swipe missed the target rune.";
  l.spark=l.time+.4;l.rune=(l.rune+1)%runes.length;return "Rune struck · damage sent through the bridge.";
}
function ripple(t){return [.20+.35*Math.sin(t*.8),-.18+.22*Math.cos(t*.6)];}
function castLine(l,bus,endpoint){
  if(l.flight)return "Cast in flight.";
  const hit=near(endpoint,ripple(l.time+.76),.27);
  if(!bus.emit("skill-shot",{score:hit?21:0}))return "Reload using the lower sequence, or reset the bridge.";
  l.flight={from:l.time,to:endpoint,hit};return hit?"Cast on the ripple · bridge scored":"Cast outside the ripple.";
}

export function labStep(id,l,dt,tilt,pack){
  l.time+=dt;
  switch(String(id)){
    case "grapple":
      l.clock.frame(l.time*1000,step=>stepRope(l.rope,[0,-.72],ropeEnd(l),step));
      break;
    case "fishing":
      if(l.flight&&l.time-l.flight.from>=.76){l.landing=l.flight.to;l.flight=null;}
      break;
    case "66":
      if(!l.probe)break;
      for(let i=0;i<4;i++)stepProbe(l.probe,[{p:[0,0],strength:.32},{p:secondary(l.time),strength:.028}],dt/4);
      if(l.trail.length>=170)l.trail.shift();
      l.trail.push([...l.probe.p]);
      if(Math.hypot(...l.probe.p)>2.4||l.time-l.launched>17)l.probe=null;
      break;
    case "69":
      for(let i=0;i<3;i++){
        const [x,y,z]=l.abc,d=Math.min(.009,dt*.66);
        l.abc=[x+d*10*(y-x),y+d*(x*(l.rho-z)-y),z+d*(x*y-8*z/3)];
        l.trail.push(l.abc);
        if(l.trail.length>550)l.trail.shift();
      }
      break;
    case "77":
      for(const drop of l.drops){
        const e=.012,[x,y]=drop.p;
        const gx=(terrain(x+e,y,tilt)-terrain(x-e,y,tilt))/(2*e);
        const gy=(terrain(x,y+e,tilt)-terrain(x,y-e,tilt))/(2*e);
        drop.p=[x-gx*dt*.42,y-gy*dt*.42];drop.age+=dt;
      }
      l.drops=l.drops.filter(({p,age})=>age<12&&Math.abs(p[0])<1.35&&Math.abs(p[1])<1.08);
      break;
    case "81":
      if(!l.locked&&pack.physics_profile.gravity)l.point[1]=clamp(l.point[1]+pack.physics_profile.gravity*dt*.04,-1,1);
      break;
  }
}
export function moveLab(id,l,p,gesture){
  l.point=p;
  if(id==="67")l.source=p;
  if(id==="68"){l.source=p;if(gesture){l.trace.push(p);if(l.trace.length>90)l.trace.shift();}}
  if(id==="84")l.target=p;
  if(id==="81"&&!near(p,[.56,0],.2))l.locked=false;
}
export function gripLab(id,l,grip){
  if(id==="65")l.angle=clamp(109.5+(grip.scale-1)*65,45,160);
  if(id==="66")l.speed=clamp(.72*grip.scale,.25,1.85);
}
export function releaseLab(id,l,gesture,bus,inputTime){
  if(id==="ring"||id==="grapple")return fireLab(id,l,bus,inputTime);
  if(id==="sword"&&gesture.kind==="swipe")
    return strike(l,bus,crossRune(gesture.path.map(p=>[p.x*2.3,p.y*2.3]),runes[l.rune]));
  if(id==="fishing"&&gesture.kind==="swipe")
    return castLine(l,bus,[clamp(l.point[0]+gesture.dx*.4,-1.22,1.22),clamp(l.point[1]+gesture.dy*.4,-.77,.77)]);
  if(id==="80")l.turn+=gesture.turn*TAU+gesture.dx*4;
  if(id==="village"){
    const action=addTrackBallerToArcadeAction({kind:"gesture",track:gesture.path,duration:gesture.duration},1);
    return "Village input · "+(action.trackBaller?.kind??gesture.kind);
  }
  return null;
}
function fireLab(id,l,bus,time){
  if(!bus.round.ammo&&!bus.round.rapid)return "Solve the bottom sequence to reload.";
  const score=id==="ring"?evaluateShot("ring",{aim:{x:0,y:0},time,held:600,assist:bus.round.assist>0,guaranteed:false}).score:
    ropeEnd(l)[0]>.63?25:0;
  if(!bus.emit("skill-shot",{score}))return "Round complete. Reset the bridge to replay.";
  return score?"Scored · "+score+" base damage":"Missed · line up the next release.";
}
export function actLab(id,l,key,bus,pack,verify){
  switch(String(id)){
    case "ring":case "grapple":return fireLab(id,l,bus,l.time*1000);
    case "sword":return strike(l,bus,near(l.point,runes[l.rune],.17));
    case "fishing":return castLine(l,bus,l.point);
    case "village":{
      l.tiles[l.tile]=(l.tiles[l.tile]+1)%3;
      if(l.tiles.filter(Boolean).length===9)bus.emit("bottom-clear");
      return ["Cleared tile","Road placed","Home placed"][l.tiles[l.tile]];
    }
    case "65":{
      if(Math.abs(l.angle-109.5)>18){l.angle+=Math.sign(109.5-l.angle)*12;return "Angle moved toward the tetrahedral lock.";}
      l.angle=109.5;bus.emit("magnetic-lock");return "Locked at 109.5° · bridge charged.";
    }
    case "66":
      l.probe={p:Math.hypot(...l.point)<.35?[-.92,.28]:[...l.point],v:[0,l.speed]};
      l.trail=[];l.launched=l.time;return "Probe launched · normalized educational model.";
    case "67":l.two=!l.two;return l.two?"Two coherent sources":"One source";
    case "68":l.negative=!l.negative;return l.negative?"Blue pole repels":"Blue pole attracts";
    case "69":{
      l.rho=l.rho===28?14:l.rho===14?40:28;l.abc=[.12,1,1.01];l.trail=[];
      return "Lorenz ρ = "+l.rho;
    }
    case "77":
      l.drops.push(...Array.from({length:8},(_,i)=>({p:[l.point[0]+(i-3.5)*.021,l.point[1]],age:0})));
      l.drops=l.drops.slice(-120);return "Water released · following the modeled slope.";
    case "80":l.teeth=l.teeth===14?24:14;return "Input 18 teeth · output "+l.teeth+" teeth";
    case "81":{
      if(l.locked)return "Circuit stable.";
      const {magnetic_strength,snap_to_grid}=pack.physics_profile;
      if(!snap_to_grid||!near(l.point,[.56,0],.09+.08*magnetic_strength))
        return "Place the probe near the green terminal to lock.";
      l.locked=true;l.point=[.56,0];bus.emit("magnetic-lock");return "Circuit stable · magnetic-lock reward applied.";
    }
    case "84":l.target=l.target[0]>.8?[.51,-.25]:[1.21,.2];return arm(l.target).reachable?"Target within reach":"Target outside reach · arm clamped.";
    case "94":{
      const expected=presets[l.order%presets.length];
      if(!key||key!==expected[0])return "Use the first letter of "+expected+" to choose a shelf.";
      l.order++;l.correct++;bus.emit("bottom-clear");return "Shelved in "+key+" · one attempt loaded.";
    }
    case "96":return "Rotate the canvas or use the direction buttons.";
    case "98":{
      const i=l.flips++%l.stored.length;l.stored[i]^=1<<(i%8);
      return "CRC "+crc(l.stored)+(crc(l.stored)===crc(l.original)?" matches":" differs from")+" the original "+crc(l.original)+".";
    }
    case "101":return verify();
  }
}
export function drawLab(ctx,canvas,id,l,env){
  const a=area(ctx,canvas);if(!a)return;
  const {width,height,scale:s}=a;
  ctx.fillStyle=C.dark;ctx.fillRect(-width/2,-height/2,width,height);
  for(let x=-Math.floor(width/46)*23;x<=width/2;x+=23)for(let y=-Math.floor(height/46)*23;y<=height/2;y+=23){
    ctx.fillStyle="#29463f";ctx.fillRect(x,y,1,1);
  }
  ctx.scale(s,s);
  const point=(p,r,color)=>{
    ctx.fillStyle=color;ctx.beginPath();ctx.arc(...p,r,0,TAU);ctx.fill();
  };
  const line=(arr,color=C.muted,size=.008)=>{
    if(!arr.length)return;
    ctx.beginPath();ctx.moveTo(...arr[0]);for(const p of arr.slice(1))ctx.lineTo(...p);
    ctx.strokeStyle=color;ctx.lineWidth=size;ctx.stroke();
  };
  const rect=(p,w,h,color)=>{ctx.fillStyle=color;ctx.fillRect(p[0],p[1],w,h);};
  const label=(text,p,color=C.white,size=.099)=>{
    ctx.fillStyle=color;ctx.font="600 "+size+"px system-ui";ctx.fillText(text,...p);
  };
  const projection=p=>project(env.q,p).slice(0,2);
  switch(String(id)){
    case "ring":{
      const x=(ringX(l.time*1000,env.assist)-280)/135;
      line([[0,-.82],[x,.42]],C.gold,.015);point([x,.42],.095,C.gold);point([x,.42],.063,C.dark);
      line([[.67,-.20],[.67,.52],[.55,.52]],C.mint,.032);label("HOOK",[.53,-.30],C.mint);
      break;
    }
    case "grapple":{
      line(l.rope.nodes.map(n=>[n.x,n.y]),C.gold,.026);
      point(ropeEnd(l),.064,C.gold);rect([.63,-.12],.38,.85,"#214c40");
      label("RELEASE",[.70,.03],C.mint,.073);break;
    }
    case "sword":{
      for(const [i,p] of runes.entries())point(p,i===l.rune?.13:.05,i===l.rune?C.gold:C.muted);
      if(l.spark>l.time)label("HIT",[-.16,-.77],C.mint,.18);
      point(l.point,.036,C.white);break;
    }
    case "fishing":{
      const target=ripple(l.time);point(target,.15,C.blue);point(target,.11,C.dark);point(target,.07,C.blue);
      const base=[-.90,.79],tip=[-.57,.41];line([base,tip],C.gold,.035);
      if(l.flight){
        const t=clamp((l.time-l.flight.from)/.76,0,1),[x,y]=l.flight.to;
        const lure=[tip[0]+(x-tip[0])*t,tip[1]+(y-tip[1])*t-.44*Math.sin(t*Math.PI)];
        line([tip,[(tip[0]+lure[0])/2,(tip[1]+lure[1])/2-.14],lure],C.white,.009);point(lure,.04,C.gold);
      }else if(l.landing){line([tip,l.landing],C.white,.008);point(l.landing,.04,C.gold);}
      point(l.point,.033,C.white);break;
    }
    case "village":{
      l.tiles.forEach((value,i)=>{
        const x=(i%3-1.5)*.61,y=(Math.floor(i/3)-1.5)*.53;
        rect([x,y],.56,.48,i===l.tile?"#427561":"#233f3e");
        if(value===1)line([[x+.05,y+.23],[x+.50,y+.23]],C.gold,.055);
        if(value===2){rect([x+.16,y+.19],.25,.20,C.mint);line([[x+.12,y+.21],[x+.28,y+.07],[x+.45,y+.21]],C.white,.026);}
      });
      break;
    }
    case "65":{
      const a=[],b=[];
      for(let i=0;i<42;i++){
        const z=(i-20.5)/22,t=i*.48;
        a.push(projection([.39*Math.sin(t),z,.39*Math.cos(t)]));
        b.push(projection([-.39*Math.sin(t),z,-.39*Math.cos(t)]));
      }
      line(a,C.mint,.024);line(b,C.blue,.024);
      for(let i=1;i<a.length;i+=3)line([a[i],b[i]],C.muted,.012);
      const center=projection([.73,.03,0]);
      const arms=[projection([1.02,.03,0]),projection([.73+.29*Math.cos(l.angle*Math.PI/180),.03+.29*Math.sin(l.angle*Math.PI/180),0])];
      for(const end of arms){line([center,end],C.gold,.025);point(end,.041,C.gold);}
      label(l.angle.toFixed(1)+"°",[-1.02,.94],C.gold);break;
    }
    case "66":
      line(l.trail.map(p=>projection([...p,0])),C.blue,.014);point([0,0],.14,C.gold);
      point(projection([...secondary(l.time),0]),.063,C.mint);
      if(l.probe)point(projection([...l.probe.p,0]),.035,C.white);
      else point(l.point,.04,C.white);
      label("Release speed "+l.speed.toFixed(2),[-1.04,.96]);break;
    case "67":{
      const left=[-.55,-.04],right=l.source;
      for(let x=-1.52;x<1.52;x+=.047)for(let y=-1;y<1;y+=.049){
        const v=Math.sin(16*Math.hypot(x-left[0],y-left[1])-l.time*6)+
          (l.two?Math.sin(16*Math.hypot(x-right[0],y-right[1])-l.time*6):0);
        rect([x,y],.049,.051,v>=0?"rgba(143,241,202,"+(Math.abs(v)*.31)+")":"rgba(126,187,248,"+(Math.abs(v)*.32)+")");
      }
      point(left,.047,C.mint);if(l.two)point(right,.047,C.blue);break;
    }
    case "68":{
      const sources=[{p:[-.56,0],strength:.16},{p:l.source,strength:l.negative?-.15:.15}];
      for(let x=-1.53;x<1.54;x+=.23)for(let y=-.91;y<.97;y+=.214){
        const f=force([x,y],sources,.10),p=projection([x,y,0]),m=Math.hypot(...f)||1;
        const e=projection([x+.145*f[0]/m,y+.145*f[1]/m,0]),angle=Math.atan2(e[1]-p[1],e[0]-p[0]);
        line([p,e],C.muted);line([polar(...e,.04,angle+2.6),e,polar(...e,.04,angle-2.6)],C.mint);
      }
      line(l.trace.map(p=>projection([...p,0])),C.gold,.021);
      for(const [j,{p}] of sources.entries())point(projection([...p,0]),.056,j?C.blue:C.mint);
      break;
    }
    case "69":
      line(l.trail.map(([x,y,z])=>projection([x/22,(z-25)/25,y/29])),C.mint,.012);
      label("Lorenz ρ = "+l.rho,[-1.02,.96],C.gold);break;
    case "77":
      for(let x=-1.42;x<1.42;x+=.09)for(let y=-.98;y<.99;y+=.09){
        const v=terrain(x,y,env.tilt);
        rect([x,y],.085,.085,"hsl(151, "+(27+Math.abs(v)*24)+"%, "+clamp(20+v*28,11,58)+"%)");
      }
      for(const drop of l.drops)point(drop.p,.031,C.blue);
      point(l.point,.052,C.gold);break;
    case "80":{
      function gear(cx,teeth,r,angle,color){
        const path=Array.from({length:teeth*4+1},(_,i)=>polar(cx,0,i%4===0||i%4===3?r-.04:r,angle+i*TAU/(teeth*4)));
        line(path,color,.028);point([cx,0],.046,color);line([[cx,0],polar(cx,0,r*.83,angle)],color,.026);
      }
      const turn=l.time*.65+l.turn, radius=.53*l.teeth/18;
      gear(-.55,18,.53,turn,C.mint);gear(-.55+.53+radius,l.teeth,radius,-turn*18/l.teeth,C.gold);
      label("18 : "+l.teeth,[-.25,.94],C.white);break;
    }
    case "81":{
      const sources=[{p:[-.56,0],strength:-.13},{p:[.56,0],strength:.15},
        ...(l.contacts?.length?l.contacts:[l.point]).map(p=>({p,strength:.02*env.pack.physics_profile.magnetic_strength}))];
      for(let x=-1.39;x<1.45;x+=.11)for(let y=-.95;y<.98;y+=.11){
        const field=Math.hypot(...force([x,y],sources,.14));
        point(env.pack.physics_profile.allow_full_quaternion?projection([x,y,0]):[x,y],.019+Math.min(.027,field*.013),"rgba(126,187,248,"+clamp(field*.39,.14,.9)+")");
      }
      const circuitPoint=p=>env.pack.physics_profile.allow_full_quaternion?projection([...p,0]):p;
      point(circuitPoint([-.56,0]),.07,C.rose);point(circuitPoint([.56,0]),.07,C.mint);point(circuitPoint(l.point),.05,l.locked?C.gold:C.white);
      if(l.locked)line([circuitPoint([-.56,0]),circuitPoint([.56,0])],C.gold,.02);
      break;
    }
    case "84":{
      const solve=arm(l.target);
      line([[0,0],solve.elbow,solve.end],C.gold,.055);
      for(const p of [[0,0],solve.elbow,solve.end])point(p,.054,C.mint);
      point(l.target,.046,solve.reachable?C.white:C.rose);
      label((solve.base*180/Math.PI).toFixed(1)+"°  /  "+(solve.bend*180/Math.PI).toFixed(1)+"°",[-1.07,.97]);break;
    }
    case "94":{
      const prefix=presets[l.order%presets.length];
      const letters=presets.map(p=>p[0]);
      for(let j=0;j<letters.length;j++){
        const p=projection([(j%3-1)*.77,Math.floor(j/3)*.47-.07,.19*(j%2)]);
        rect([p[0]-.24,p[1]-.16],.48,.31,"#305547");label(letters[j],[p[0]-.045,p[1]+.035]);
      }
      label(prefix+" 184 .T33",[-.56,-.48],C.gold,.21);
      label(l.correct+" shelved",[-.26,.92]);break;
    }
    case "96":
      for(let i=0;i<env.vault.length;i++){
        const angle=i*2.39996,y=(i/(Math.max(1,env.vault.length-1))-.5)*1.55,r=Math.sqrt(1-y*y)*.83;
        const [x,yy,z]=project(env.q,[r*Math.cos(angle),y,r*Math.sin(angle)]);
        point([x,yy],.042+Math.max(0,z)*.045,z>0?C.mint:C.muted);
      }
      if(!env.vault.length)label("Add a note to populate the vault.",[-.90,0]);break;
    case "98":{
      const shown=project(env.q,[0,-.29,0]);
      label("ARCHIVE BUFFER",[-.59+shown[0],-.55+shown[1]],C.gold,.13);
      for(const [i,v] of l.stored.entries()){
        const p=[(i%8)*.285-1.07,Math.floor(i/8)*.36-.22];
        rect(p,.245,.28,l.original[i]===v?"#22493f":"#70334b");
        label(v.toString(16).padStart(2,"0").toUpperCase(),[p[0]+.04,p[1]+.18]);
      }
      label("Stored CRC "+crc(l.stored),[-.65,.66],C.white,.124);break;
    }
    case "101":{
      const corners=[[-.6,-.6,-.6],[.6,-.6,-.6],[.6,.6,-.6],[-.6,.6,-.6],[-.6,-.6,.6],[.6,-.6,.6],[.6,.6,.6],[-.6,.6,.6]];
      const world=corners.map(projection);
      for(const [i,j] of [[0,1],[1,2],[2,3],[3,0],[4,5],[5,6],[6,7],[7,4],[0,4],[1,5],[2,6],[3,7]])line([world[i],world[j]],C.mint,.017);
      for(const p of world)point(p,.044,C.gold);break;
    }
  }
}
export function selectionLetter(l){return presets[l.order%presets.length][0];}
