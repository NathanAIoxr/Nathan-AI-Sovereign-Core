// Safe, sparse bridge to existing Cloudflare bindings. Requires explicit allowlisted jobs.
import {zoneFor,launchEligibility} from './holding-zones.js';
import {hash} from './reader.js';
const ROLES=new Set(['NATHAN_GH_BOT','NATHAN_CF_BOT','NATHAN_LINK_TRACER']);
const MAX_BATCH=25;
export class VirtualZoneDispatcher {
 constructor(env){this.env=env;}
 async stopped(){if(!this.env.ZONE_KV)throw Error('ZONE_KV missing');return (await this.env.ZONE_KV.get('KILL_SWITCH_ACTIVE'))!=='0';}
 async audit(id,action,result){await this.env.ZONE_DB.prepare('INSERT INTO virtual_zone_audit(identity_id,action,result,at) VALUES(?,?,?,?)').bind(id,action,result,new Date().toISOString()).run();}
 async stageIdentity(namespace,id,role='NATHAN_LINK_TRACER'){
  if(await this.stopped())return {status:'BLOCKED_BY_KILL_SWITCH'};
  if(!ROLES.has(role))throw Error('invalid role');
  const manifest=zoneFor(namespace,id);if(!manifest)throw Error('invalid identity');
  const identity=manifest.zoneId,body=JSON.stringify(manifest),fingerprint=await hash(body);
  await this.env.ZONE_DB.prepare(`INSERT INTO virtual_zones(identity_id,reader_role,manifest_json,manifest_hash,updated_at) VALUES(?,?,?,?,?)
   ON CONFLICT(identity_id) DO NOTHING`).bind(identity,role,body,fingerprint,new Date().toISOString()).run();
  await this.audit(identity,'STAGE','HOLD');
  return {identity_id:identity,status:'HOLD',manifest_hash:fingerprint};
 }
 async dispatchBoundedRead(identity,targets,approvedHosts=[]){
  if(await this.stopped())return {status:'BLOCKED_BY_KILL_SWITCH'};
  if(!Array.isArray(targets)||targets.length>MAX_BATCH||!Array.isArray(approvedHosts))throw Error('invalid batch');
  const row=await this.env.ZONE_DB.prepare('SELECT * FROM virtual_zones WHERE identity_id=?').bind(identity).first();
  if(!row||!['HOLD','REHEARSAL'].includes(row.zone_state))return {status:'NOT_DISPATCHABLE'};
  const hosts=new Set(approvedHosts.map(h=>String(h).toLowerCase()));
  const approved=targets.every(t=>{try{const u=new URL(t);return u.protocol==='https:'&&hosts.has(u.hostname.toLowerCase())&&!u.username&&!u.password;}catch{return false;}});
  if(!approved||!hosts.size)return {status:'TARGET_NOT_APPROVED'};
  if(!this.env.EMIT_BUS)throw Error('EMIT_BUS missing');
  for(const targetUri of targets){if(await this.stopped())return {status:'BLOCKED_BY_KILL_SWITCH'};await this.env.EMIT_BUS.send({event:'BOUNDED_READER_JOB',identity_id:identity,reader_role:row.reader_role,manifest_hash:row.manifest_hash,targetUri,hopDepth:0,approvedHosts:[...hosts]});}
  await this.audit(identity,'DISPATCH',String(targets.length));
  return {status:'QUEUED',count:targets.length};
 }
 async assessLaunch(identity,proofs,checks){
  if(await this.stopped())return {status:'BLOCKED_BY_KILL_SWITCH'};
  const row=await this.env.ZONE_DB.prepare('SELECT * FROM virtual_zones WHERE identity_id=?').bind(identity).first();
  if(!row)return {status:'NOT_FOUND'};
  const manifest=JSON.parse(row.manifest_json);
  if(!launchEligibility(manifest,checks))return {status:'GATES_FAILED'};
  if(!proofs||proofs.alien?.manifest_hash!==row.manifest_hash||proofs.neila?.manifest_hash!==row.manifest_hash||proofs.alien?.result!=='PASS'||proofs.neila?.result!=='PASS'||proofs.alien?.reviewer===proofs.neila?.reviewer||!proofs.alien?.reviewer||!proofs.neila?.reviewer)return {status:'PROOFS_FAILED'};
  // Two independent attestations; hashes alone are not authorization.
  await this.env.ZONE_DB.prepare("UPDATE virtual_zones SET zone_state='READY_FOR_SWITCH',alien_proof=?,neila_proof=?,updated_at=? WHERE identity_id=? AND zone_state IN ('HOLD','REHEARSAL')").bind(await hash(JSON.stringify(proofs.alien)),await hash(JSON.stringify(proofs.neila)),new Date().toISOString(),identity).run();
  await this.audit(identity,'ASSESS','READY_FOR_SWITCH');
  return {status:'READY_FOR_SWITCH',deploymentVerified:false};
 }
 // LAUNCHED is set only by an independently verified deployment controller.
 async recordVerifiedLaunch(identity,{deploymentRef,route,verified,ownerApproved}={}){
  if(await this.stopped())return {status:'BLOCKED_BY_KILL_SWITCH'};
  if(!verified||!ownerApproved||!deploymentRef||!route)return {status:'VERIFICATION_REQUIRED'};
  const result=await this.env.ZONE_DB.prepare("UPDATE virtual_zones SET zone_state='LAUNCHED',deployment_ref=?,bound_route=?,updated_at=? WHERE identity_id=? AND zone_state='READY_FOR_SWITCH'").bind(deploymentRef,route,new Date().toISOString(),identity).run();
  if(!result.meta?.changes)return {status:'INVALID_TRANSITION'};
  await this.audit(identity,'LAUNCH',deploymentRef);
  return {status:'LAUNCHED',deploymentRef,route};
 }
}
