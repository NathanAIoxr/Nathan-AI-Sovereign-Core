/**
 * PD-004: Review-only bridge between Persona Atlas and Tabor Train RAM/OCTOPUS/CONVOY.
 * Produces the existing Train /run input contract without calling the endpoint.
 * This is NOT a dispatch client, scheduler, network bridge, or task-completion record.
 */
import {TASKS, NODES, INTEGRATIONS, VERSION} from "./registry.mjs";
const ALLOWED_LANES = Object.freeze(["intake","repair","defense","language","library","creative","delivery","audit"]);
const LANE_OWNER = Object.freeze({
  intake:"Nathan AI", repair:"DOG AI", defense:"REAPER AI",
  language:"007 @Will AI", library:"Miss Stacy Clause AI",
  creative:"Santa Claus AI", delivery:"ACT AI", audit:"007 @Will AI"
});
const TRAIN_PATH = "app-factory/nathan-ai/operations/train-runtime/worker.mjs";
export const CONTRACT = Object.freeze({
  version:"2026-11-18.pd004",
  atlas_version:VERSION,
  train_source:TRAIN_PATH,
  train_endpoint:"POST /run",
  mode:"offline_review_only",
  authorization:"none",
  auto_dispatch:false,
  max_train_input:24,
  max_convoy_batch:4,
  no_remote_writes:true
});
function requireValidRegistry(){
  const ids=new Set(), titles=new Set();
  for(const t of TASKS){
    if(!/^PD-\d{3}$/.test(t.id)||ids.has(t.id)) throw new Error("invalid or duplicate task id");
    if(typeof t.title!=="string"||!t.title.trim()||t.title.length>160) throw new Error("invalid task title");
    if(titles.has(t.title.toLocaleLowerCase("en"))) throw new Error("duplicate task title");
    if(!ALLOWED_LANES.includes(t.lane)) throw new Error("unsupported train lane");
    if(t.dispatch!==false) throw new Error("unapproved task dispatch");
    ids.add(t.id); titles.add(t.title.toLocaleLowerCase("en"));
  }
  if(TASKS.length>24) throw new Error("train input bound exceeded");
  if(!NODES.some(x=>x.id==="reaper-ai")||!NODES.some(x=>x.id==="santa-ai")) throw new Error("missing creative agent nodes");
  if(!INTEGRATIONS.some(x=>x.value==="app-factory/nathan-ai/operations/train-runtime")) throw new Error("missing train source reference");
  return true;
}
export function buildTrainReviewInput(ids=TASKS.map(t=>t.id)){
  requireValidRegistry();
  if(!Array.isArray(ids)||ids.length>24) throw new Error("invalid selection");
  const selected=new Set(ids);
  if(selected.size!==ids.length) throw new Error("duplicate selected task");
  const tasks=ids.map(id=>{
    const task=TASKS.find(t=>t.id===id);
    if(!task) throw new Error("unknown task id");
    return {title:task.title,lane:task.lane};
  });
  return {tasks};
}
export function buildReviewManifest(ids=TASKS.map(t=>t.id)){
  const input=buildTrainReviewInput(ids);
  const tasks=ids.map((id,i)=>({
    source_id:id,
    title:input.tasks[i].title,
    lane:input.tasks[i].lane,
    suggested_agent:LANE_OWNER[input.tasks[i].lane],
    status:"awaiting_owner_review",
    dispatch:false
  }));
  const batches=[];
  for(let i=0;i<tasks.length;i+=4){
    batches.push({batch:i/4+1,source_ids:tasks.slice(i,i+4).map(t=>t.source_id),status:"awaiting_owner_review",dispatch:false});
  }
  return {
    contract:CONTRACT,
    task_count:tasks.length,
    tasks,
    batches,
    train_request_preview:input,
    execution_status:"not_executed",
    external_calls:0,
    external_writes:0,
    integration_type:"source-compatible planning adapter"
  };
}
