// Durable, bounded recovery policy: keep checking without retry storms.
export function transition(previous,healthy,now=Date.now()){
 const old=previous??{failures:0,opened:0,incidents:0};
 if(healthy)return {failures:0,opened:0,next:0,incidents:old.incidents,state:'healthy',verified:now};
 const failures=old.failures+1;
 return {failures,opened:old.opened||now,next:now+Math.min(3600000,60000*2**Math.min(failures-1,6)),incidents:old.incidents+(old.failures===0?1:0),state:failures>=3?'escalated':'cooldown',verified:old.verified??null};
}
export async function supervise(hub,role,operation,now=Date.now()){
 const key='healing:'+role,previous=hub.get(key,null);
 if(previous?.next>now)return {healthy:false,deferred:true,role,retry_at:previous.next,state:previous.state};
 let result;
 try{result=await operation();}catch{result={healthy:false,reason:'bounded_operation_failed'};}
 const healthy=result.healthy!==false&&!(result.exhausted>0)&&!(result.source_status>=400);
 const state=transition(previous,healthy,now);hub.set(key,state);
 return {...result,healthy,recovery:state};
}
const ownerDomain='.nathantaboract.workers.dev';
const hubUrl=(worker,path='/')=>'https://'+worker+ownerDomain+path;
const titlePattern=/<title[^>]*>([^<]*)<\/title\s*>/iu;
const cycleMs=15*60_000;
const targetsPerCycle=4;

function fresh(value,now){
 const timestamp=typeof value==='number'?value:Date.parse(value);
 return Number.isFinite(timestamp)&&timestamp<=now+60_000&&now-timestamp<=cycleMs;
}

const contracts=[
 ['one-sovereign-hub','/health','hub-bindings',
  d=>d.service==='one-sovereign-hub'&&['d1','durable_objects','kv','queue','workflow'].every(k=>d.bindings?.[k]===true)],
 ['hook-and-ring','/api/status','tournament-storage',d=>d.service==='hook-and-ring'&&d.onlinePlay===true],
 ['grapple-it','/api/daily','daily-leaderboard',
  d=>typeof d.day==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(d.day)&&Array.isArray(d.scores)&&d.scores.length<=20],
 ['tabor-database-atlas','/api/status','database-registry',
  d=>Number.isSafeInteger(d.registry?.tracked)&&d.registry.tracked>0&&Array.isArray(d.projects)&&d.projects.length>0&&d.audit?.ledgerOk===true],
 ['tabor-tracker-ball','/health','tracker-ball-release',
  d=>d.ok===true&&d.app==='tabor-tracker-ball'&&Number.isSafeInteger(d.games)&&d.games>0],
 ['nathan-ai-help-wanted','/health','help-wanted-queue',
  d=>d.ok===true&&d.queueReady===true&&Number.isSafeInteger(d.indexedOpen)&&d.indexedOpen>=0],
 ['nathan-ai-help-wanted-live','/api/overview','help-wanted-dependencies',
  d=>Array.isArray(d.unavailable)&&d.unavailable.length===0&&d.handoff&&d.discovery],
 ['bibletopia-release-bee','/api/status','bibletopia-release-receipt',
  (d,now)=>d.status==='passing'&&fresh(d.checkedAt,now)&&Array.isArray(d.checks)&&d.checks.length>0],
 ['grapple-it-bees','/status','grapple-release-receipt',
  (d,now)=>d.status==='pass'&&fresh(d.checkedAt,now)&&Array.isArray(d.checks)&&d.checks.length>0],
 ['hook-and-ring-bee','/api/status','hook-release-receipt',
  (d,now)=>d.stale===false&&d.latest?.ok===true&&fresh(d.latest.startedAt,now)&&Array.isArray(d.latest.checks)&&d.latest.checks.length>0],
 ['tabor-universal-library-engine','/app-factory/tabor-universal-library-engine/public/catalog.json','library-engine-catalog',
  d=>Array.isArray(d.ledger)&&Array.isArray(d.trackerSupplement)&&d.ledger.length+d.trackerSupplement.length===101&&
   Array.isArray(d.runnableNumbers)&&d.runnableNumbers.length>0, '/app-factory/tabor-universal-library-engine/public/'],
];
const pages=[
 ['bibletopia','/','BIBLETOPIA by Nathan Tabor'],
 ['dual-screen-arcade','/','Dual-Screen Arcade by Nathan Tabor'],
 ['nathan-absolute-intelligence','/','NATHAN AI · Absolute Intelligence'],
 ['nathan-ai-sovereign-hive','/','Nathan AI Sovereign Hive'],
 ['nathan-ai-workers','/','Nathan AI · Worker Workspace'],
 ['nathan-ai-truthstream','/','Nathan AI · Truthstream Communications'],
 ['pee-and-dee-books','/','Pee &amp; Dee • Two Peas from Two Pods'],
 ['pee-dee-valley','/','Pee Tabor and Dee Tabor of the Pee Dee Valley'],
 ['tower-of-babel-by-nathan-tabor','/','The Tower of Babel by Nathan Tabor'],
 ['tabor-universal-library-engine','/app-factory/tabor-universal-library-engine/public/world/','Tabor World by Nathan Tabor'],
];
const registry=[
 ...contracts.map(([worker,path,check,verify,entry])=>({url:hubUrl(worker,entry),path,kind:'contract',check,verify})),
 ...pages.map(([worker,path,title])=>({url:hubUrl(worker,path),path,kind:'page-identity',check:'page-title',verify:text=>titlePattern.exec(text)?.[1].trim()===title})),
];

export const fleetContractCount=contracts.length;
export const fleetRegistryCount=registry.length;

export async function boundedText(response,limit,stopAt=null){
 const reader=response.body?.getReader();
 if(!reader)throw new Error('Response body missing');
 const decoder=new TextDecoder('utf-8',{fatal:true});
 let bytes=0,text='';
 try{
  while(true){
   const {done,value}=await reader.read();
   if(done)return text+decoder.decode();
   const remaining=limit-bytes;
   const scanned=stopAt?value.subarray(0,remaining):value;
   bytes+=value.byteLength;
   text+=decoder.decode(scanned,{stream:true});
   if(stopAt?.test(text)){
    await reader.cancel().catch(()=>{});
    return text;
   }
   if(bytes>limit)throw new Error('Response body exceeds limit');
  }
 }catch(error){
  await reader.cancel().catch(()=>{});
  throw error;
 }finally{
  reader.releaseLock();
 }
}

async function checkTarget(target,request,now){
 const started=Date.now();
 const response=await request(target.path?new URL(target.path,target.url).href:target.url,{
  method:'GET',redirect:'manual',signal:AbortSignal.timeout(5000),
  headers:{'User-Agent':'ONE-Bounded-Health-Check/1.0'},
 });
 const result={healthy:response.ok,status:response.status,latency_ms:Date.now()-started};
 if(!target.verify||!response.ok){
  await response.body?.cancel();
  return result;
 }
 const json=target.kind==='contract';
 const type=response.headers.get('Content-Type')?.split(';',1)[0].trim().toLowerCase();
 if(type!==(json?'application/json':'text/html')){
  await response.body?.cancel();
  return {...result,healthy:false,reason:'unexpected_content_type'};
 }
 try{
  const text=await boundedText(response,json?256*1024:16*1024,json?null:titlePattern);
  const data=json?JSON.parse(text):text;
  const healthy=!!data&&!!target.verify(data,now);
  return {...result,healthy,latency_ms:Date.now()-started,...(healthy?{}:{reason:'contract_not_satisfied'})};
 }catch{
  return {...result,healthy:false,reason:'invalid_health_payload'};
 }
}

function ownedUrl(value){
 try{
  const url=new URL(value);
  return url.href.length<=240&&url.protocol==='https:'&&url.hostname.endsWith(ownerDomain)&&
   !url.username&&!url.password&&!url.port&&!url.search&&!url.hash?url.href:null;
 }catch{return null;}
}

function fleetTargets(catalog){
 const targets=new Map(registry.map(target=>[target.url,target]));
 const registeredWorkers=new Set(registry.map(t=>new URL(t.url).hostname));
 for(const entry of catalog.apps){
  const url=ownedUrl(entry.url);
  if(!url||targets.has(url))continue;
  const candidate=new URL(url);
  if(candidate.pathname==='/'&&registeredWorkers.has(candidate.hostname))continue;
  targets.set(url,{url,kind:'reachability',check:'public-reachability'});
 }
 return [...targets.values()];
}

export async function probeFleet(hub,catalog,request=fetch,now=Date.now()){
 if(hub.env.FLEET_PROBES!=='enabled')return {mode:'disabled',healthy:true,checked:0};
 const targets=fleetTargets(catalog),observations=[],count=Math.min(targetsPerCycle,targets.length);
 const cursor=hub.get('fleet_cursor',0)%targets.length;
 const previous=new Map(hub.get('fleet_receipts',[]).map(row=>[row.url,row]));
 const current=new Map();
 for(const target of targets){
  const saved=previous.get(target.url);
  if(saved?.check===target.check&&saved.route===(target.path??new URL(target.url).pathname)){
   current.set(target.url,saved);continue;
  }
  current.set(target.url,{url:target.url,kind:target.kind,check:target.check,
   route:target.path??new URL(target.url).pathname,last_checked_at:null,last_healthy_at:null});
 }
 for(let offset=0;offset<count;offset++){
  const target=targets[(cursor+offset)%targets.length];
  const result=await supervise(hub,'public:'+target.url,()=>checkTarget(target,request,now),now);
  const saved=current.get(target.url);
  const receipt=result.deferred?{...saved,retry_at:result.retry_at}:{...saved,
   last_checked_at:now,last_healthy_at:result.healthy?now:saved.last_healthy_at,
   healthy:result.healthy,http_status:result.status??null,reason:result.reason??null,
   retry_at:result.recovery?.next||null,latency_ms:result.latency_ms??null};
  current.set(target.url,receipt);
  observations.push({url:target.url,check:target.check,...result});
 }
 const report={healthy:observations.every(x=>x.healthy),checked:observations.filter(x=>!x.deferred).length,
  deferred:observations.filter(x=>x.deferred).length,total:targets.length,
  coverage:'Service contracts, page identity and public reachability',
  observations};
 hub.tx(()=>{
  hub.set('fleet_cursor',(cursor+count)%targets.length);
  hub.set('fleet_receipts',[...current.values()]);
  hub.set('fleet_latest',report);
 });
 return report;
}

export function fleetCoverage(hub,now=Date.now()){
 const rows=hub.get('fleet_receipts',[]);
 const cycleWindow=2*cycleMs*Math.ceil(rows.length/targetsPerCycle);
 const counts={total:rows.length,healthy:0,attention:0,stale:0,pending:0};
 const targets=rows.map(row=>{
  const state=row.last_checked_at===null?'pending':
   now-row.last_checked_at>cycleWindow?'stale':row.healthy?'healthy':'attention';
  counts[state]++;
  const automatic_repairs=row.check==='hub-bindings'?['public catalog','D1 projection','outbox delivery']:[];
  return {...row,state,automatic_repairs};
 });
 return {counts,targets,rotation_minutes:cycleMs/60000,checks_per_cycle:targetsPerCycle,
  configured:hub.env.FLEET_PROBES==='enabled',registry:registry.length};
}

export function healingStatus(hub,roles){return {policy:'bounded recurring verification, exponential cooldown, incident escalation',roles:roles.map(r=>({role:r.id,...hub.get('healing:'+r.id,{state:'unverified'})})),fleet:hub.get('fleet_latest',null),fleet_coverage:fleetCoverage(hub),catalog:hub.get('catalog_verified',null),automatic_actions:['reconstruct derived projection','deliver durable idempotent outbox','refresh or restore validated public catalog'],source_data_rewrites:false};}
