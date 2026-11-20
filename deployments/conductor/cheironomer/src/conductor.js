import {HOLD_CAPACITY,normalize,verifyPhysicalRoute} from "./zone_dispatcher.js";
import {readOwnedGraph} from "./nathan_reader_bots.js";

const stateKey = "cheironomer";
const zeroHash = "0".repeat(64);
const bytes = new TextEncoder();
const shared = {"cache-control":"no-store","x-content-type-options":"nosniff"};
export const json = (body,status=200) => Response.json(body,{status,headers:shared});
export async function sha(text) {
  const hash=await crypto.subtle.digest("SHA-256",bytes.encode(text));
  return [...new Uint8Array(hash)].map(b=>b.toString(16).padStart(2,"0")).join("");
}

export function prepareStorage(instance) {
  if(instance.cheirSql)return instance.cheirSql;
  const sql=instance.ctx.storage.sql;
  sql.exec(`
    CREATE TABLE IF NOT EXISTS cheir_control (id INTEGER PRIMARY KEY CHECK (id=1),paused INTEGER NOT NULL,generation INTEGER NOT NULL,started INTEGER NOT NULL,last_tick INTEGER NOT NULL,last_audit INTEGER NOT NULL,audit TEXT NOT NULL);
    INSERT OR IGNORE INTO cheir_control VALUES(1,1,0,0,0,0,'pending');
    CREATE TABLE IF NOT EXISTS sibling_hold (id TEXT PRIMARY KEY,proposer TEXT NOT NULL,approver TEXT,command TEXT NOT NULL,proof TEXT NOT NULL,generation INTEGER NOT NULL,expires INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS cheir_outbox (sequence INTEGER PRIMARY KEY AUTOINCREMENT,id TEXT NOT NULL UNIQUE,kind TEXT NOT NULL,payload TEXT NOT NULL,generation INTEGER NOT NULL,sealed INTEGER NOT NULL DEFAULT 0,alien TEXT,neila TEXT,prepared TEXT);
    CREATE INDEX IF NOT EXISTS idx_cheir_outbox ON cheir_outbox(sealed,sequence);
  `);
  instance.cheirSql=sql;
  return sql;
}

export function current(sql) { return sql.exec("SELECT * FROM cheir_control WHERE id=1").one(); }

export async function wake(instance) {
  const sql=prepareStorage(instance);
  if (current(sql).started===0) {
    sql.exec("UPDATE cheir_control SET started=1 WHERE id=1");
    await instance.ctx.storage.put("cheironomer-clock",true);
    await instance.ctx.storage.setAlarm(Date.now()+100);
  }
  if (await instance.ctx.storage.getAlarm()===null) await instance.ctx.storage.setAlarm(Date.now()+100);
  return {clock:"TIME",holdCapacity:HOLD_CAPACITY};
}

export async function status(instance) {
  const sql=prepareStorage(instance);
  const state=current(sql);
  const waiting=sql.exec("SELECT COUNT(*) AS n FROM cheir_outbox WHERE sealed=0").one().n;
  return {service:"Nathan AI Cheironomer",holdCapacity:HOLD_CAPACITY,paused:!!state.paused,
    lastTick:state.last_tick||null,next:await instance.ctx.storage.getAlarm(),audit:state.audit,
    waiting,measure:state.last_tick ? Math.floor(state.last_tick/10000)%72+1 : null,cadence:"6/8"};
}

function append(sql,id,kind,payload,generation) {
  sql.exec("INSERT OR IGNORE INTO cheir_outbox(id,kind,payload,generation) VALUES(?,?,?,?)",id,kind,JSON.stringify(payload),generation);
}

export function proposal(instance, id) {
  const sql=prepareStorage(instance);
  const row=sql.exec("SELECT id,command,proof,approver,expires FROM sibling_hold WHERE id=?",id).toArray()[0];
  if(!row||row.expires<Date.now())return null;
  return {id:row.id,canonical:row.command,proof:row.proof,approved:!!row.approver,expires:row.expires};
}

export async function command(instance, principal, operation, body) {
  const sql=prepareStorage(instance);
  const state=current(sql);
  if (operation==="kill") {
    instance.ctx.storage.transactionSync(()=>{
      sql.exec("UPDATE cheir_control SET paused=1,generation=generation+1 WHERE id=1");
      append(sql,crypto.randomUUID(),"kill",{action:"kill"},state.generation+1);
    });
    await instance.env.ZONE_KV.put("KILL_SWITCH_ACTIVE","1").catch(()=>undefined);
    return {status:"BRAKE",generation:state.generation+1};
  }
  if (operation==="propose" || operation==="voice") {
    const input=operation==="voice"?body:normalize(body);
    if (state.paused && input.action!=="arm") return {error:"BRAKE"};
    if (input.action==="register-dns") {
      const source=instance.env.LEDGER;
      const claims=await Promise.all(input.domains.map(({domain,zoneId})=>source.prepare(
        "SELECT zone_id FROM dns_provision_receipts WHERE domain=? AND zone_id=? AND gate_mode='HOLDING'"
      ).bind(domain,zoneId).first()));
      if(claims.some(claim=>!claim))return {error:"dns_provision_receipt_required"};
    }
    if (input.action==="promote" && !(await verifyPhysicalRoute(instance.env,input.domain)).verified) return {error:"physical_route_unverified"};
    const payload=JSON.stringify(input);
    const proof=await sha(payload);
    const id=crypto.randomUUID(),expires=Date.now()+600000;
    if (current(sql).generation!==state.generation) return {error:"state_changed"};
    sql.exec("DELETE FROM sibling_hold WHERE expires<?",Date.now());
    if (sql.exec("SELECT COUNT(*) AS n FROM sibling_hold WHERE approver IS NULL").one().n>=20) return {error:"proposal_queue_full"};
    sql.exec("INSERT INTO sibling_hold(id,proposer,command,proof,generation,expires) VALUES(?,?,?,?,?,?)",id,principal,payload,proof,state.generation,expires);
    return {status:"ALIEN",id,proof,expires,action:input.action};
  }
  if (operation!=="approve" || !body || typeof body.id!=="string" || typeof body.proof!=="string") return {error:"invalid_command"};
  const approval=instance.ctx.storage.transactionSync(()=>{
    const row=sql.exec("SELECT * FROM sibling_hold WHERE id=?",body.id).toArray()[0];
    if (!row || row.approver || row.expires<Date.now() || row.proof!==body.proof || row.generation!==state.generation) return {error:"proof_invalid_or_expired"};
    if (row.proposer===principal) return {error:"independent_admin_required"};
    const parsed=JSON.parse(row.command);
    if (state.paused && parsed.action!=="arm") return {error:"BRAKE"};
    sql.exec("UPDATE sibling_hold SET approver=? WHERE id=?",principal,row.id);
    if (parsed.action==="arm") sql.exec("UPDATE cheir_control SET paused=0 WHERE id=1");
    append(sql,row.id,parsed.action,{...parsed,proof:row.proof},state.generation);
    return {status:"NEILA",id:row.id,proof:row.proof,action:parsed.action};
  });
  if (approval.action==="arm") await instance.env.ZONE_KV.put("KILL_SWITCH_ACTIVE","0").catch(()=>undefined);
  return approval;
}

function projection(env,row,payload) {
  const db=env.LEDGER;
  const timestamp=sealTime(row.id);
  switch (row.kind) {
    case "stage":
      return [db.prepare("INSERT OR IGNORE INTO virtual_zones(identity_id,reader_role,manifest_json,manifest_hash,updated_at) VALUES(?,?,?,?,?)")
        .bind(payload.manifest.zoneId,payload.role,JSON.stringify(payload.manifest),payload.proof,timestamp)];
    case "register-dns":
      return payload.domains.map(({domain,zoneId},i)=>db.prepare("INSERT OR IGNORE INTO dns_zone_fleet VALUES(?,?,?,?,?,?)")
        .bind(domain,row.id,i+1,zoneId,"HOLDING",timestamp));
    case "holding":
      return [db.prepare("UPDATE dns_zone_fleet SET state='HOLDING',updated_at=? WHERE domain=?").bind(timestamp,payload.domain)];
    case "promote":
      return [
        db.prepare("UPDATE dns_zone_fleet SET state='LIVE',updated_at=? WHERE domain=? AND EXISTS(SELECT 1 FROM virtual_zones WHERE identity_id=?)")
          .bind(timestamp,payload.domain,payload.identity),
        db.prepare("UPDATE virtual_zones SET zone_state='LAUNCHED',deployment_ref=?,bound_route=?,updated_at=? WHERE identity_id=? AND EXISTS(SELECT 1 FROM dns_zone_fleet WHERE domain=? AND state='LIVE')")
          .bind(env.RELEASE_SHA??"local","https://"+payload.domain,timestamp,payload.identity,payload.domain)
      ];
    case "voice":
      return [db.prepare("INSERT OR IGNORE INTO voice_vault VALUES(?,?,?,?,?)")
        .bind(row.id,payload.transcript,JSON.stringify({cleaned:payload.cleaned,entities:payload.entities}),payload.proof,timestamp)];
    case "extract":
      return [db.prepare("INSERT OR IGNORE INTO extraction_log VALUES(?,?,?,?)")
        .bind(row.id,payload.tile,JSON.stringify(payload.payload),timestamp)];
    default:
      return [];
  }
}

function sealTime(id) {
  return new Date(id.startsWith("time:")?Number(id.slice(5)):Date.now()).toISOString();
}

async function flush(instance,sql) {
  const {env}=instance;
  const row=sql.exec("SELECT * FROM cheir_outbox WHERE sealed=0 ORDER BY sequence LIMIT 1").toArray()[0];
  if (!row) return;
  const state=current(sql);
  const blocked=!["time","kill","arm"].includes(row.kind) && (state.paused||state.generation!==row.generation);
  const decision=row.prepared??(blocked?"cancelled":"commit");
  if (!row.prepared) sql.exec("UPDATE cheir_outbox SET prepared=? WHERE id=?",decision,row.id);
  const cancelled=decision==="cancelled";
  const item=cancelled?{cancelled:row.kind}:JSON.parse(row.payload);
  if (!cancelled && row.kind==="promote" && !(await verifyPhysicalRoute(env,item.domain)).verified) throw Error("physical_route_unverified");
  const prev=sql.exec("SELECT alien FROM cheir_outbox WHERE sealed=1 AND sequence<? ORDER BY sequence DESC LIMIT 1",row.sequence).toArray()[0]?.alien??zeroHash;
  const digest=await sha(JSON.stringify(item));
  const [alien,neila]=await Promise.all([sha(prev+"|"+digest+"|"+row.id),sha(row.id+"|"+digest+"|"+prev)]);
  const seal={eventId:row.id,type:cancelled?"cancelled":row.kind,prior:prev,alien,neila,digest};
  const stored=await env.AUDIT.put("cheironomer/seals/"+row.id+".json",JSON.stringify(seal),{onlyIf:{etagDoesNotMatch:"*"},httpMetadata:{contentType:"application/json"}});
  if (!stored) {
    const old=await env.AUDIT.get("cheironomer/seals/"+row.id+".json");
    if (!old||JSON.stringify(await old.json())!==JSON.stringify(seal)) throw Error("existing_seal_differs");
  }
  const exists=await env.LEDGER.prepare("SELECT alien_hash FROM provenance_ledger WHERE event_id=?").bind(row.id).first();
  if (exists && exists.alien_hash!==alien) throw Error("ledger_seal_differs");
  if (!exists) {
    await env.LEDGER.batch([
      ...(!cancelled?projection(env,row,item):[]),
      env.LEDGER.prepare("INSERT INTO provenance_ledger VALUES(?,?,?,?,?,?,?)")
        .bind(row.id,seal.type,prev,alien,neila,digest,sealTime(row.id))
    ]);
  }
  if (!cancelled && ["register-dns","holding","promote"].includes(row.kind)) {
    const domains=row.kind==="register-dns"?item.domains.map(entry=>entry.domain):[item.domain];
    for (const domain of domains) {
      const desired=await env.LEDGER.prepare("SELECT state FROM dns_zone_fleet WHERE domain=?").bind(domain).first();
      if (!desired) continue;
      await env.ZONE_KV.put("ZONE_STATUS:"+domain,desired.state);
      await env.LEDGER.prepare("UPDATE dns_provision_receipts SET gate_mode=? WHERE domain=?").bind(desired.state,domain).run();
    }
  }
  if (!cancelled && row.kind==="dispatch") {
    const staged=await env.LEDGER.prepare("SELECT identity_id FROM virtual_zones WHERE identity_id=?").bind(item.identity).first();
    if (staged && !current(sql).paused) await env.EMIT_BUS.send({event:"CHEIRONOMER_READER",id:row.id,source:item.source});
  }
  if (row.kind==="time" && row.id=== "time:"+String(Math.floor(Number(row.id.slice(5))/300000)*300000)) {
    await env.EMIT_BUS.send({event:"CHEIRONOMER_TIME",id:row.id});
  }
  sql.exec("UPDATE cheir_outbox SET sealed=1,alien=?,neila=?,payload=? WHERE id=?",alien,neila,"{}",row.id);
}

async function checkLedger(instance,sql) {
  const last=sql.exec("SELECT id,alien,neila FROM cheir_outbox WHERE sealed=1 ORDER BY sequence DESC LIMIT 1").toArray()[0];
  if (!last) return "waiting";
  const [row,object]=await Promise.all([
    instance.env.LEDGER.prepare("SELECT prior_hash,alien_hash,neila_hash,payload_hash FROM provenance_ledger WHERE event_id=?").bind(last.id).first(),
    instance.env.AUDIT.get("cheironomer/seals/"+last.id+".json")
  ]);
  if (!row||!object) return "seal_missing";
  const seal=await object.json();
  const [a,n]=await Promise.all([sha(row.prior_hash+"|"+row.payload_hash+"|"+last.id),sha(last.id+"|"+row.payload_hash+"|"+row.prior_hash)]);
  return a===row.alien_hash&&a===last.alien&&a===seal.alien&&n===row.neila_hash&&n===last.neila&&n===seal.neila?"verified":"integrity_mismatch";
}

export async function heartbeat(instance) {
  const sql=prepareStorage(instance);
  const now=Date.now();
  await instance.ctx.storage.setAlarm((Math.floor(now/10000)+1)*10000);
  const {generation,last_audit}=current(sql);
  sql.exec("UPDATE cheir_control SET last_tick=? WHERE id=1",now);
  try {
    if (now-last_audit>=60000) {
      sql.exec("DELETE FROM sibling_hold WHERE expires<?",now);
      const receipt=await checkLedger(instance,sql);
      sql.exec("UPDATE cheir_control SET last_audit=?,audit=? WHERE id=1",now,receipt);
      if (!["verified","waiting"].includes(receipt)) {
        sql.exec("UPDATE cheir_control SET paused=1,generation=generation+1 WHERE id=1 AND paused=0");
        await instance.env.ZONE_KV.put("KILL_SWITCH_ACTIVE","1");
      }
      const segment=Math.floor(now/60000)*60000;
      append(sql,"time:"+segment,"time",{at:segment,cadence:"6/8",receipt},generation);
    }
    await flush(instance,sql);
    const event=JSON.stringify({source:"TIME",lastTick:now,paused:!!current(sql).paused});
    for (const socket of instance.ctx.getWebSockets()) {try{socket.send(event);}catch{socket.close(1011,"disconnected");}}
  } catch (error) {
    console.error(JSON.stringify({service:"cheironomer",phase:"heartbeat",reason:error.message?.slice(0,120)}));
  }
}

export async function consume(batch,env) {
  for (const entry of batch.messages) {
    const {id,event,source}=entry.body??{};
    if (typeof id!=="string" || !["CHEIRONOMER_READER","CHEIRONOMER_TIME"].includes(event)) {entry.ack();continue;}
    try {
      if (event==="CHEIRONOMER_READER") {
        const brake=await env.TIME.getByName(stateKey).cheirStatus();
        if (brake.paused) {entry.retry({delaySeconds:60});continue;}
        const page=await readOwnedGraph(env,source);
        const at=new Date().toISOString();
        if (page.rows.length) await env.LEDGER.batch(page.rows.map(row=>env.LEDGER.prepare(
          "INSERT INTO recursive_nodes VALUES(?,?,?,?,?) ON CONFLICT(node_id) DO UPDATE SET status=excluded.status,is_terminal_root=excluded.is_terminal_root,observed_at=excluded.observed_at")
          .bind(row.nodeId,row.kind,row.status,Number(row.isTerminalRoot),at)));
      }
      await env.LEDGER.prepare("INSERT OR IGNORE INTO extraction_log VALUES(?,?,?,?)")
        .bind("queue:"+id,"emit",JSON.stringify({event}),new Date().toISOString()).run();
      entry.ack();
    } catch {entry.retry();}
  }
}
