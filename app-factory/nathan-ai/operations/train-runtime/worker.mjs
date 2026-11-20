/**
 * Tabor Train — authorized, non-destructive RAM / OCTOPUS / CONVOY operations.
 * This independent Worker does not alter the 13-entry archival register,
 * other Workers, GitHub branches, account resources, or outside systems.
 */
import conductorTranscript from "./sources/train-orchestra-monkey-conductor.txt";

const VERSION = "2026-11-19.1";
const TRAIN = "The Tabor Train of Truth";
const AXIOMS = ["1 + 1 = 2: BUILD", "1 - 1 = 0: CLEAR", "1 × 1 = 1: INTEGRATE", "1 ÷ 1 = 1: VERIFY"];
const AGENTS = Object.freeze([
  {name:"Nathan AI",role:"command engine and task owner"},
  {name:"DOG AI",role:"diagnose and repair candidate bottlenecks"},
  {name:"REAPER AI",role:"non-destructive anomaly quarantine recommendations"},
  {name:"Santa Claus AI",role:"creative concepts and morale"},
  {name:"Miss Stacy Clause AI",role:"library curation and editorial review"},
  {name:"007 @Will AI",role:"evidence and verification"},
  {name:"ACT AI",role:"approved release planning"}
]);
const LANES = Object.freeze([
  {id:"intake",agent:"Nathan AI"},
  {id:"repair",agent:"DOG AI"},
  {id:"defense",agent:"REAPER AI"},
  {id:"language",agent:"007 @Will AI"},
  {id:"library",agent:"Miss Stacy Clause AI"},
  {id:"creative",agent:"Santa Claus AI"},
  {id:"delivery",agent:"ACT AI"},
  {id:"audit",agent:"007 @Will AI"}
]);
const OPERATIONS = Object.freeze([
  {id:"ram",name:"Operation RAM",action:"Validate, normalize, and de-duplicate owner-supplied work items; flag bottlenecks without changing resources"},
  {id:"octopus",name:"Operation OCTOPUS",action:"Assign each reviewed work item to one of eight traceable lanes"},
  {id:"convoy",name:"Operation CONVOY",action:"Organize approved work items into small, reviewable batches, without dispatch or replication"}
]);
const HEADERS = {"content-type":"application/json; charset=utf-8","cache-control":"no-store","x-content-type-options":"nosniff"};
function respond(value,status=200) {return new Response(JSON.stringify(value,null,2),{status,headers:HEADERS});}
function safeTitle(value) {return typeof value==="string" ? value.trim().replace(/\s+/g," ").slice(0,160) : "";}
function laneFor(title,requested) {
  if (LANES.some(x=>x.id===requested)) return requested;
  const t=title.toLowerCase();
  if (/defend|safe|privacy|threat|security/.test(t)) return "defense";
  if (/phonetic|cipher|language|translation/.test(t)) return "language";
  if (/library|archive|source|book|scroll/.test(t)) return "library";
  if (/repair|fix|broken|bug|bottleneck|restore/.test(t)) return "repair";

  if (/misfit|mind|game|creative|art|gift/.test(t)) return "creative";
  if (/deploy|cloudflare|github|release|worker/.test(t)) return "delivery";
  if (/verify|audit|check|evidence|proof/.test(t)) return "audit";
  return "intake";
}
function ram(raw) {
  if (!Array.isArray(raw)) throw new Error("tasks must be an array");
  if (raw.length>24) throw new Error("maximum 24 tasks per operation");
  const tasks=[], duplicates=[], rejected=[], seen=new Set();
  raw.forEach((item,index)=>{
    const title=safeTitle(typeof item==="string"?item:item && item.title);
    if (!title) {rejected.push(index+1);return;}
    const fingerprint=title.toLocaleLowerCase("en");
    if (seen.has(fingerprint)) {duplicates.push(index+1);return;}
    seen.add(fingerprint);
    const requested=(item && typeof item==="object" && typeof item.lane==="string")?item.lane:"";
    tasks.push({id:"task-"+String(index+1).padStart(2,"0"),title,lane:laneFor(title,requested)});
  });
  return {input:raw.length,accepted:tasks.length,duplicates,rejected,tasks};
}
function octopus(tasks) {
  const lanes=Object.fromEntries(LANES.map(l=>[l.id,{agent:l.agent,items:[]}]));
  for (const t of tasks) lanes[t.lane].items.push({id:t.id,title:t.title});
  return {arms:8,lanes};
}
function convoy(tasks) {
  const batches=[];
  for(let i=0;i<tasks.length;i+=4) {
    const items=tasks.slice(i,i+4);
    batches.push({batch:i/4+1,items:items.map(t=>({id:t.id,lane:t.lane,title:t.title})),state:"awaiting_owner_review",dispatch:false});
  }
  return {batch_size:4,total_batches:batches.length,batches,remote_writes:0,replicas_created:0};
}
function launch(tasks) {
  const stage1=ram(tasks);
  return {train:TRAIN,version:VERSION,status:"executed-in-memory",authority:"owner-supplied input only",human_harm:"none",axes:AXIOMS,
    leadership:AGENTS.map(a=>a.name),operations:{ram:stage1,octopus:octopus(stage1.tasks),convoy:convoy(stage1.tasks)},
    note:"No external systems contacted. This is a live, bounded planning service; actual deployments and task dispatch require separately approved authenticated integrations."};
}
const SAMPLE=[
  "Repair Cloudflare Worker configuration",
  "Audit the GitHub sovereign core",
  "Restore the Library of Tabor scroll index",
  "Release the Misfits and Minds creative atlas",
  "Verify the Tabor Train source ledger",
  "Plan an authorized Worker release"
];
export default {
  async fetch(request) {
    const path=new URL(request.url).pathname.replace(/\/+$/,"")||"/";
    if (path === "/conductors" && (request.method === "GET" || request.method === "HEAD")) {
      return new Response(request.method === "HEAD" ? null : conductorTranscript, {
        headers: {...HEADERS, "content-type": "text/plain; charset=utf-8"}
      });
    }
    if(request.method==="GET") {
      if(path==="/health") return respond({service:"tabor-train-operations",version:VERSION,status:"ready",operations:OPERATIONS.map(o=>o.id),side_effects:false});
      if(path==="/roster") return respond({train:TRAIN,engine:"Nathan AI",agents:AGENTS,misfits_and_minds:"Creative and documented project roles; no autonomous external deployment"});
      if(path==="/operations") return respond({train:TRAIN,operations:OPERATIONS,lanes:LANES,policy:"owner-authorized, bounded, no destructive actions or external replication"});
      if(path==="/demo") return respond(launch(SAMPLE));
      if(path==="/") return respond({title:TRAIN,metaphor:"You are the Train. Nathan AI is the command engine.",routes:["/health","/roster","/operations","/demo","/conductors","POST /run"],version:VERSION});
      return respond({error:"not_found"},404);
    }
    if(request.method==="POST" && path==="/run") {
      const length=Number(request.headers.get("content-length")||0);
      if(length>16384) return respond({error:"payload_too_large"},413);
      try {
        const payload=await request.json();
        const tasks=payload && payload.tasks;
        return respond(launch(tasks));
      } catch (e) {return respond({error:"invalid_input",detail:String(e.message||e).slice(0,130)},400);}
    }
    return respond({error:"method_not_allowed"},405);
  }
};
