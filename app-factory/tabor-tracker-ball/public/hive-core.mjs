import {modules, classes} from "./loc101-catalog.mjs";
import {catalog} from "./games.mjs";

export const domains = [
  {id:"ai", name:"AI & Machine Intelligence", short:"Intelligence", mode:"Active in browser", schools:["B","J","K","L"], description:"Nathan AI directs a local lesson. PK changes its challenge. Grape-Apple explains where its information came from.", station:"logic", modules:[6,8,20,38,45]},
  {id:"quantum", name:"Quantum Compute", short:"Quantum", mode:"Educational models", schools:["Q"], description:"Explore probability-shaped diagrams and quaternion motion on a classical device.", station:"globe", modules:[64,66,67,68]},
  {id:"network", name:"Network Compute", short:"Network", mode:"Local graph & diagnostics", schools:["H","T","Z"], description:"Connect nodes and inspect relationships, handoffs, and data flow in a sample network.", station:"magic", modules:[31,33,83,97,100]},
  {id:"energy", name:"Energy Dominion", short:"Energy", mode:"Educational models", schools:["G","Q","S","T"], description:"Explore modeled input, storage, transfer, and regulation across the field and rotor stations.", station:"forge", modules:[24,45,63,75,85]},
  {id:"biology", name:"Biological Systems", short:"Biological", mode:"Educational models", schools:["R","S","Q"], description:"Explore anatomical diagrams, contact geometry, root and soil layers, and introductory molecular geometry.", station:"pottery", modules:[65,70,72,74,77,78]},
  {id:"security", name:"Defense & Security", short:"Security", mode:"Local integrity checks", schools:["J","K","T","U"], description:"Examine local records, custody, and catalog validation alongside schematic historical exhibits.", station:"dial", modules:[40,41,81,86,87]},
  {id:"cosmic", name:"Cosmic Navigation", short:"Navigation", mode:"Educational models", schools:["D","G","Q","V"], description:"Use celestial exhibits, the globe, and simulated currents to orient and follow reference markers.", station:"globe", modules:[18,26,66,92,93,94]},
  {id:"knowledge", name:"Knowledge Synthesis", short:"Knowledge", mode:"Active catalog & links", schools:["A","B","C","P","Z"], description:"Search the 101 applications, open the KJV verse wheel, and build links across the cited classification.", station:"grip", modules:[1,5,12,59,96,97,100,101]},
  {id:"material", name:"Hardware & Fabrication", short:"Fabrication", mode:"Virtual devices & geometry", schools:["N","T","S"], description:"Rotate virtual parts, explore fabrication forms, and inspect touch and motion input exposed by the browser.", station:"pottery", modules:[53,54,56,80,82,83,84]},
];

export const foundation = [
  ["Hardware","Embodiment","Browser touch, pointer and motion inputs","material",83],
  ["Robotics","Actuation","Virtual manipulator and gimbal","material",84],
  ["Fabrication","Construction","Wheel and carving models","material",53],
  ["Network","Connectivity","Local node network","network",100],
  ["Communications","Signaling","Synthesis and signal models","network",52],
  ["Infrastructure","Topology","Sample transport routes","network",33],
  ["Security","Sovereignty","Catalog checks and sample custody","security",41],
  ["Physics","Simulation","Track Baller and contact fields","energy",63],
  ["Memory","Persistent storage","Browser-local progress and job records","knowledge",98],
  ["Learning","Adaptation","Challenges and completion history","ai",43],
  ["Energy","Regulation","Rotor and flow models","energy",85],
  ["Cognition","Orchestration","Local logic and cast prompts","ai",8],
];

export const voices = {
  nathan: {
    name:"Nathan AI 🚀", role:"Coach / Clutch Rival / Direct Interface", effect:"Charge & attack",
    line:(topic) => "Build the sequence. Record the outcome. Your active domain is " + topic + ".",
    pattern:["◈","▰","◆","◈"], reward:{charge:2,attack:2,shield:0,buff:0},
  },
  pk: {
    name:"PK 🐽", role:"Chaos Wild Card / Stress Tester", effect:"Attack & buff",
    line:() => "PK Wild Card. The sequence comes back in reverse. Watch the order.",
    pattern:["◆","◈","▰","◆","▰"], reward:{charge:1,attack:3,shield:0,buff:1},
  },
  curator: {
    name:"Grape-Apple 🍇🍎", role:"Subject Master / Provenance", effect:"Shield & charge",
    line:(topic) => "Open a " + topic + " cartridge and follow its source. Then record the sequence.",
    pattern:["▰","◆","◈"], reward:{charge:2,attack:0,shield:2,buff:0},
  },
};
export const symbols = {"◈":"Ring","▰":"Bar","◆":"Diamond"};

export function patternFor(voice, round) {
  const source=voices[voice].pattern;
  const offset=round%source.length;
  const shifted=source.slice(offset).concat(source.slice(0,offset));
  return voice==="pk"?shifted.reverse():shifted;
}

export function newBridge() {
  return {charge:2,attack:0,shield:0,buff:0,score:0,round:0,step:0,presses:0,lastScore:0,complete:false};
}

export function pressSymbol(bridge, voice, symbol) {
  const pattern=patternFor(voice,bridge.round);
  bridge.presses++;
  if (symbol!==pattern[bridge.step]) {
    bridge.step=0;
    if (bridge.shield) {
      bridge.shield--;
      return "Shield used. Try the sequence again.";
    }
    bridge.charge=Math.max(0,bridge.charge-1);
    return "Sequence reset. One charge used if available.";
  }
  bridge.step++;
  if (bridge.step<pattern.length) return "Step " + bridge.step + " recorded.";
  for(const [key,value] of Object.entries(voices[voice].reward)) bridge[key]=Math.min(9,bridge[key]+value);
  bridge.step=0;
  bridge.round++;
  return "Puzzle complete. " + voices[voice].effect + " earned.";
}

export function scoreArcade(bridge, score, complete) {
  if (!Number.isSafeInteger(score)||score<0) return "";
  const delta=Math.max(0,score-bridge.lastScore);
  const finished=complete&&!bridge.complete;
  bridge.lastScore=score;
  bridge.complete=complete;
  if (finished) bridge.shield=Math.min(9,bridge.shield+1);
  if (!delta) return finished?"Arcade round complete. Shield earned.":"";
  const attack=Math.min(bridge.attack,3), charged=Number(bridge.charge>0);
  bridge.charge-=charged;
  bridge.attack-=attack;
  bridge.score+=delta+charged*(attack*20+(bridge.buff>0?25:0));
  if(charged&&bridge.buff>0) bridge.buff--;
  return "Arcade +" + delta + (charged?" · bridge charge applied.":".") + (finished?" Shield earned.":"");
}

export function findCartridges(domain, query) {
  const terms=query.toLowerCase().trim().split(/\s+/);
  const featured=new Set(domain?.modules??[]);
  return modules.filter(module=>{
    if(domain&&!featured.has(module.id)&&!domain.schools.includes(module.classCode)) return false;
    const words=[module.id,module.title,module.briefTitle,classes[module.classCode],module.profile].join(" ").toLowerCase();
    return terms.every(term=>words.includes(term));
  }).sort((a,b)=>Number(featured.has(b.id))-Number(featured.has(a.id)));
}

export const archiveJobs=[
  {id:"catalog",kind:"catalog",label:"Verify 101 cartridges"},
  {id:"domains",kind:"domains",label:"Index domains and foundation"},
  {id:"arcade",kind:"arcade",label:"Verify the arcade registry"},
  {id:"bridge",kind:"bridge",label:"Check all cast rewards"},
  {id:"search",kind:"search",label:"Build the cartridge search index"},
];
export const maxAttempts=3;
export const leaseLength=15_000;

export function makeBatch(now, key) {
  return archiveJobs.map(job=>({...job,key:key + ":" + job.id,batch:key,status:"queued",attempts:0,availableAt:now,createdAt:now}));
}

export function claimNext(jobs, now, lease) {
  const job=jobs.find(entry=>(entry.status==="queued"&&entry.availableAt<=now)||
    (entry.status==="running"&&entry.expires<=now));
  if (!job) return null;
  if(job.attempts>=maxAttempts) {
    Object.assign(job,{status:"failed",endedAt:now,lease:null,error:"Retry limit reached before completion."});
    return {exhausted:true,job};
  }
  Object.assign(job,{status:"running",startedAt:now,attempts:job.attempts+1,lease,expires:now+leaseLength});
  return {exhausted:false,job};
}

export function settle(job, lease, now, outcome) {
  if (job.status!=="running"||job.lease!==lease||job.expires<=now) return false;
  job.lease=null;
  if(outcome.ok) Object.assign(job,{status:"done",endedAt:now,result:outcome.result,error:null});
  else if(job.attempts<maxAttempts) {
    Object.assign(job,{status:"queued",availableAt:now+500*2**(job.attempts-1),error:outcome.error});
  } else Object.assign(job,{status:"failed",endedAt:now,error:outcome.error});
  return true;
}

export function runJob(kind) {
  const seen=new Set(modules.map(module=>module.id));
  if (kind==="catalog") {
    if (seen.size!==101||modules.some((module,index)=>module.id!==index+1||!classes[module.classCode])||
      new Set(modules.map(module=>module.classCode)).size!==21) throw new Error("Catalog contains missing or duplicate records.");
    return {summary:"101 numbered cartridges · 21 verified classes",count:seen.size};
  }
  if (kind==="domains") {
    if(domains.some(domain=>!domain.modules.every(id=>seen.has(id)))||
       foundation.some(([, , ,domain,id])=>!domains.some(item=>item.id===domain)||!seen.has(id))) throw new Error("A domain has a missing reference.");
    return {summary:domains.length+" domains · "+foundation.length+" foundation branches",count:domains.length+foundation.length};
  }
  if (kind==="arcade") {
    const games=Object.values(catalog);
    if(games.length!==13||games.some(game=>!game.hint||!game.controllerOverlay)) throw new Error("Arcade registry is incomplete.");
    return {summary:"13 arcade games with controller profiles",count:games.length};
  }
  if (kind==="bridge") {
    for(const voice of Object.keys(voices)){
      const bridge=newBridge();
      for(const symbol of patternFor(voice,0)) pressSymbol(bridge,voice,symbol);
      if(bridge.round!==1||bridge.charge<3) throw new Error("Cast rewards failed for "+voice);
      scoreArcade(bridge,100,true);
      if(bridge.score<100||bridge.shield<1) throw new Error("Arcade feedback failed.");
    }
    return {summary:"3 cast paths validated in both directions",count:3};
  }
  if (kind==="search") {
    const index=Object.fromEntries(Object.keys(classes).map(code=>[code,modules.filter(module=>module.classCode===code).map(module=>module.id)]));
    return {summary:Object.keys(index).length+" class indexes · "+seen.size+" searchable cartridges",count:seen.size,index};
  }
  throw new Error("Unsupported job.");
}
