import { analyze, axisRotation, multiply, project } from "../../tabor-tracker-ball/public/track-baller.mjs";
import { newRound, grant, beginAttempt, endAttempt, updateBridge } from "./arcade-core.mjs";

export const identity = () => [1,0,0,0];
export const rotate = (q,x,y,z) => multiply(axisRotation(x,y,z),q);
export { analyze, project };

export function force(position,sources,softening=.025){
  let x=0,y=0;
  for(const {p,strength} of sources){
    const dx=p[0]-position[0],dy=p[1]-position[1];
    const denominator=(dx*dx+dy*dy+softening*softening)**1.5;
    x+=strength*dx/denominator;
    y+=strength*dy/denominator;
  }
  return [x,y];
}

export function stepProbe(probe,sources,dt){
  const [ax,ay]=force(probe.p,sources,.045);
  probe.v[0]+=ax*dt;probe.v[1]+=ay*dt;
  probe.p[0]+=probe.v[0]*dt;probe.p[1]+=probe.v[1]*dt;
}

export function arm(target,a=.62,b=.44){
  const raw=Math.hypot(...target),r=Math.max(Math.abs(a-b)+1e-6,Math.min(a+b-1e-6,raw));
  const bend=Math.acos(Math.max(-1,Math.min(1,(r*r-a*a-b*b)/(2*a*b))));
  const base=Math.atan2(target[1],target[0])-Math.atan2(b*Math.sin(bend),a+b*Math.cos(bend));
  return {base,bend,reachable:Math.abs(a-b)<=raw&&raw<=a+b,
    elbow:[a*Math.cos(base),a*Math.sin(base)],end:[r*Math.cos(Math.atan2(target[1],target[0])),r*Math.sin(Math.atan2(target[1],target[0]))]};
}

export class UniversalBridgeBus extends EventTarget {
  constructor(){
    super();
    this.round=newRound("ring","chain","charge");
    this.last="Ready";this.events=0;
  }
  emit(kind,detail={}){
    if(!["bottom-clear","magnetic-lock","skill-shot","guard","surge"].includes(kind))throw new TypeError("Unknown bridge event");
    const r=this.round;
    if(r.result)return false;
    let damage=0;
    switch(kind){
      case "bottom-clear":grant(r,{charge:8});break;
      case "magnetic-lock":grant(r,{charge:4,bonus:20,assist:6000});break;
      case "guard":grant(r,{shield:12,freeze:900});break;
      case "surge":grant(r,{rapid:2200});break;
      case "skill-shot":{
        const score=Number.isFinite(detail.score)?Math.max(0,Math.min(30,detail.score)):0;
        const attempt=beginAttempt(r);
        if(!attempt)return false;
        damage=endAttempt(r,attempt,score);break;
      }
    }
    this.events++;
    this.last=kind;
    this.dispatchEvent(new CustomEvent("bridge",{detail:{kind,damage,...detail}}));
    return true;
  }
  tick(dt){updateBridge(this.round,dt);}
}

const MODES=new Set(["PINCH_AND_PLACE","TRACKBALL_SPIN","MAGNETIC_SNAP"]);
export function validCircuit(pack){
  const f=pack?.physics_profile,b=pack?.bridge_rules,c=pack?.cast_roles;
  return Boolean(pack?.cartridge_id==="LC_TK_CIRCUITS_V7"&&pack.lc_class==="T - Technology (TK)"&&
    typeof pack.title==="string"&&pack.title.trim()&&pack.title.length<=120&&Array.isArray(pack.interaction_modes)&&
    pack.interaction_modes.length===MODES.size&&new Set(pack.interaction_modes).size===MODES.size&&
    pack.interaction_modes.every(v=>MODES.has(v))&&
    Number.isFinite(f?.gravity)&&Math.abs(f.gravity)<=4&&Number.isFinite(f.magnetic_strength)&&
    f.magnetic_strength>=0&&f.magnetic_strength<=5&&typeof f.snap_to_grid==="boolean"&&
    typeof f.allow_full_quaternion==="boolean"&&b?.bottom_clear_grants==="POWER_CHARGE"&&
    b.magnetic_lock_grants==="CIRCUIT_STABLE"&&["curator_intro","nathan_ai_tip","pk_chaos_modifier"].every(key=>typeof c?.[key]==="string"&&c[key].length<=320));
}

export const ClassNames=Object.freeze({
  A:"General Works",B:"Philosophy, Psychology, Religion",C:"Auxiliary Sciences of History",D:"World History",
  E:"History of the Americas",F:"History of the Americas",G:"Geography, Anthropology, Recreation",H:"Social Sciences",
  J:"Political Science",K:"Law",L:"Education",M:"Music",N:"Fine Arts",P:"Language and Literature",Q:"Science",
  R:"Medicine",S:"Agriculture",T:"Technology",U:"Military Science",V:"Naval Science",Z:"Bibliography, Library Science, Information Resources"
});

export const releaseLinks=Object.freeze({
  ring:["Hook & Ring","https://hook-and-ring.nathantaboract.workers.dev/"],
  grapple:["Grapple It","https://grapple-it.nathantaboract.workers.dev/"],
  village:["BIBLeTopia","https://bibletopia.nathantaboract.workers.dev/"],
  tracker:["Tabor Tracker Ball","https://tabor-tracker-ball.nathantaboract.workers.dev/"],
  arcade:["Dual-Screen Arcade","https://dual-screen-arcade.nathantaboract.workers.dev/"]
});

export function sourceIndex(ledger,supplement=[]){
  const entries=new Map(supplement.map(row=>[row.id,{...row,lcClass:row.class,source:"Tracker Ball branch"}]));
  for(const row of ledger)entries.set(row.id,row);
  return Array.from({length:101},(_,i)=>entries.get(i+1)??{id:i+1,lcClass:"",title:"",description:""});
}
