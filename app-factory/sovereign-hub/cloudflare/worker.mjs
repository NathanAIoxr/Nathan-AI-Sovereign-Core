import {CORE_ACTION,coreRegistry,defaultGuards,guardUpdate,allowAgent,profile,planRole,observationFromJob,verifyPortableGrant} from './personal-core.mjs';
import {BOT_ROLES,runSwarm,swarmStatus} from './swarm.mjs';
import {fleetContractCount,fleetRegistryCount} from './healing.mjs';
import {DurableObject,WorkflowEntrypoint} from 'cloudflare:workers';
import {ContractError,requireThat,fields,integer,id,canonical,b64,unb64,utf8,digest,hmac,verifyEd,isoDate,Interval,microapp,graphemeSlice,SCOPES,need,resource,CAPABILITIES,json,strictJson} from './core.mjs';

const OWNER='local-owner';
const SQL=`
CREATE TABLE IF NOT EXISTS bot_controls(id TEXT PRIMARY KEY,veto INTEGER NOT NULL CHECK(veto IN (0,1)));
CREATE TABLE IF NOT EXISTS bot_cycles(id TEXT PRIMARY KEY,state TEXT NOT NULL,started INTEGER NOT NULL,finished INTEGER,summary TEXT);
CREATE TABLE IF NOT EXISTS bot_jobs(cycle TEXT,role TEXT,state TEXT NOT NULL,attempts INTEGER NOT NULL DEFAULT 0,result TEXT,hash TEXT,PRIMARY KEY(cycle,role));
CREATE TABLE IF NOT EXISTS meta(k TEXT PRIMARY KEY,v TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS flows(id TEXT PRIMARY KEY,state TEXT NOT NULL,version INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS flow_events(seq INTEGER PRIMARY KEY AUTOINCREMENT,flow TEXT NOT NULL,before_state TEXT NOT NULL,after_state TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS devices(public_key TEXT PRIMARY KEY,created INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS revoked_devices(public_key TEXT PRIMARY KEY,revoked_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS agents(id TEXT PRIMARY KEY,public_key TEXT NOT NULL,scopes TEXT NOT NULL,resources TEXT NOT NULL,revoked INTEGER NOT NULL DEFAULT 0);
CREATE TABLE IF NOT EXISTS tokens(jti TEXT PRIMARY KEY,agent TEXT NOT NULL,expires INTEGER NOT NULL,revoked INTEGER NOT NULL DEFAULT 0);
CREATE TABLE IF NOT EXISTS nonces(holder TEXT,nonce TEXT,expires INTEGER NOT NULL,PRIMARY KEY(holder,nonce));
CREATE TABLE IF NOT EXISTS contexts(k TEXT PRIMARY KEY,body TEXT NOT NULL,version INTEGER NOT NULL,readers TEXT NOT NULL,expires INTEGER);
CREATE TABLE IF NOT EXISTS context_writers(k TEXT PRIMARY KEY REFERENCES contexts(k),agent TEXT NOT NULL REFERENCES agents(id));
CREATE TABLE IF NOT EXISTS connectors(id TEXT PRIMARY KEY,mode TEXT NOT NULL,status TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS records(connector TEXT,id TEXT,body TEXT NOT NULL,version INTEGER NOT NULL,PRIMARY KEY(connector,id));
CREATE TABLE IF NOT EXISTS changes(seq INTEGER PRIMARY KEY AUTOINCREMENT,connector TEXT NOT NULL,id TEXT NOT NULL,body TEXT NOT NULL,version INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS receipts(k TEXT PRIMARY KEY,payload TEXT NOT NULL,result TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS conflicts(id INTEGER PRIMARY KEY AUTOINCREMENT,connector TEXT,record TEXT,local TEXT NOT NULL,remote TEXT NOT NULL,resolved INTEGER NOT NULL DEFAULT 0);
CREATE TABLE IF NOT EXISTS faults(connector TEXT,code TEXT,body TEXT NOT NULL,PRIMARY KEY(connector,code));
CREATE TABLE IF NOT EXISTS audit(seq INTEGER PRIMARY KEY AUTOINCREMENT,actor TEXT NOT NULL,action TEXT NOT NULL,at INTEGER NOT NULL);
CREATE TRIGGER IF NOT EXISTS immutable_audit BEFORE UPDATE ON audit BEGIN SELECT RAISE(ABORT,'append-only audit'); END;
CREATE TRIGGER IF NOT EXISTS no_delete_audit BEFORE DELETE ON audit BEGIN SELECT RAISE(ABORT,'append-only audit'); END;
CREATE TABLE IF NOT EXISTS outbox(id TEXT PRIMARY KEY,kind TEXT NOT NULL,state TEXT NOT NULL DEFAULT 'pending',attempts INTEGER NOT NULL DEFAULT 0,updated INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS fences(resource TEXT PRIMARY KEY,token INTEGER NOT NULL CHECK(token>0));
CREATE TABLE IF NOT EXISTS bookings(id INTEGER PRIMARY KEY AUTOINCREMENT,resource TEXT NOT NULL,start TEXT NOT NULL,stop TEXT NOT NULL,token INTEGER NOT NULL,CHECK(start<stop));
CREATE TRIGGER IF NOT EXISTS booking_guard BEFORE INSERT ON bookings BEGIN
 SELECT CASE WHEN NOT EXISTS(SELECT 1 FROM fences WHERE resource=NEW.resource AND token=NEW.token) THEN RAISE(ABORT,'stale fence') END;
 SELECT CASE WHEN EXISTS(SELECT 1 FROM bookings WHERE resource=NEW.resource AND start<NEW.stop AND NEW.start<stop) THEN RAISE(ABORT,'overlap') END;
END;
CREATE TABLE IF NOT EXISTS booking_events(booking_id INTEGER PRIMARY KEY REFERENCES bookings(id));
CREATE TRIGGER IF NOT EXISTS immutable_bookings BEFORE UPDATE ON bookings BEGIN SELECT RAISE(ABORT,'immutable booking'); END;
CREATE TRIGGER IF NOT EXISTS no_delete_bookings BEFORE DELETE ON bookings BEGIN SELECT RAISE(ABORT,'immutable booking'); END;
CREATE TRIGGER IF NOT EXISTS immutable_booking_events BEFORE UPDATE ON booking_events BEGIN SELECT RAISE(ABORT,'immutable event'); END;
CREATE TRIGGER IF NOT EXISTS no_delete_booking_events BEFORE DELETE ON booking_events BEGIN SELECT RAISE(ABORT,'immutable event'); END;
CREATE TABLE IF NOT EXISTS issuers(id TEXT PRIMARY KEY,public_key TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS attestations(id TEXT PRIMARY KEY,body TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS invites(id TEXT PRIMARY KEY,expires INTEGER NOT NULL,used INTEGER NOT NULL DEFAULT 0);
CREATE TABLE IF NOT EXISTS members(id TEXT PRIMARY KEY);
`;

export class SovereignHub extends DurableObject {
 constructor(ctx,env){super(ctx,env);this.ctx=ctx;this.env=env;ctx.storage.sql.exec(SQL);}
 rows(sql,...args){return this.ctx.storage.sql.exec(sql,...args).toArray();}
 row(sql,...args){return this.rows(sql,...args)[0];}
 count(table){requireThat(['records','contexts','bookings','booking_events','audit','conflicts'].includes(table),'Unknown count');return this.row(`SELECT COUNT(*) AS n FROM ${table}`).n;}
 get(k,fallback=null){const row=this.row('SELECT v FROM meta WHERE k=?',k);return row?JSON.parse(row.v):fallback;}
 set(k,value){this.rows('INSERT INTO meta VALUES(?,?) ON CONFLICT(k) DO UPDATE SET v=excluded.v',k,canonical(value));}
 tx(fn){return this.ctx.storage.transactionSync(fn);}
 audit(p,action){this.rows('INSERT INTO audit(actor,action,at) VALUES(?,?,?)',p.agent,action,Date.now());}
 admin(p){requireThat(p.admin,'Owner required',403);}
 connector(p,name){resource(p,name);const c=this.row('SELECT * FROM connectors WHERE id=?',name);requireThat(c,'Connector unavailable',404);requireThat(c.status==='ready','Provider authorization required',409);return c;}
 issueToken(claims){return this.sign(claims);}
 async sign(claims){const body=b64(utf8(canonical(claims)));return body+'.'+await hmac(this.env.TOKEN_KEY,body);}
 async unpack(token){
  requireThat(typeof token==='string'&&token.length<=32768,'Invalid token',403);
  const parts=token.split('.');
  requireThat(parts.length===2&&/^[A-Za-z0-9_-]+$/.test(parts[0])&&/^[A-Za-z0-9_-]{43}$/.test(parts[1]),'Invalid token',403);
  const key=await crypto.subtle.importKey('raw',unb64(this.env.TOKEN_KEY),{name:'HMAC',hash:'SHA-256'},false,['verify']);
  requireThat(await crypto.subtle.verify('HMAC',key,unb64(parts[1]),utf8(parts[0])),'Invalid token',403);
  return strictJson(new TextDecoder().decode(unb64(parts[0])));
 }
 assertActive(p){
  if(p.admin){
   requireThat(this.row('SELECT 1 FROM devices WHERE public_key=?',p.public_key),'Device not paired',403);
   return;
  }
  const row=this.row(`SELECT tokens.expires FROM tokens JOIN agents ON tokens.agent=agents.id
   WHERE tokens.jti=? AND agents.id=? AND agents.public_key=? AND tokens.revoked=0 AND agents.revoked=0`,
   p.token_id,p.agent,p.public_key);
  requireThat(row&&row.expires>Date.now()/1000,'Revoked identity',403);
 }
 addDevice(key){
  requireThat(unb64(key).length===32,'Ed25519 key required');
  requireThat(!this.row('SELECT 1 FROM revoked_devices WHERE public_key=?',key),'Device key previously revoked',409);
  requireThat(!this.row('SELECT 1 FROM devices WHERE public_key=?',key),'Device already paired',409);
  this.rows('INSERT INTO devices VALUES(?,?)',key,Date.now());
 }
 retireDevice(key){
  requireThat(unb64(key).length===32,'Ed25519 key required');
  requireThat(this.row('SELECT 1 FROM devices WHERE public_key=?',key),'Device not paired',404);
  requireThat(this.row('SELECT COUNT(*) AS n FROM devices').n>1,'Keep at least one paired device',409);
  this.rows('INSERT INTO revoked_devices VALUES(?,?)',key,Date.now());
  this.rows('DELETE FROM devices WHERE public_key=?',key);
 }
 async auth(req,raw){const url=new URL(req.url),path=url.pathname+url.search,header=req.headers.get('Authorization')??'',time=Number(req.headers.get('X-Agent-Time')),nonce=req.headers.get('X-Agent-Nonce');integer(time,0);id(nonce);requireThat(Math.abs(Date.now()/1000-time)<=60,'Stale proof',403);let p,key,holder,message;if(header.startsWith('Owner ')){key=header.slice(6);requireThat(this.row('SELECT public_key FROM devices WHERE public_key=?',key),'Device not paired',403);holder='owner:'+await digest(key);p={owner:OWNER,agent:'owner',admin:true,scopes:SCOPES,resources:[],public_key:key};message=canonical(['owner',req.method,path,await digest(raw),time,nonce]);}else{requireThat(header.startsWith('Bearer '),'Signed authentication required',403);const token=header.slice(7),c=await this.unpack(token);requireThat(c.iss==='one-cloud-hub'&&c.aud==='one-hub-actions'&&c.owner===OWNER&&c.sub!=='owner'&&c.iat<=Date.now()/1000&&Date.now()/1000<c.exp,'Expired capability',403);const agent=this.row('SELECT * FROM agents WHERE id=?',c.sub),receipt=this.row('SELECT * FROM tokens WHERE jti=?',c.jti);requireThat(agent&&!agent.revoked&&receipt&&!receipt.revoked&&receipt.agent===c.sub,'Revoked identity',403);requireThat(Array.isArray(c.scopes)&&c.scopes.every(s=>JSON.parse(agent.scopes).includes(s))&&Array.isArray(c.resources)&&c.resources.every(r=>JSON.parse(agent.resources).includes(r)),'Grant changed',403);key=agent.public_key;requireThat(c.cnf===await digest(unb64(key)),'Key binding mismatch',403);holder=c.jti;p={owner:OWNER,agent:c.sub,admin:false,scopes:c.scopes,resources:c.resources,public_key:key,token_id:c.jti};message=canonical([await digest(token),req.method,path,await digest(raw),time,nonce]);}requireThat(await verifyEd(key,req.headers.get('X-Agent-Signature'),message),'Invalid request proof',403);this.tx(()=>{this.assertActive(p);this.rows('DELETE FROM nonces WHERE expires<?',Math.floor(Date.now()/1000));requireThat(!this.row('SELECT 1 FROM nonces WHERE holder=? AND nonce=?',holder,nonce),'Replayed request',403);this.rows('INSERT INTO nonces VALUES(?,?,?)',holder,nonce,Math.floor(Date.now()/1000)+120);});return p;}
 async pair(body){fields(body,['code','public_key','turnstile']);requireThat(typeof body.code==='string'&&body.code.length<=128&&await digest(body.code)===this.env.BOOTSTRAP_HASH,'Invalid setup code',403);requireThat(unb64(body.public_key).length===32,'Ed25519 key required');if(this.env.TURNSTILE_SECRET){requireThat(typeof body.turnstile==='string'&&body.turnstile.length<=4096,'Turnstile required',403);const r=await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify',{method:'POST',body:new URLSearchParams({secret:this.env.TURNSTILE_SECRET,response:body.turnstile})});const v=await r.json();requireThat(v.success&&v.hostname===this.env.APP_HOST,'Human challenge failed',403);}return this.tx(()=>{requireThat(!this.get('claimed',false),'Owner already paired',409);this.addDevice(body.public_key);this.set('claimed',true);this.audit({agent:'owner'},'owner.pair');return {paired:true,owner:OWNER};});}
 receipt(p,key,payload,action){
  id(key);
  const scoped=canonical([p.agent,key]),encoded=canonical(payload);
  return this.tx(()=>{
   const current=this.row('SELECT payload,result FROM receipts WHERE k=?',scoped);
   const old=current??this.row('SELECT payload,result FROM receipts WHERE k=?',p.agent+':'+key);
   if(old){
    requireThat(current||(!p.agent.includes(':')&&!key.includes(':')),'Legacy request key must be reconciled',409);
    requireThat(old.payload===encoded,'Idempotency conflict',409);
    return JSON.parse(old.result);
   }
   const result=action();
   this.rows('INSERT INTO receipts VALUES(?,?,?)',scoped,encoded,canonical(result));
   return result;
  });
 }
 signal(kind){this.rows('INSERT INTO outbox(id,kind,updated) VALUES(?,?,?)',crypto.randomUUID(),kind,Date.now());}
 async flush(){if(!this.env.JOBS)return {sent:0};const pending=this.rows("SELECT * FROM outbox WHERE (state='pending' OR (state='sent' AND updated<?)) AND attempts<5 ORDER BY updated LIMIT 5",Date.now()-3600000);let sent=0;for(const job of pending){try{await this.env.JOBS.send({id:job.id,kind:job.kind,instance:this.env.HUB_INSTANCE??'owner'});this.rows("UPDATE outbox SET state='sent',attempts=attempts+1,updated=? WHERE id=? AND state!='done'",Date.now(),job.id);sent++;}catch{this.rows('UPDATE outbox SET attempts=attempts+1,updated=? WHERE id=?',Date.now(),job.id);}}return {sent};}
 acknowledge(job){id(job.id);this.rows("UPDATE outbox SET state='done',updated=? WHERE id=?",Date.now(),job.id);return {acknowledged:true};}
 stats(){const values={records:this.count('records'),contexts:this.count('contexts'),bookings:this.count('bookings'),events:this.count('booking_events'),revision:this.count('audit')};return {...values,healthy:values.bookings===values.events};}
 async maintenance(force=false){const counts=this.stats();if(!counts.healthy){this.set('recovery',{state:'halted',reason:'authoritative_state_mismatch',at:Date.now()});return {healthy:false,reason:'authoritative_state_mismatch'};}const previous=this.get('recovery',{at:0,failures:0});if(!force&&previous.state==='halted')return {healthy:false,reason:'recovery_halted'};if(!force&&previous.failures>0&&Date.now()-previous.at<60000)return {healthy:false,reason:'recovery_cooldown'};try{if(this.env.DB){const at=new Date().toISOString();await this.env.DB.prepare('INSERT INTO hub_projection(id,counts,checked_at,healthy,revision) VALUES(?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET counts=excluded.counts,checked_at=excluded.checked_at,healthy=excluded.healthy,revision=excluded.revision WHERE excluded.revision>=hub_projection.revision').bind(this.ctx.id.toString(),canonical(counts),at,1,counts.revision).run();const projected=await this.env.DB.prepare('SELECT healthy,revision FROM hub_projection WHERE id=?').bind(this.ctx.id.toString()).first();requireThat(projected&&projected.healthy===1&&projected.revision>=counts.revision,'Projection verification failed',503);}this.set('recovery',{state:'healthy',at:Date.now(),failures:0});return {healthy:true,counts};}catch{const failures=(previous.failures??0)+1;this.set('recovery',{state:failures>=3?'halted':'degraded',reason:'projection_unavailable',failures,at:Date.now()});return {healthy:false,reason:'projection_unavailable'};}}
 async job(job){fields(job,['id','kind']);id(job.id);requireThat(['sync','context','booking','diagnostic'].includes(job.kind),'Unknown job');const pending=this.row('SELECT kind,state FROM outbox WHERE id=?',job.id);
  requireThat(pending&&pending.kind===job.kind,'Unknown outbox job',404);
  if(pending.state==='done')return {processed:true};
  const result=await this.maintenance();requireThat(result.healthy,'Projection not verified',503);if(this.env.DB)await this.env.DB.prepare('INSERT OR IGNORE INTO hub_jobs VALUES(?,?,?)').bind(job.id,job.kind,new Date().toISOString()).run();this.acknowledge(job);return {processed:true};}
 snapshot(p){need(p,'diagnostics:read');const connectors=this.rows('SELECT * FROM connectors ORDER BY id').filter(c=>p.admin||p.resources.includes(c.id)).map(c=>({id:c.id,status:c.status,config:{mode:c.mode}})),faults=this.rows('SELECT connector,body FROM faults ORDER BY connector,code').filter(r=>p.admin||p.resources.includes(r.connector)).map(r=>({connector:r.connector,...JSON.parse(r.body)})),conflicts=this.rows('SELECT connector FROM conflicts WHERE resolved=0').filter(r=>p.admin||p.resources.includes(r.connector)).length;return {owner:OWNER,connectors,faults,conflicts,integrity:{boundary_storage:this.stats().healthy,audit:true},anchors:{'1+1=2':1+1===2,'1-1=0':1-1===0,zero_distinct_from_one:0!==1},capabilities:CAPABILITIES,recovery:this.get('recovery',{state:'not_checked'}),jobs:this.rows('SELECT state,COUNT(*) AS count FROM outbox GROUP BY state')};}
 async personalCore(route,method,body,p){
  const registry=coreRegistry(BOT_ROLES);
  if(route==='/api/personal-core'&&method==='GET'){
   this.admin(p);
   return {profile:profile('zorro-cloud'),...registry,guards:this.get('personal-core:guards',defaultGuards())};
  }
  if(route==='/api/personal-core/control'&&method==='POST'){
   this.admin(p);fields(body,['role','paused']);
   return this.tx(()=>{
    const guards=guardUpdate(this.get('personal-core:guards',defaultGuards()),body.role,body.paused,registry.agents);
    this.set('personal-core:guards',guards);
    this.audit(p,'personal-core.control');
    return guards;
   });
  }
  requireThat(route==='/api/personal-core/run'&&method==='POST','Personal Core route unavailable',404);
  fields(body,['key','role','goal','identity']);
  id(body.key);
  const agent=registry.agents.find(role=>role.id===body.role);
  requireThat(agent,'Unknown agent role');
  requireThat(['assess','recover'].includes(body.goal),'Unknown agent goal');
  const guards=this.get('personal-core:guards',defaultGuards());
  allowAgent(guards,agent.id);
  const input={key:body.key,role:agent.id,goal:body.goal};
  const requestHash=await digest(canonical(input));
  let identity=null;
  if(!p.admin||body.identity!==null){
   need(p,CORE_ACTION);resource(p,agent.id);
   identity=await verifyPortableGrant(body.identity,{
    audience:'zorro-cloud:'+this.env.APP_HOST,role:agent.id,requestHash,subject:p.public_key,
    issuerTrusted:key=>!!this.row('SELECT public_key FROM devices WHERE public_key=?',key),
   });
  }
  const row=this.row('SELECT jobs.*,cycles.finished FROM bot_jobs jobs JOIN bot_cycles cycles ON jobs.cycle=cycles.id WHERE jobs.role=? AND cycles.finished IS NOT NULL ORDER BY cycles.finished DESC LIMIT 1',agent.operator);
  const consistent=!!(row?.hash&&row.result&&await digest(row.result)===row.hash);
  const observation=observationFromJob(row,agent.id,consistent);
  const plan=planRole(agent,body.goal,observation);
  return this.tx(()=>{
   const current=this.get('personal-core:guards',defaultGuards());
   allowAgent(current,agent.id);
   requireThat(guards.generation===current.generation,'Agent guard changed during run',409);
   this.assertActive(p);
   const saved=this.row('SELECT payload,result FROM receipts WHERE k=?','personal-core:'+input.key);
   const request=canonical({actor:p.agent,requestHash,identity});
   if(saved){
    requireThat(saved.payload===request,'Run key was already used',409);
    return JSON.parse(saved.result);
   }
   const receipt={...input,mode:'zorro-cloud',identity,observation,plan,at:Date.now(),guard_generation:current.generation};
   this.rows('INSERT INTO receipts VALUES(?,?,?)','personal-core:'+input.key,request,canonical(receipt));
   this.audit(p,'personal-core.run');
   return receipt;
  });
 }
 runMicroapp(p,spec){
  need(p,'microapps:run');
  requireThat(spec&&Object.getPrototypeOf(spec)===Object.prototype,'Tool specification required');
  if(spec.kind==='split-budget')need(p,'quant:run');
  if(spec.kind==='room-fit')need(p,'simulation:run');
  return microapp(spec);
 }
 mcp(p,body){
  requireThat(body?.jsonrpc==='2.0'&&['string','number'].includes(typeof body.id),'JSON-RPC request ID required');
  let result;
  const tools=[
   {name:'diagnostics.list',scope:'diagnostics:read',description:'Read authorized diagnostics',properties:{},required:[]},
   {name:'microapp.run',scope:'microapps:run',description:'Run an allowlisted deterministic calculation',properties:{spec:{type:'object'}},required:['spec']},
  ];
  if(body.method==='initialize'){
   result={protocolVersion:'2025-03-26',capabilities:{tools:{}},serverInfo:{name:'one-sovereign-hub',version:'1.0.0'}};
  }else if(body.method==='tools/list'){
   result={tools:tools.filter(tool=>p.admin||p.scopes.includes(tool.scope)).map(({name,description,properties,required})=>({
    name,description,inputSchema:{type:'object',properties,required,additionalProperties:false},
   }))};
  }else if(body.method==='tools/call'){
   fields(body.params,['name','arguments']);
   const tool=tools.find(item=>item.name===body.params.name);
   requireThat(tool,'Unknown tool');
   need(p,tool.scope);fields(body.params.arguments,tool.required);
   const answer=tool.name==='diagnostics.list'?this.snapshot(p):this.runMicroapp(p,body.params.arguments.spec);
   result={content:[{type:'text',text:canonical(answer)}],isError:false};
  }else throw new ContractError('Unsupported MCP method');
  return {jsonrpc:'2.0',id:body.id,result};
 }
 async handle(req,raw,body,p){const u=new URL(req.url),route=u.pathname,q=u.searchParams;requireThat([...new Set(q.keys())].every(k=>q.getAll(k).length===1),'Duplicate query');const post=req.method==='POST';if(route==='/api/personal-core'||route.startsWith('/api/personal-core/'))return this.personalCore(route,req.method,body,p);if(route==='/api/snapshot'&&!post)return {...this.snapshot(p),...(p.admin?{swarm:swarmStatus(this)}:{})};
 if(route==='/api/swarm'&&!post){this.admin(p);return swarmStatus(this);}
 if(route==='/api/swarm/run'&&post){this.admin(p);fields(body,['key']);return this.runSwarm(body.key,true);}
 if(route==='/api/swarm/control'&&post){this.admin(p);fields(body,['role','paused']);requireThat(body.role==='*'||BOT_ROLES.some(r=>r.id===body.role),'Unknown role');requireThat(typeof body.paused==='boolean','Explicit pause required');this.rows('INSERT INTO bot_controls VALUES(?,?) ON CONFLICT(id) DO UPDATE SET veto=excluded.veto',body.role,body.paused?1:0);this.audit(p,'swarm.control');return {role:body.role,paused:body.paused};}
 if(route==='/api/context/writer'&&post){
  this.admin(p);fields(body,['key','agent']);id(body.key);
  return this.tx(()=>{
   const current=this.row('SELECT readers FROM contexts WHERE k=?',body.key);
   requireThat(current,'Context unavailable',404);
   if(body.agent===null){
    this.rows('DELETE FROM context_writers WHERE k=?',body.key);
   }else{
    const agent=this.row('SELECT scopes FROM agents WHERE id=? AND revoked=0',id(body.agent));
    requireThat(agent&&JSON.parse(agent.scopes).includes('context:write')&&
     JSON.parse(current.readers).includes(body.agent),'Active writer with read grant required',403);
    this.rows('INSERT INTO context_writers VALUES(?,?) ON CONFLICT(k) DO UPDATE SET agent=excluded.agent',body.key,body.agent);
   }
   this.audit(p,'context.writer');
   return {key:body.key,writer:body.agent};
  });
 }
 if(route==='/api/context'){
  if(post){
   need(p,'context:write');fields(body,['key','value','expected','readers','ttl']);id(body.key);integer(body.expected,0);
   if(body.ttl!==null)integer(body.ttl,1,31536000);
   return this.tx(()=>{
    const old=this.row('SELECT * FROM contexts WHERE k=?',body.key);
    const writer=this.row('SELECT agent FROM context_writers WHERE k=?',body.key);
    if(!p.admin){
     requireThat(body.readers===null,'Only owner changes grants',403);
     if(old)requireThat(writer?.agent===p.agent&&JSON.parse(old.readers).includes(p.agent)&&
      (old.expires===null||Date.now()/1000<old.expires),'Context write not granted',403);
     else resource(p,body.key);
    }else requireThat(Array.isArray(body.readers),'Reader list required');
    requireThat((old?.version??0)===body.expected,'Version conflict',409);
    const readers=p.admin?body.readers.map(id):old?JSON.parse(old.readers):[p.agent];
    const version=integer(body.expected+1,1);
    this.rows('INSERT INTO contexts VALUES(?,?,?,?,?) ON CONFLICT(k) DO UPDATE SET body=excluded.body,version=excluded.version,readers=excluded.readers,expires=excluded.expires',
     body.key,canonical(body.value),version,canonical(readers),body.ttl===null?null:Math.floor(Date.now()/1000)+body.ttl);
    if(!p.admin&&!old)this.rows('INSERT INTO context_writers VALUES(?,?)',body.key,p.agent);
    if(p.admin&&writer&&!readers.includes(writer.agent))this.rows('DELETE FROM context_writers WHERE k=?',body.key);
    this.audit(p,'context.write');this.signal('context');
    return {key:body.key,version};
   });
  }
  need(p,'context:read');
  requireThat([...q.keys()].length===1&&q.has('key'),'Context key required');
  const row=this.row('SELECT * FROM contexts WHERE k=?',id(q.get('key')));
  requireThat(row&&(!row.expires||Date.now()/1000<row.expires),'Context unavailable',404);
  requireThat(p.admin||JSON.parse(row.readers).includes(p.agent),'Context not granted',403);
  return {key:row.k,value:JSON.parse(row.body),version:row.version,expires:row.expires};
 }
 if(route==='/api/connectors'&&post){this.admin(p);fields(body,['connector','mode']);id(body.connector);requireThat(['local','oauth','webhook','device','model','payment'].includes(body.mode),'Unknown mode');return this.tx(()=>{this.rows('INSERT INTO connectors VALUES(?,?,?) ON CONFLICT(id) DO UPDATE SET mode=excluded.mode,status=excluded.status',body.connector,body.mode,body.mode==='local'?'ready':'provider_required');this.audit(p,'connector.configure');return {id:body.connector,status:body.mode==='local'?'ready':'provider_required'};});}
 if(route==='/api/sync'&&post){need(p,'sync:write');fields(body,['connector','record','value','expected','key']);this.connector(p,body.connector);id(body.record);integer(body.expected,0);return this.receipt(p,body.key,body,()=>{const old=this.row('SELECT * FROM records WHERE connector=? AND id=?',body.connector,body.record);let result;if((old?.version??0)!==body.expected){this.rows('INSERT INTO conflicts(connector,record,local,remote) VALUES(?,?,?,?)',body.connector,body.record,canonical(body.value),old?.body??'null');result={status:'conflict',conflict:this.row('SELECT last_insert_rowid() AS id').id,version:old?.version??0};}else{const version=integer(body.expected+1,1);this.rows('INSERT INTO records VALUES(?,?,?,?) ON CONFLICT(connector,id) DO UPDATE SET body=excluded.body,version=excluded.version',body.connector,body.record,canonical(body.value),version);this.rows('INSERT INTO changes(connector,id,body,version) VALUES(?,?,?,?)',body.connector,body.record,canonical(body.value),version);result={status:'applied',version,cursor:this.row('SELECT last_insert_rowid() AS id').id};this.signal('sync');}this.audit(p,'sync.'+result.status);return result;});}
 if(route==='/api/changes'&&!post){need(p,'sync:read');requireThat([...q.keys()].every(k=>['connector','after','until','size'].includes(k)),'Unknown query');const c=id(q.get('connector'));this.connector(p,c);const after=integer(Number(q.get('after')??0),0),size=integer(Number(q.get('size')??50),1,100),until=integer(q.has('until')?Number(q.get('until')):this.row('SELECT COALESCE(MAX(seq),0) AS n FROM changes WHERE connector=?',c).n,after);const rows=this.rows('SELECT * FROM changes WHERE connector=? AND seq>? AND seq<=? ORDER BY seq LIMIT ?',c,after,until,size+1);return {items:rows.slice(0,size).map(r=>({cursor:r.seq,id:r.id,value:JSON.parse(r.body),version:r.version})),until,next:rows.length>size?rows[size-1].seq:null};}
 if(route==='/api/conflicts/resolve'&&post){this.admin(p);fields(body,['conflict','choice']);integer(body.conflict,1);requireThat(['local','remote'].includes(body.choice),'Owner choice required');return this.tx(()=>{const row=this.row('SELECT * FROM conflicts WHERE id=?',body.conflict);requireThat(row,'Conflict unavailable',404);if(row.resolved)return {resolved:true};if(body.choice==='local'){const old=this.row('SELECT version FROM records WHERE connector=? AND id=?',row.connector,row.record),version=integer((old?.version??0)+1,1);this.rows('INSERT INTO records VALUES(?,?,?,?) ON CONFLICT(connector,id) DO UPDATE SET body=excluded.body,version=excluded.version',row.connector,row.record,row.local,version);this.rows('INSERT INTO changes(connector,id,body,version) VALUES(?,?,?,?)',row.connector,row.record,row.local,version);this.signal('sync');}this.rows('UPDATE conflicts SET resolved=1 WHERE id=?',row.id);this.audit(p,'conflict.resolve');return {resolved:true};});}
 if(route==='/api/agents'&&post){this.admin(p);fields(body,['agent','public_key','scopes','resources']);id(body.agent);requireThat(body.agent!=='owner','Reserved owner identity',409);requireThat(unb64(body.public_key).length===32,'Ed25519 key required');requireThat(Array.isArray(body.scopes)&&body.scopes.every(s=>SCOPES.includes(s))&&Array.isArray(body.resources),'Invalid grants');body.resources.forEach(id);this.rows('INSERT INTO agents(id,public_key,scopes,resources) VALUES(?,?,?,?)',body.agent,body.public_key,canonical(body.scopes),canonical(body.resources));this.audit(p,'agent.register');return {agent:body.agent,scopes:body.scopes};}
 if(route==='/api/agents/revoke'&&post){
  this.admin(p);fields(body,['agent']);id(body.agent);
  return this.tx(()=>{
   const agent=this.row('SELECT revoked FROM agents WHERE id=?',body.agent);
   requireThat(agent,'Agent unavailable',404);
   if(!agent.revoked){
    this.rows('UPDATE agents SET revoked=1 WHERE id=?',body.agent);
    this.rows('UPDATE tokens SET revoked=1 WHERE agent=?',body.agent);
    this.rows('DELETE FROM context_writers WHERE agent=?',body.agent);
    this.audit(p,'agent.revoke');
   }
   return {revoked:true};
  });
 }
 if(route==='/api/tokens'&&post){this.admin(p);fields(body,['agent','scopes','ttl']);integer(body.ttl,1,3600);const a=this.row('SELECT * FROM agents WHERE id=?',id(body.agent));requireThat(a&&a.id!=='owner'&&!a.revoked&&Array.isArray(body.scopes)&&body.scopes.every(s=>JSON.parse(a.scopes).includes(s)),'Scope escalation',403);const now=Math.floor(Date.now()/1000),claims={iss:'one-cloud-hub',aud:'one-hub-actions',owner:OWNER,sub:a.id,scopes:body.scopes,resources:JSON.parse(a.resources),cnf:await digest(unb64(a.public_key)),iat:now,exp:now+body.ttl,jti:crypto.randomUUID()};const token=await this.sign(claims);return this.tx(()=>{this.assertActive(p);const current=this.row('SELECT * FROM agents WHERE id=?',a.id);requireThat(current&&!current.revoked&&current.public_key===a.public_key&&current.scopes===a.scopes&&current.resources===a.resources,'Agent grant changed',409);this.rows('INSERT INTO tokens(jti,agent,expires) VALUES(?,?,?)',claims.jti,a.id,claims.exp);this.audit(p,'token.issue');return {token,jti:claims.jti,expires:claims.exp};});}
 if(route==='/api/revoke'&&post){this.admin(p);fields(body,['jti']);this.rows('UPDATE tokens SET revoked=1 WHERE jti=?',id(body.jti));this.audit(p,'token.revoke');return {revoked:true};}
 if(route==='/api/devices'){
  this.admin(p);
  if(!post)return {devices:this.rows('SELECT public_key,created FROM devices ORDER BY created,public_key')};
  fields(body,['public_key']);
  return this.tx(()=>{this.addDevice(body.public_key);this.audit(p,'device.add');return {added:true};});
 }
 if(route==='/api/devices/revoke'&&post){
  this.admin(p);fields(body,['public_key']);
  return this.tx(()=>{this.retireDevice(body.public_key);this.audit(p,'device.revoke');return {revoked:true};});
 }
 if(route==='/api/devices/rotate'&&post){
  this.admin(p);fields(body,['public_key','proof']);
  requireThat(unb64(body.public_key).length===32,'Ed25519 key required');
  const message=canonical(['one-owner-device-rotate-v1',new URL(req.url).host,p.public_key,body.public_key]);
  requireThat(await verifyEd(body.public_key,body.proof,message),'Replacement device proof required',403);
  return this.tx(()=>{
   this.assertActive(p);
   this.addDevice(body.public_key);
   this.retireDevice(p.public_key);
   this.audit(p,'device.rotate');
   return {rotated:true};
  });
 }
 if(route==='/api/faults'&&post){need(p,'diagnostics:write');fields(body,['connector','code','severity','detail']);this.connector(p,body.connector);id(body.code);requireThat(['info','warning','critical'].includes(body.severity)&&typeof body.detail==='string'&&body.detail.length<=1000,'Invalid diagnostic');this.rows('INSERT INTO faults VALUES(?,?,?) ON CONFLICT(connector,code) DO UPDATE SET body=excluded.body',body.connector,body.code,canonical({...body,at:Date.now()}));this.audit(p,'diagnostic.report');this.signal('diagnostic');return {recorded:true};}
 if(route==='/api/commands'&&post){need(p,'commands:run');fields(body,['connector','action','key']);this.connector(p,body.connector);if(body.action==='verify-storage'){this.admin(p);id(body.key);return this.maintenance(true);}requireThat(body.action==='clear-warning-codes','Command not allowlisted');return this.receipt(p,body.key,body,()=>{const rows=this.rows('SELECT * FROM faults WHERE connector=?',body.connector),cleared=[];for(const row of rows)if(JSON.parse(row.body).severity!=='critical'){this.rows('DELETE FROM faults WHERE connector=? AND code=?',row.connector,row.code);cleared.push(row.code);}this.audit(p,'diagnostic.clear');return {cleared,critical_preserved:true};});}
 if(route==='/api/flows'){need(p,'commands:run');if(!post){const name=resource(p,id(q.get('id')));return this.row('SELECT * FROM flows WHERE id=?',name)??{id:name,state:'cart',version:0};}fields(body,['id','expected','target','key']);resource(p,body.id);integer(body.expected,0);return this.receipt(p,body.key,body,()=>{const old=this.row('SELECT * FROM flows WHERE id=?',body.id)??{state:'cart',version:0};requireThat(old.version===body.expected,'Flow version conflict',409);const next={cart:'shipping',shipping:'payment',payment:'complete'};requireThat(next[old.state]===body.target,'Undeclared state transition',409);const version=integer(old.version+1,1);this.rows('INSERT INTO flows VALUES(?,?,?) ON CONFLICT(id) DO UPDATE SET state=excluded.state,version=excluded.version',body.id,body.target,version);this.rows('INSERT INTO flow_events(flow,before_state,after_state) VALUES(?,?,?)',body.id,old.state,body.target);this.audit(p,'flow.transition');return {id:body.id,state:body.target,version};});}
 if(route==='/api/microapps'&&post)return this.runMicroapp(p,body);
 if(route==='/api/text/slice'&&post){need(p,'microapps:run');fields(body,['text','start','end']);return {text:graphemeSlice(body.text,body.start,body.end)};}
 if(route==='/api/edge-summary'&&post){need(p,'microapps:run');fields(body,['text','sentences']);integer(body.sentences,1,10);requireThat(typeof body.text==='string'&&body.text.length<=32768,'Text too large');return {summary:body.text.trim().split(/(?<=[.!?])\s+/).slice(0,body.sentences).join(' '),engine:'deterministic extraction; no model call'};}
 if(route==='/api/ai'&&post){this.admin(p);fields(body,['prompt']);requireThat(this.env.AI&&typeof body.prompt==='string'&&body.prompt.length<=2048,'Bounded AI prompt required');const day=new Date().toISOString().slice(0,10);this.tx(()=>{const budget=this.get('ai_budget',{day,count:0});const count=budget.day===day?budget.count:0;requireThat(count<5,'Daily AI allowance reached',429);this.set('ai_budget',{day,count:count+1});this.audit(p,'ai.invoke');});const result=await this.env.AI.run('@cf/meta/llama-3.2-3b-instruct',{messages:[{role:'system',content:'Answer briefly. Distinguish uncertainty from fact.'},{role:'user',content:body.prompt}],max_tokens:128});return {result,provider:'Cloudflare Workers AI',daily_limit:5};}
 if(route==='/api/ambient'&&post){need(p,'diagnostics:write');fields(body,['modality','consent','action']);requireThat(body.consent===true,'Explicit consent required',403);requireThat(['voice','gaze','gesture','touch','sensor'].includes(body.modality)&&['show-health','next-step','previous-step'].includes(body.action),'Unknown ambient input');return {accepted:true,action:body.action,hardware_connected:false};}
 if(route==='/api/booking-fences'&&post){need(p,'bookings:write');fields(body,['resource']);resource(p,body.resource);return this.tx(()=>{const old=this.row('SELECT token FROM fences WHERE resource=?',body.resource),token=integer((old?.token??0)+1,1);this.rows('INSERT INTO fences VALUES(?,?) ON CONFLICT(resource) DO UPDATE SET token=excluded.token',body.resource,token);return {token};});}
 if(route==='/api/bookings'&&post){need(p,'bookings:write');fields(body,['resource','key','range','token']);resource(p,body.resource);fields(body.range,['start','end']);isoDate(body.range.start);isoDate(body.range.end);integer(body.token,1);requireThat(body.range.start<body.range.end,'Nonempty booking required');return this.receipt(p,body.key,{resource:body.resource,range:body.range},()=>{requireThat(this.row('SELECT token FROM fences WHERE resource=?',body.resource)?.token===body.token,'Stale fencing token',409);requireThat(!this.row('SELECT 1 FROM bookings WHERE resource=? AND start<? AND ?<stop',body.resource,body.range.end,body.range.start),'Overlapping booking',409);this.rows('INSERT INTO bookings(resource,start,stop,token) VALUES(?,?,?,?)',body.resource,body.range.start,body.range.end,body.token);const n=this.row('SELECT last_insert_rowid() AS id').id;this.rows('INSERT INTO booking_events VALUES(?)',n);this.audit(p,'booking.commit');this.signal('booking');return {id:n,resource:body.resource,start:body.range.start,end:body.range.end};});}
 if(route==='/api/bookings'&&!post){need(p,'bookings:read');const name=resource(p,q.get('resource'));requireThat([...q.keys()].every(k=>['resource','after','until','size'].includes(k)),'Unknown query');const after=integer(Number(q.get('after')??0),0),size=integer(Number(q.get('size')??20),1,100),until=integer(q.has('until')?Number(q.get('until')):this.row('SELECT COALESCE(MAX(id),0) AS n FROM bookings WHERE resource=?',name).n,after),rows=this.rows('SELECT * FROM bookings WHERE resource=? AND id>? AND id<=? ORDER BY id LIMIT ?',name,after,until,size+1);return {items:rows.slice(0,size).map(r=>({id:r.id,resource:r.resource,start:r.start,end:r.stop})),until,next:rows.length>size?rows[size-1].id:null};}
 if(route==='/api/issuers'&&post){this.admin(p);fields(body,['issuer','key']);requireThat(unb64(body.key).length===32,'Ed25519 key required');this.rows('INSERT INTO issuers VALUES(?,?)',id(body.issuer),body.key);this.audit(p,'issuer.register');return {issuer:body.issuer};}
 if(route==='/api/attestations'&&post){need(p,'attest:verify');fields(body,['claims','signature']);const c=fields(body.claims,['id','issuer','subject','kind','artifact_sha256','expires']);id(c.id);id(c.subject);integer(c.expires,Math.floor(Date.now()/1000)+1,Math.floor(Date.now()/1000)+86400);requireThat(['issuer-verified-person','capture-provenance'].includes(c.kind)&&/^[a-f0-9]{64}$/.test(c.artifact_sha256),'Invalid claim');const issuer=this.row('SELECT * FROM issuers WHERE id=?',id(c.issuer));requireThat(issuer&&await verifyEd(issuer.public_key,body.signature,canonical(c)),'Untrusted or invalid issuer claim',403);this.rows('INSERT INTO attestations VALUES(?,?)',c.id,canonical(c));this.audit(p,'attestation.verify');return {signature_verified:true,issuer:c.issuer,meaning:'Issuer claim; hardware and human assurance depend on issuer'};}
 if(route==='/api/invites'&&post){this.admin(p);fields(body,['ttl']);integer(body.ttl,1,86400);const c={kind:'invite',id:crypto.randomUUID(),exp:Math.floor(Date.now()/1000)+body.ttl};this.rows('INSERT INTO invites(id,expires) VALUES(?,?)',c.id,c.exp);return {invite:await this.sign(c)};}
 if(route==='/api/redeem'&&post){this.admin(p);fields(body,['invite','member']);id(body.member);const c=await this.unpack(body.invite);requireThat(c.kind==='invite'&&c.exp>Date.now()/1000,'Expired invite',403);return this.tx(()=>{const invite=this.row('SELECT * FROM invites WHERE id=?',c.id);requireThat(invite&&!invite.used,'Used invite',409);this.rows('INSERT INTO members VALUES(?)',body.member);this.rows('UPDATE invites SET used=1 WHERE id=?',c.id);this.audit(p,'invite.redeem');return {member:body.member};});}
 if(route==='/api/export'&&!post){this.admin(p);return {schema:'one.cloudflare-export.v1',owner:OWNER,at:new Date().toISOString(),tables:Object.fromEntries(['contexts','connectors','records','changes','conflicts','faults','audit','bookings','booking_events','flows','flow_events'].map(t=>[t,{rows:this.rows('SELECT * FROM '+t+' LIMIT 10000'),total:this.row('SELECT COUNT(*) AS n FROM '+t).n,truncated:this.row('SELECT COUNT(*) AS n FROM '+t).n>10000}]))};}
 if(route==='/api/telemetry'&&!post){const s=this.snapshot(p);return {resourceMetrics:[{resource:{attributes:[{key:'service.name',value:{stringValue:'one-sovereign-hub'}}]},scopeMetrics:[{scope:{name:'one.sovereign'},metrics:[{name:'one.hub.conflicts',gauge:{dataPoints:[{asInt:String(s.conflicts),timeUnixNano:String(BigInt(Date.now())*1000000n)}]}}]}]}]};}
 if(route==='/api/recovery'&&!post){this.admin(p);requireThat(this.env.RECOVERY,'Workflow unavailable',503);const instance=await this.env.RECOVERY.get(id(q.get('id')));return instance.status();}
 if(route==='/api/recovery'&&post){this.admin(p);fields(body,['key']);id(body.key);const day=new Date().toISOString().slice(0,10),limit=this.get('workflow_budget',{day,count:0}),count=limit.day===day?limit.count:0;requireThat(count<4,'Daily recovery workflow allowance reached',429);requireThat(this.env.RECOVERY,'Workflow unavailable',503);this.set('workflow_budget',{day,count:count+1});const instance=await this.env.RECOVERY.create({id:body.key,params:{reason:'owner-request'}});return {id:instance.id,started:true};}
 if(route==='/api/audit-health'&&!post){this.admin(p);return {valid:this.stats().healthy,records:this.count('audit')};}
 if(route==='/mcp'&&post)return this.mcp(p,body);
 throw new ContractError('Route unavailable or provider unconfigured',404);
 }
 async runSwarm(cycle,manual=false){return runSwarm(this,cycle,manual);}
 async fetch(req){try{const raw=req.method==='POST'?await readBody(req):'',body=raw?strictJson(raw):{};if(new URL(req.url).pathname==='/auth/pair'&&req.method==='POST')return json(await this.pair(body));const p=await this.auth(req,raw);this.assertActive(p);requireThat(['GET','POST'].includes(req.method),'Unsupported method',405);const result=await this.handle(req,raw,body,p);if(req.method==='POST'&&!new URL(req.url).pathname.startsWith('/api/personal-core'))this.ctx.waitUntil(this.flush());return json(result);}catch(e){if(e instanceof ContractError)return json({error:e.message},e.status);console.error('hub_request_failed');return json({error:'Storage or provider operation failed'},503);}}
}

async function readBody(req){
 requireThat(req.headers.get('Content-Type')?.split(';')[0].trim().toLowerCase()==='application/json','JSON required',415);
 const reader=req.body?.getReader();requireThat(reader,'Body required');
 const decoder=new TextDecoder('utf-8',{fatal:true});
 let bytes=0,raw='';
 try{
  while(true){
   const {value,done}=await reader.read();
   if(done)break;
   bytes+=value.byteLength;
   requireThat(bytes<=32768,'Body exceeds 32 KiB',413);
   raw+=decoder.decode(value,{stream:true});
  }
  return raw+decoder.decode();
 }catch(error){
  await reader.cancel().catch(()=>{});
  if(error instanceof ContractError)throw error;
  throw new ContractError('UTF-8 body could not be read');
 }finally{
  reader.releaseLock();
 }
}
function hub(env){return env.HUB.get(env.HUB.idFromName(env.HUB_INSTANCE??'owner'));}
export class RecoveryWorkflow extends WorkflowEntrypoint {async run(event,step){const payload=typeof event.payload==='string'?JSON.parse(event.payload):event.payload;if(payload?.task==='swarm')return step.do('run bounded bee and ant cycle',{retries:{limit:1,delay:'1 minute'}},()=>hub(this.env).runSwarm(event.instanceId,true));const checked=await step.do('verify and repair derived projection',{retries:{limit:2,delay:'10 seconds',backoff:'exponential'}},async()=>{const result=await hub(this.env).maintenance(payload?.reason==='owner-request');if(!result.healthy)throw new Error('Projection verification failed');return result;});await step.do('drain durable outbox',async()=>hub(this.env).flush());return {healthy:checked.healthy};}}
export default {
 async fetch(req,env){try{const url=new URL(req.url);requireThat((req.method==='GET'&&['/one-core.mjs','/one-sdk.mjs','/one-healing.mjs'].includes(url.pathname))||!req.headers.get('Origin')||req.headers.get('Origin')===url.origin,'Cross-origin request denied',403);if(url.pathname==='/health')return json({service:'one-sovereign-hub',version:'1.0.0',bindings:{d1:!!env.DB,durable_objects:!!env.HUB,kv:!!env.PUBLIC_KV,queue:!!env.JOBS,workflow:!!env.RECOVERY,ai:!!env.AI,turnstile:!!env.TURNSTILE_SECRET},recovery:{fleet_contracts:fleetContractCount,fleet_targets:fleetRegistryCount,catalog_checkpoint:true},r2:false,personal_core:{version:1,agents:BOT_ROLES.length,modes:['zero-cloud','zorro-cloud']}});if(url.pathname==='/api/config')return json({sitekey:env.TURNSTILE_SITEKEY??null,owner_auth:'Ed25519 device proof',setup:'One-time setup code required'});if(url.pathname==='/api/catalog'||url.pathname==='/.well-known/one-actions.json')return json({name:'ONE Sovereign Hub',capabilities:CAPABILITIES,openapi:'/openapi.json',mcp:'/mcp'});if(url.pathname.startsWith('/api/')||url.pathname.startsWith('/auth/')||url.pathname==='/mcp'){requireThat(url.pathname==='/auth/pair'||/^(Owner|Bearer) /.test(req.headers.get('Authorization')??''),'Signed authentication required',403);return hub(env).fetch(req);}if(env.ASSETS)return env.ASSETS.fetch(req);requireThat(['GET','HEAD'].includes(req.method),'Read-only asset route',405);const asset=await env.PUBLIC_KV?.get('asset:'+(url.pathname==='/'?'/index.html':url.pathname),{type:'json',cacheTtl:300});if(!asset)return json({error:'Static asset unavailable'},404);return new Response(req.method==='HEAD'?null:asset.content,{headers:{'Content-Type':asset.mime+'; charset=utf-8',...(url.pathname.endsWith('.mjs')?{'Access-Control-Allow-Origin':'*'}:{}),'Cache-Control':'public, max-age=300','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','X-Frame-Options':'DENY','Permissions-Policy':'camera=(), microphone=(), geolocation=()','Content-Security-Policy':"default-src 'self'; script-src 'self' https://challenges.cloudflare.com; style-src 'self'; img-src 'self'; connect-src 'self' https://challenges.cloudflare.com; frame-src https://challenges.cloudflare.com; frame-ancestors 'none'; object-src 'none'; base-uri 'none'"}});}catch(e){return json({error:e instanceof ContractError?e.message:'Service unavailable'},e instanceof ContractError?e.status:503);}},
 async queue(batch,env){for(const message of batch.messages){try{const {instance,...job}=message.body;requireThat(['owner','deployment-verification'].includes(instance),'Unknown queue namespace');await env.HUB.get(env.HUB.idFromName(instance)).job(job);message.ack();}catch{message.retry({delaySeconds:30});}}},
 async scheduled(event,env,ctx){ctx.waitUntil((async()=>{if(event.cron==='*/15 * * * *'){await hub(env).runSwarm('scheduled-'+Math.floor(event.scheduledTime/900000));return;}await hub(env).maintenance();await hub(env).flush();if(env.PUBLIC_KV)await env.PUBLIC_KV.put('capabilities-v1',canonical(CAPABILITIES),{expirationTtl:86400});})());}
};
