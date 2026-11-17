import {supervise,probeFleet,healingStatus,boundedText} from './healing.mjs';
import {canonical,digest,id,requireThat,utf8} from './core.mjs';
const SOURCE='https://raw.githubusercontent.com/NathanAIoxr/Nathan-AI-Sovereign-Core/main/app-factory/sovereign-hub/cloudflare/public/apps.json';
export const BOT_ROLES=Object.freeze([
 {id:'ant-catalog-courier',family:'ant',mission:'Refresh or restore the validated public app catalog',scope:'public metadata',new_executor:true},
 {id:'bee-source-verifier',family:'bee',mission:'Hash the exact public catalog',source_role:'swarm-specialist-18',source_handler:'worker_source_verifier',scope:'public metadata',runtime:'JavaScript SHA-256 adapter'},
 {id:'bee-grapple-observer',family:'bee',mission:'Read the existing Grapple It bee receipt',existing_service:'grapple-it-bees',scope:'public QA status'},
 {id:'bee-hook-observer',family:'bee',mission:'Read the existing Hook and Ring bee receipt',existing_service:'hook-and-ring-bee',scope:'public QA status'},
 {id:'ant-adoption-scout',family:'ant',mission:'Check catalog identity, count and adoption status',scope:'public metadata',new_executor:true},
 {id:'ant-projection-medic',family:'ant',mission:'Verify and reconstruct only derived D1 projections',scope:'derived diagnostics',new_executor:true},
 {id:'ant-outbox-carrier',family:'ant',mission:'Deliver at most five durable outbox jobs',scope:'own outbox',new_executor:true},
 {id:'ant-fleet-sentinel',family:'ant',mission:'Verify up to four public app contracts or entry pages with per-app cooldown',scope:'public owner app pages',new_executor:true},
 {id:'ant-receipt-auditor',family:'ant',mission:'Count pending and halted delivery receipts',scope:'own operational metadata',new_executor:true}
]);
const CATALOG_KEY='asset:/apps.json';
const CATALOG_LIMIT=512*1024;

function validateCatalog(text){
 requireThat(typeof text==='string'&&utf8(text).byteLength<=CATALOG_LIMIT,'Catalog exceeds bound');
 const catalog=JSON.parse(text);
 requireThat(catalog?.schema==='one.public-app-catalog.v1'&&Array.isArray(catalog.apps)&&
  catalog.apps.length>0&&catalog.apps.length<=3000&&catalog.count===catalog.apps.length,'Catalog count/schema rejected');
 const seen=new Set();
 for(const app of catalog.apps){
  id(app.id);
  requireThat(!seen.has(app.id)&&typeof app.title==='string'&&typeof app.group==='string'&&
   typeof app.adoption==='string'&&typeof app.entry==='string'&&!app.entry.includes('..')&&
   (app.entry.startsWith('app-factory/')||app.entry.startsWith('standalone-apps/')),'Catalog identity/path rejected');
  seen.add(app.id);
  const url=new URL(app.url);
  requireThat(url.protocol==='https:'&&!url.username&&!url.password&&!url.port&&
   (url.hostname.endsWith('.nathantaboract.workers.dev')||url.hostname==='nathanaioxr.github.io'),'Catalog URL rejected');
 }
 return catalog;
}

async function readCatalog(hub){
 if(hub.env.ASSETS){
  const result=await hub.env.ASSETS.fetch('https://one-assets.local/apps.json');
  requireThat(result.ok,'Bundled catalog unavailable');
  return boundedText(result,CATALOG_LIMIT);
 }
 const asset=await hub.env.PUBLIC_KV?.get(CATALOG_KEY,{type:'json'});
 return asset?.mime==='application/json'?asset.content:null;
}

async function currentCatalog(hub){
 try{
  const text=await readCatalog(hub);
  return {text,data:validateCatalog(text)};
 }catch{
  return null;
 }
}

async function catalog(hub){
 const current=await currentCatalog(hub);
 return current?.data??validateCatalog(hub.get('catalog_last_good'));
}

async function rememberCatalog(hub,text,data,now,action){
 const receipt={action,checked_at:now,count:data.count,sha256:await digest(text)};
 hub.tx(()=>{
  hub.set('catalog_last_good',text);
  hub.set('catalog_verified',receipt);
 });
 return receipt;
}

async function publishCatalog(hub,text,data,now,action){
 await hub.env.PUBLIC_KV.put(CATALOG_KEY,JSON.stringify({content:text,mime:'application/json'}));
 const updated=await currentCatalog(hub);
 if(updated?.text!==text)return {healthy:false,action,reason:'catalog_readback_pending'};
 return {healthy:true,...await rememberCatalog(hub,text,data,now,action)};
}

export async function refreshCatalog(hub,force=false,request=fetch,now=Date.now()){
 const current=await currentCatalog(hub);
 const lastGood=hub.get('catalog_last_good');
 if(current&&current.text!==lastGood){
  await rememberCatalog(hub,current.text,current.data,now,'checkpointed');
 }
 if(hub.env.ASSETS||!hub.env.PUBLIC_KV){
  return {healthy:!!current,refreshed:false,mode:'bundled catalog'};
 }
 if(!current&&lastGood){
  let data;
  try{data=validateCatalog(lastGood);}
  catch{return {healthy:false,reason:'catalog_checkpoint_invalid'};}
  if(await digest(lastGood)!==hub.get('catalog_verified')?.sha256){
   return {healthy:false,reason:'catalog_checkpoint_hash_mismatch'};
  }
  return publishCatalog(hub,lastGood,data,now,'restored');
 }
 if(hub.env.REMOTE_CATALOG!=='enabled'){
  return {healthy:!!current,refreshed:false,mode:'catalog source disabled'};
 }
 const last=hub.get('catalog_fetch',null);
 if(!force&&last!==null&&now-last<6*3600000){
  return {healthy:!!current,refreshed:false,reason:'six-hour source cooldown'};
 }
 hub.set('catalog_fetch',now);
 const response=await request(SOURCE,{redirect:'manual',signal:AbortSignal.timeout(8000)});
 if(!response.ok){
  await response.body?.cancel();
  return {healthy:false,refreshed:false,source_status:response.status,keeping_existing:!!current};
 }
 const text=await boundedText(response,CATALOG_LIMIT),data=validateCatalog(text);
 if(text===current?.text)return {healthy:true,refreshed:false,reason:'source unchanged',count:data.count};
 const result=await publishCatalog(hub,text,data,now,'refreshed');
 return {...result,refreshed:result.healthy};
}
async function monitor(binding,name,path){if(!binding)return {available:false,service:name,healthy:false,reason:'binding unavailable'};try{const response=await binding.fetch('https://'+name+'.nathantaboract.workers.dev'+path,{signal:AbortSignal.timeout(8000)});const data=await response.json();return {available:true,service:name,http_status:response.status,healthy:response.ok&&(data.status==='pass'||data.latest?.ok===true)&&data.stale!==true,checked_at:data.checkedAt??data.latest?.startedAt??null,check_count:Array.isArray(data.checks)?data.checks.length:(data.latest?.checks?.length??0)};}catch{return {available:false,service:name,healthy:false,reason:'No usable public receipt'};}}
async function execute(hub,role,manual){switch(role.id){case 'ant-fleet-sentinel':return probeFleet(hub,await catalog(hub).catch(()=>({apps:[]})));case 'ant-catalog-courier':return refreshCatalog(hub,manual);case 'bee-source-verifier':{const data=await catalog(hub);return {source_role:'swarm-specialist-18',source_handler:'worker_source_verifier',sha256:await digest(canonical(data)),catalog_count:data.count,independent_model:false};}case 'bee-grapple-observer':return monitor(hub.env.GRAPPLE_BEE,'grapple-it-bees','/status');case 'bee-hook-observer':return monitor(hub.env.HOOK_BEE,'hook-and-ring-bee','/api/status');case 'ant-adoption-scout':{const data=await catalog(hub),counts={};for(const app of data.apps)counts[app.adoption]=(counts[app.adoption]??0)+1;return {count:data.count,unique_ids:true,adoption:counts,registration_is_integration:false};}case 'ant-projection-medic':return hub.maintenance();case 'ant-outbox-carrier':return hub.flush();case 'ant-receipt-auditor':return {states:hub.rows('SELECT state,COUNT(*) AS count FROM outbox GROUP BY state'),exhausted:hub.row("SELECT COUNT(*) AS n FROM outbox WHERE attempts>=5 AND state!='done'").n};default:throw new Error('Unknown bot role');}}
export function swarmStatus(hub){return {healing:healingStatus(hub,BOT_ROLES),runtime:'bounded deterministic jobs and read-only existing-bee adapters',roles:BOT_ROLES.map(role=>({...role,paused:!!hub.row('SELECT veto FROM bot_controls WHERE id=?',role.id)?.veto})),paused:!!hub.row("SELECT veto FROM bot_controls WHERE id='*'")?.veto,recent:hub.rows('SELECT id,state,started,finished,summary FROM bot_cycles ORDER BY started DESC LIMIT 12').map(row=>({...row,summary:row.summary?JSON.parse(row.summary):null})),model_processes_started:0};}
export async function runSwarm(hub,cycle,manual=false){id(cycle);const existing=hub.row('SELECT * FROM bot_cycles WHERE id=?',cycle);if(existing?.finished)return JSON.parse(existing.summary);if(hub.row("SELECT veto FROM bot_controls WHERE id='*'")?.veto)return {state:'vetoed',cycle,executed:0};const now=Date.now(),day=new Date().toISOString().slice(0,10);hub.tx(()=>{const lease=hub.get('swarm_lease');requireThat(!lease||lease.until<now,'Another swarm cycle owns the lease',409);requireThat(hub.row('SELECT COUNT(*) AS n FROM bot_cycles WHERE started>=?',Date.parse(day+'T00:00:00Z')).n<100,'Daily swarm budget reached',429);hub.set('swarm_lease',{cycle,until:now+90000});hub.rows("INSERT OR IGNORE INTO bot_cycles(id,state,started) VALUES(?,'running',?)",cycle,now);for(const role of BOT_ROLES)hub.rows("INSERT OR IGNORE INTO bot_jobs(cycle,role,state,attempts) VALUES(?,?,'queued',0)",cycle,role.id);});let executed=0,failed=0,vetoed=0,attention=0;try{for(const role of BOT_ROLES){if(hub.row("SELECT veto FROM bot_controls WHERE id='*'")?.veto||hub.row('SELECT veto FROM bot_controls WHERE id=?',role.id)?.veto){hub.rows("UPDATE bot_jobs SET state='vetoed' WHERE cycle=? AND role=?",cycle,role.id);vetoed++;continue;}const job=hub.row('SELECT * FROM bot_jobs WHERE cycle=? AND role=?',cycle,role.id);if(job.state==='completed')continue;if(job.attempts>=3){failed++;continue;}hub.rows("UPDATE bot_jobs SET state='running',attempts=attempts+1 WHERE cycle=? AND role=?",cycle,role.id);try{const result=await (role.id==='ant-fleet-sentinel'?execute(hub,role,manual):supervise(hub,role.id,()=>execute(hub,role,manual))),encoded=canonical(result);requireThat(encoded.length<=8192,'Bot output exceeds bound');const hash=await digest(encoded);hub.rows("UPDATE bot_jobs SET state='completed',result=?,hash=? WHERE cycle=? AND role=?",encoded,hash,cycle,role.id);executed++;if(result.healthy===false||result.exhausted>0)attention++;}catch(error){hub.rows("UPDATE bot_jobs SET state='failed',result=? WHERE cycle=? AND role=?",canonical({reason:'bounded_job_failed'}),cycle,role.id);failed++;}}const summary={cycle,state:failed||attention?'attention_required':'completed',executed,failed,vetoed,observations_needing_attention:attention,roles:BOT_ROLES.length,independent_model_processes:0};hub.rows('UPDATE bot_cycles SET state=?,finished=?,summary=? WHERE id=?',summary.state,Date.now(),canonical(summary),cycle);return summary;}finally{if(hub.get('swarm_lease')?.cycle===cycle)hub.set('swarm_lease',null);hub.rows('DELETE FROM bot_jobs WHERE cycle IN (SELECT id FROM bot_cycles WHERE finished<?)',Date.now()-30*86400000);hub.rows('DELETE FROM bot_cycles WHERE finished<?',Date.now()-30*86400000);}}
