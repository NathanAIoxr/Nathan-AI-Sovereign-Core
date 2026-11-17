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
export async function probeFleet(hub,catalog,request=fetch){
 if(hub.env.FLEET_PROBES!=='enabled')return {mode:'disabled',healthy:true,checked:0};
 // Only public entry pages on this owner's fixed Workers subdomain. No redirects,
 // credentials, path-derived arbitrary URLs, private APIs, writes or restarts.
 const urls=[...new Set(catalog.apps.map(a=>a.url))].filter(value=>{try{const u=new URL(value);return u.protocol==='https:'&&u.hostname.endsWith('.nathantaboract.workers.dev')&&!u.username&&!u.password&&!u.port&&!u.search&&!u.hash;}catch{return false;}});
 if(!urls.length)return {healthy:true,checked:0};
 const cursor=hub.get('fleet_cursor',0)%urls.length,observations=[];
 for(let offset=0;offset<Math.min(4,urls.length);offset++){
  const url=urls[(cursor+offset)%urls.length];
  const result=await supervise(hub,'public:'+url,async()=>{
   const started=Date.now();const response=await request(url,{method:'GET',redirect:'manual',signal:AbortSignal.timeout(5000),headers:{'User-Agent':'ONE-Bounded-Health-Check/1.0'}});
   const healthy=response.ok;await response.body?.cancel();return {healthy,status:response.status,latency_ms:Date.now()-started};
  });
  observations.push({url,...result});
 }
 hub.set('fleet_cursor',(cursor+Math.min(4,urls.length))%urls.length);
 const report={healthy:observations.every(x=>x.healthy),checked:observations.length,total:urls.length,coverage:'public reachability only; application semantics require an integrated health adapter',observations};
 hub.set('fleet_latest',report);return report;
}
export function healingStatus(hub,roles){return {policy:'bounded recurring verification, exponential cooldown, incident escalation',roles:roles.map(r=>({role:r.id,...hub.get('healing:'+r.id,{state:'unverified'})})),fleet:hub.get('fleet_latest',null),automatic_actions:['reconstruct derived projection','deliver durable idempotent outbox','refresh validated public catalog'],source_data_rewrites:false};}
