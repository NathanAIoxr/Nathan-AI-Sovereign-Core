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
const ownerDomain = '.nathantaboract.workers.dev';
const services = new Map([
 ['one-sovereign-hub', {
  path:'/health', check:'hub-bindings',
  verify:d=>d.service==='one-sovereign-hub'&&['d1','durable_objects','kv','queue','workflow'].every(k=>d.bindings?.[k]===true),
 }],
 ['hook-and-ring', {
  path:'/api/status', check:'tournament-storage',
  verify:d=>d.service==='hook-and-ring'&&d.onlinePlay===true,
 }],
 ['grapple-it', {
  path:'/api/daily', check:'daily-leaderboard',
  verify:d=>typeof d.day==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(d.day)&&Array.isArray(d.scores)&&d.scores.length<=20,
 }],
 ['tabor-database-atlas', {
  path:'/api/status', check:'database-registry',
  verify:d=>Number.isSafeInteger(d.registry?.tracked)&&d.registry.tracked>0&&
   Array.isArray(d.projects)&&d.projects.length>0&&d.audit?.ledgerOk===true,
 }],
]);

export const fleetContractCount = services.size;

export async function boundedText(response, limit) {
 const reader=response.body?.getReader();
 if(!reader)throw new Error('Response body missing');
 const decoder=new TextDecoder('utf-8',{fatal:true});
 let bytes=0,text='';
 try {
  while(true){
   const {done,value}=await reader.read();
   if(done)return text+decoder.decode();
   bytes+=value.byteLength;
   if(bytes>limit)throw new Error('Response body exceeds limit');
   text+=decoder.decode(value,{stream:true});
  }
 }catch(error){
  await reader.cancel().catch(()=>{});
  throw error;
 }finally{
  reader.releaseLock();
 }
}

async function checkTarget(url, service, request) {
 const started=Date.now();
 const response=await request(service?new URL(service.path,url).href:url,{
  method:'GET',redirect:'manual',signal:AbortSignal.timeout(5000),
  headers:{'User-Agent':'ONE-Bounded-Health-Check/1.0'},
 });
 const result={healthy:response.ok,status:response.status,latency_ms:Date.now()-started};
 if(!service||!response.ok){
  await response.body?.cancel();
  return result;
 }
 if(response.headers.get('Content-Type')?.split(';',1)[0].trim().toLowerCase()!=='application/json'){
  await response.body?.cancel();
  return {...result,healthy:false,reason:'unexpected_content_type'};
 }
 try{
  const data=JSON.parse(await boundedText(response,16384));
  const healthy=!!data&&service.verify(data);
  return {...result,healthy,latency_ms:Date.now()-started,...(healthy?{}:{reason:'contract_not_satisfied'})};
 }catch{
  return {...result,healthy:false,reason:'invalid_health_payload'};
 }
}

export async function probeFleet(hub,catalog,request=fetch){
 if(hub.env.FLEET_PROBES!=='enabled')return {mode:'disabled',healthy:true,checked:0};
 const urls=[...new Set(catalog.apps.map(a=>a.url))].filter(value=>{try{const u=new URL(value);return u.protocol==='https:'&&u.hostname.endsWith(ownerDomain)&&!u.username&&!u.password&&!u.port&&!u.search&&!u.hash;}catch{return false;}});
 if(!urls.length)return {healthy:true,checked:0,total:0};
 const cursor=hub.get('fleet_cursor',0)%urls.length,observations=[];
 for(let offset=0;offset<Math.min(4,urls.length);offset++){
  const url=urls[(cursor+offset)%urls.length];
  const origin=new URL(url);
  const service=origin.pathname==='/'?services.get(origin.hostname.slice(0,-ownerDomain.length)):null;
  const result=await supervise(hub,'public:'+url,()=>checkTarget(url,service,request));
  observations.push({url,check:service?.check??'public-reachability',...result});
 }
 hub.set('fleet_cursor',(cursor+Math.min(4,urls.length))%urls.length);
 const report={
  healthy:observations.every(x=>x.healthy),
  checked:observations.filter(x=>!x.deferred).length,
  deferred:observations.filter(x=>x.deferred).length,
  total:urls.length,
  coverage:'Named service contracts and public reachability for entries without an adapter',
  observations,
 };
 hub.set('fleet_latest',report);return report;
}
export function healingStatus(hub,roles){return {policy:'bounded recurring verification, exponential cooldown, incident escalation',roles:roles.map(r=>({role:r.id,...hub.get('healing:'+r.id,{state:'unverified'})})),fleet:hub.get('fleet_latest',null),catalog:hub.get('catalog_verified',null),automatic_actions:['reconstruct derived projection','deliver durable idempotent outbox','refresh or restore validated public catalog'],source_data_rewrites:false};}
