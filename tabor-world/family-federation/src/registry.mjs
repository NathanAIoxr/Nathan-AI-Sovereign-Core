import {roles} from "./protocol.mjs";
import cloudWorkers from "./cloud-workers.json" with {type:"json"};

const repo="NathanAIoxr/Nathan-AI-Sovereign-Core";
const table="tabor_family_federation_snapshot";
export const githubUrl="https://github.com/"+repo+"/actions";

export async function sha(value) {
  const hash=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(value));
  return Array.from(new Uint8Array(hash),n=>n.toString(16).padStart(2,"0")).join("");
}

function validLabel(value){return typeof value==="string"&&value.length>0&&value.length<=250&&!/[\p{C}]/u.test(value);}
function stableId(type,value){
  if(!validLabel(value))throw Error("Unexpected registry identifier.");
  return type+"-"+encodeURIComponent(value);
}

export function makeSnapshot(workflows,fleet,rotation,observedMs=Date.now()) {
  const cards=[];
  for(const w of workflows) {
    if(!Number.isSafeInteger(w.id)||w.id<1||!validLabel(w.name)||!validLabel(w.state))throw Error("Invalid public workflow record.");
    const file=typeof w.path==="string"?/^\.github\/workflows\/([\w.-]+\.ya?ml)$/.exec(w.path)?.[1]:null;
    cards.push({id:"github-workflow-"+w.id,family:"github",kind:"workflow",name:w.name,state:w.state,
      url:file?"https://github.com/"+repo+"/actions/workflows/"+encodeURIComponent(file):githubUrl});
  }
  for(const name of cloudWorkers.workers)cards.push({id:stableId("cloudflare-worker",name),family:"cloudflare",
    kind:"worker",name,state:"deployed"});
  for(const agent of fleet) {
    if(!validLabel(agent.execution_status))throw Error("Invalid fleet state.");
    cards.push({id:stableId("cloudflare-fleet",agent.agent_id),family:"cloudflare",kind:"fleet-agent",
      name:agent.agent_id,state:agent.execution_status});
  }
  for(const agent of rotation) {
    if(!validLabel(agent.state))throw Error("Invalid rotational state.");
    cards.push({id:stableId("cloudflare-rotational",agent.id),family:"cloudflare",kind:"rotational-agent",
      name:agent.id,state:agent.state});
  }
  if(new Set(cards.map(card=>card.id)).size!==cards.length)throw Error("Duplicate source identifier.");
  cards.sort((a,b)=>a.id<b.id?-1:a.id>b.id?1:0);
  return {version:1,observed_ms:observedMs,source:{repository:repo,worker_inventory_observed_at:cloudWorkers.observed_at},cards};
}

export function summarize(snapshot) {
  const counts={github:0,cloudflare:0,workflows:0,worker_scripts:0,fleet_agents:0,rotational_agents:0};
  const typeKeys={workflow:"workflows",worker:"worker_scripts","fleet-agent":"fleet_agents","rotational-agent":"rotational_agents"};
  for(const item of snapshot.cards){
    counts[item.family]++;
    counts[typeKeys[item.kind]]++;
  }
  const meeting=counts.github>0&&counts.cloudflare>0;
  return {...counts,parent_count:snapshot.cards.length,multiplier:roles.length,
    assignment_count:meeting?snapshot.cards.length*roles.length:0,meeting,observed_ms:snapshot.observed_ms,
    worker_inventory_observed_at:snapshot.source.worker_inventory_observed_at};
}

export function roster(snapshot,filter,offset,limit) {
  const byFamily={github:[],cloudflare:[]};
  for(const card of snapshot.cards)byFamily[card.family].push(card);
  const peers=new Map();
  for(const [family,cards] of Object.entries(byFamily)){
    const other=byFamily[family==="github"?"cloudflare":"github"];
    if(other.length)cards.forEach((card,i)=>peers.set(card.id,other[i%other.length]));
  }
  const visible=filter?byFamily[filter]:snapshot.cards;
  return {total:visible.length,offset,limit,entries:visible.slice(offset,offset+limit).map(card=>{
    const peer=peers.get(card.id);
    return {...card,counterpart:peer?{id:peer.id,name:peer.name,family:peer.family}:null,
      assignments:peer?roles.map((role,i)=>({id:card.id+"."+role,role,binary_role:i.toString(2).padStart(2,"0"),counterpart_id:peer.id})):[]};
  })};
}

export async function sourceRows(db){
  const [f,r]=await db.batch([
    db.prepare("SELECT agent_id,execution_status FROM tabor_agent_assignments ORDER BY agent_id LIMIT 1001"),
    db.prepare("SELECT id,state FROM nathan_rotational_agents ORDER BY id LIMIT 1001"),
  ]);
  if(f.results.length>1000||r.results.length>1000)throw Error("Source roster exceeds the configured limit.");
  return {fleet:f.results,rotation:r.results};
}

export async function githubWorkflows(fetcher=fetch) {
  const endpoint="https://api.github.com/repos/"+repo+"/actions/workflows";
  const rows=[];
  for(let page=1;page<=10;page++){
    const r=await fetcher(endpoint+"?per_page=100&page="+page,{headers:{"User-Agent":"Tabor-Family-Federation",
      "Accept":"application/vnd.github+json"},signal:AbortSignal.timeout(8000)});
    if(!r.ok)throw Error("GitHub roster unavailable.");
    const body=await r.json();
    if(!Array.isArray(body.workflows)||!Number.isInteger(body.total_count)||body.total_count>1000)throw Error("GitHub roster limit exceeded.");
    rows.push(...body.workflows);
    if(rows.length===body.total_count)return rows;
    if(!body.workflows.length||rows.length>body.total_count)throw Error("Incomplete GitHub roster.");
  }
  throw Error("GitHub roster pagination incomplete.");
}

export async function refresh(db,fetcher=fetch,observedMs=Date.now()){
  const [workflows,data]=await Promise.all([githubWorkflows(fetcher),sourceRows(db)]);
  const snapshot=makeSnapshot(workflows,data.fleet,data.rotation,observedMs);
  if(!summarize(snapshot).meeting)throw Error("Both families are required for a federation snapshot.");
  const payload=JSON.stringify(snapshot),digest=await sha(payload);
  await db.prepare(`INSERT INTO ${table}(singleton,observed_ms,roster_json,sha256) VALUES(1,?,?,?)
    ON CONFLICT(singleton) DO UPDATE SET observed_ms=excluded.observed_ms,roster_json=excluded.roster_json,sha256=excluded.sha256
    WHERE excluded.observed_ms>${table}.observed_ms`).bind(observedMs,payload,digest).run();
  return {snapshot,digest};
}

export async function readSnapshot(db){
  const row=await db.prepare("SELECT roster_json,sha256 FROM "+table+" WHERE singleton=1").first();
  if(!row)return null;
  return {snapshot:JSON.parse(row.roster_json),digest:row.sha256};
}
