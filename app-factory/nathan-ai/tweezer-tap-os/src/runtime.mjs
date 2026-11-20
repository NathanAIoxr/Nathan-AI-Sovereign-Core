import { ZONE, CONTROL_ACTIONS, alien, canonical, digest, initial, isWarrant, neila, rehearsal, reverseScore } from "./model.mjs";

const tickInterval = 60_000;
const alarmInterval = 10_000;
const stagingHost = "tweezer-tap-os.test";
const displayHeaders = {
  "cache-control": "no-store", "x-content-type-options": "nosniff",
  "x-robots-tag": "noindex, nofollow",
  "content-security-policy": "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; connect-src 'self'; form-action 'none'; frame-ancestors 'none'; base-uri 'none'"
};
const reply = (body,status=200) => Response.json(body,{status,headers:displayHeaders});
const select = (db,sql,...values) => db.prepare(sql).bind(...values).first();
const execute = (db,sql,...values) => db.prepare(sql).bind(...values).run();
const stableId = /^[A-Za-z0-9_-]{8,100}$/;

async function operator(request, env) {
  const presented = request.headers.get("authorization")?.match(/^Bearer ([A-Za-z0-9_-]{32,160})$/)?.[1];
  if (!presented) return null;
  const match = async (key) => {
    if (!key) return false;
    const [a,b] = await Promise.all([digest(presented),digest(key)]);
    let different = 0;
    for (let i=0;i<a.length;i++) different |= a.charCodeAt(i)^b.charCodeAt(i);
    return different === 0;
  };
  const [a,b,sensor] = await Promise.all([
    match(env.OPERATOR_A_KEY),match(env.OPERATOR_B_KEY),match(env.SENSOR_KEY)
  ]);
  if (Number(a)+Number(b)+Number(sensor)!==1) return null;
  return a ? "operator-a" : b ? "operator-b" : "sensor";
}

async function readJSON(request) {
  const input = request.body?.getReader();
  if (!input || !request.headers.get("content-type")?.startsWith("application/json")) throw Error("JSON required");
  let size = 0;
  let raw = "";
  const decoder = new TextDecoder("utf-8",{fatal:true});
  for (;;) {
    const {done,value} = await input.read();
    if (done) break;
    size += value.length;
    if (size > 4096) {
      await input.cancel();
      throw Error("request too large");
    }
    raw += decoder.decode(value,{stream:true});
  }
  return JSON.parse(raw + decoder.decode());
}

export class MasterConductor {
  constructor(state,env) {
    this.state = state;
    this.env = env;
    this.sql = state.storage.sql;
    this.sql.exec("CREATE TABLE IF NOT EXISTS control (id INTEGER PRIMARY KEY CHECK (id=1), body TEXT NOT NULL, last_tick INTEGER NOT NULL, fault INTEGER NOT NULL)");
    this.sql.exec("INSERT OR IGNORE INTO control VALUES (1, ?, -1, 0)",canonical(initial()));
    this.sql.exec("CREATE TABLE IF NOT EXISTS pending_events (seq INTEGER PRIMARY KEY AUTOINCREMENT, event_id TEXT NOT NULL UNIQUE, payload TEXT NOT NULL, sent INTEGER NOT NULL DEFAULT 0)");
  }

  async warrant(now) {
    const [row,mode,brake] = await Promise.all([
      select(this.env.ZONE_DB,"SELECT zone_id, mode, enabled, expires_at FROM zone_warrant WHERE zone_id = ?",ZONE),
      this.env.ZONE_KV.get("mode"),
      this.env.ZONE_KV.get("emergency-brake")
    ]);
    return mode === "HOLDING" && brake === "released" && isWarrant(row,now);
  }

  latchFault() {
    this.sql.exec("UPDATE control SET fault=1 WHERE id=1");
  }

  record(eventId,input,at,tick,scoreAudit) {
    return this.state.storage.transactionSync(() => {
      const previous = this.sql.exec("SELECT seq, payload FROM pending_events WHERE event_id=?",eventId).toArray()[0];
      if (previous) {
        const body = JSON.parse(previous.payload);
        if (canonical(body.forward.input) !== canonical(input)) return {result:"IDEMPOTENCY_CONFLICT"};
        return {sequence:previous.seq,result:body.forward.result,eventId,duplicate:true};
      }
      const control = this.sql.exec("SELECT * FROM control WHERE id=1").one();
      if (control.fault) return {result:"EMERGENCY_BRAKE"};
      if (tick !== null && tick <= control.last_tick) return {result:"TICK_ALREADY_RECORDED"};
      const forward = alien(JSON.parse(control.body),input,at);
      const audit = neila(forward);
      const passed = audit.passed && (scoreAudit?.passed ?? true);
      const data = {zone:ZONE,at,forward,audit,scoreAudit,passed};
      const inserted = this.sql.exec("INSERT INTO pending_events(event_id,payload) VALUES (?,?) RETURNING seq",eventId,canonical(data)).one();
      this.sql.exec("UPDATE control SET body=?, last_tick=?, fault=? WHERE id=1",
        canonical(passed?forward.after:JSON.parse(control.body)),tick??control.last_tick,passed?0:1);
      return {sequence:inserted.seq,result:passed?forward.result:"EMERGENCY_BRAKE",eventId};
    });
  }

  async publish() {
    if (this.flushing) return this.flushing;
    this.flushing = this.flush();
    try { await this.flushing; } finally { this.flushing = null; }
  }

  async flush() {
    const {ZONE_DB, ZONE_R2, EMIT_BUS} = this.env;
    for (const row of this.sql.exec("SELECT seq,event_id,payload FROM pending_events WHERE sent=0 ORDER BY seq LIMIT 20").toArray()) {
      const previous = row.seq===1 ? null : await select(ZONE_DB,"SELECT sha256 FROM conductor_evidence WHERE sequence=?",row.seq-1);
      if (row.seq > 1 && !previous) { this.latchFault(); throw Error("ledger sequence gap"); }
      const evidence = {id:row.event_id,sequence:row.seq,prior:previous?.sha256??"",...JSON.parse(row.payload)};
      const sha = await digest(evidence);
      const serialized = canonical(evidence);
      const path = "audit/"+String(row.seq).padStart(12,"0")+"-"+sha+".json";
      const stored = await ZONE_R2.put(path,serialized,{
        onlyIf:{etagDoesNotMatch:"*"},customMetadata:{sha256:sha},httpMetadata:{contentType:"application/json"}
      });
      if (!stored) {
        const prior = await ZONE_R2.get(path);
        if (!prior || prior.customMetadata?.sha256!==sha || await prior.text()!==serialized) {
          this.latchFault();
          throw Error("audit object mismatch");
        }
      }
      await execute(ZONE_DB,"INSERT OR IGNORE INTO conductor_evidence (event_id,sequence,trigger_name,created_at,audit_status,sha256,prior_sha256,event_json) VALUES (?,?,?,?,?,?,?,?)",
        evidence.id,evidence.sequence,evidence.forward.input.action,evidence.at,evidence.passed?"PASS":"BRAKE",sha,evidence.prior,serialized);
      const persisted = await select(ZONE_DB,"SELECT sha256,sequence FROM conductor_evidence WHERE event_id=?",evidence.id);
      if (persisted?.sha256!==sha || persisted.sequence!==evidence.sequence) {
        this.latchFault();
        throw Error("ledger receipt mismatch");
      }

      await EMIT_BUS.send({zone:ZONE,id:evidence.id,sequence:row.seq,sha256:sha,artifact:path,type:evidence.forward.input.action});
      this.sql.exec("UPDATE pending_events SET sent=1 WHERE seq=?",row.seq);
    }
  }

  async armAlarm() {
    const existing = await this.state.storage.getAlarm();
    if (existing === null || existing <= Date.now()) await this.state.storage.setAlarm(Date.now()+alarmInterval);
  }

  async clock(now, tickTime = now) {
    if (!await this.warrant(now)) return {result:"WARRANT_DENIED"};
    const tick = Math.floor(tickTime/tickInterval);
    const control = this.sql.exec("SELECT body, last_tick, fault FROM control WHERE id=1").one();
    if (control.fault) return {result:"EMERGENCY_BRAKE"};
    const current = JSON.parse(control.body);
    if (current.phase === "ARMED" && now>=current.deadline) {
      this.record("watchdog-"+current.deadline,{action:"TIME_TICK",actor:"clock"},now,null,null);
    }
    if (tick > control.last_tick) {
      const sample = rehearsal(tick*tickInterval);
      const audit = reverseScore(sample);
      const scoreAudit = {meter:"6/8",ratio:"STILLE_NACHT",forwardMeasures:60,
        reverseMeasures:audit.measures.length,passed:audit.passed,scoreSha256:await digest(sample)};
      this.record("time-"+tick,{action:"TIME_TICK",actor:"clock"},now,tick,scoreAudit);
      await this.env.ZONE_KV.put("last-time-heartbeat",String(tick*tickInterval));
    }
    await this.publish();
    return {result:"TIME_EMIT_SYNC",tick};
  }

  async alarm() {
    try {
      await this.clock(Date.now());
    } finally {
      await this.state.storage.setAlarm(Date.now()+alarmInterval);
    }
  }

  async fetch(request) {
    const path = new URL(request.url).pathname;
    if (path === "/status" && request.method === "GET") {
      const control = this.sql.exec("SELECT body,last_tick,fault FROM control WHERE id=1").one();
      return reply({zone:ZONE,mode:"HOLDING",lastTick:control.last_tick,braked:control.fault===1,
        warrant:await this.warrant(Date.now()),state:JSON.parse(control.body)});
    }
    if (request.method!=="POST") return reply({error:"NOT_FOUND"},404);
    const now = Date.now();
    if (path === "/clock") {
      const {scheduledTime} = await request.json();
      await this.armAlarm();
      return reply(await this.clock(now,scheduledTime));
    }
    if (path !== "/event") return reply({error:"NOT_FOUND"},404);
    if (!await this.warrant(now)) return reply({result:"WARRANT_DENIED"},503);
    const {id,input} = await request.json();
    const result = this.record(id,input,now,null,null);
    if (result.result==="IDEMPOTENCY_CONFLICT") return reply(result,409);
    await this.armAlarm();
    try { await this.publish(); } catch (error) { console.error("EMIT remains in outbox",String(error)); }
    return reply(result,result.result==="EMERGENCY_BRAKE"?503:200);
  }
}

async function deliver(event,env) {
  if (event?.zone!==ZONE || !stableId.test(event.id) || !Number.isSafeInteger(event.sequence) ||
      !/^[0-9a-f]{64}$/.test(event.sha256)) throw Error("invalid EMIT envelope");
  const key = "audit/"+String(event.sequence).padStart(12,"0")+"-"+event.sha256+".json";
  if (event.artifact!==key) throw Error("artifact identity mismatch");
  const row = await select(env.ZONE_DB,"SELECT sha256,event_json FROM conductor_evidence WHERE event_id=?",event.id);
  if (!row || row.sha256!==event.sha256) throw Error("missing ledger evidence");
  const evidence = JSON.parse(row.event_json);
  const object = await env.ZONE_R2.get(event.artifact);
  if (!object || await object.text()!==row.event_json || await digest(evidence)!==event.sha256 ||
      evidence.sequence!==event.sequence || evidence.id!==event.id || evidence.forward.input.action!==event.type ||
      !neila(evidence.forward).passed) throw Error("reverse delivery check failed");
  if (await select(env.ZONE_DB,"SELECT event_id FROM conductor_delivery_receipts WHERE event_id=?",event.id)) return;
  if (env.REHEARSAL_WEBHOOK_URL) {
    const url = new URL(env.REHEARSAL_WEBHOOK_URL);
    if (url.protocol!=="https:" || url.hostname!==env.REHEARSAL_WEBHOOK_HOST || url.username || url.password) throw Error("webhook binding denied");
    if (!await select(env.ZONE_DB,"SELECT event_id FROM conductor_webhook_receipts WHERE event_id=?",event.id)) {
      if (!env.REHEARSAL_WEBHOOK_KEY) throw Error("webhook signing key is required");
      const key = await crypto.subtle.importKey("raw",new TextEncoder().encode(env.REHEARSAL_WEBHOOK_KEY),{name:"HMAC",hash:"SHA-256"},false,["sign"]);
      const mac = new Uint8Array(await crypto.subtle.sign("HMAC",key,new TextEncoder().encode(canonical(event))));
      const signature = Array.from(mac,b=>b.toString(16).padStart(2,"0")).join("");
      const res = await fetch(url,{method:"POST",redirect:"error",signal:AbortSignal.timeout(5000),
        headers:{"content-type":"application/json","idempotency-key":event.id,"x-emit-hmac-sha256":signature},body:canonical(event)});
      await res.body?.cancel();
      if (!res.ok) throw Error("webhook returned "+res.status);
      await execute(env.ZONE_DB,"INSERT OR IGNORE INTO conductor_webhook_receipts VALUES (?,?)",event.id,Date.now());
    }
  }
  await execute(env.ZONE_DB,"INSERT OR IGNORE INTO conductor_delivery_receipts VALUES (?,?,?)",event.id,event.sha256,Date.now());
}

const stub = env => env.CONDUCTOR.get(env.CONDUCTOR.idFromName(ZONE));
const relay = (target,path,body) => target.fetch("https://conductor.internal"+path,
  body===undefined ? undefined : {method:"POST",body:JSON.stringify(body)});

export default {
  async scheduled(controller,env) {
    const result = await relay(stub(env),"/clock",{scheduledTime:controller.scheduledTime});
    if (!result.ok) throw Error("TIME heartbeat rejected");
    const body = await result.json();
    if (body.result!=="TIME_EMIT_SYNC") console.error("TIME rehearsal stopped",body.result);
  },
  async queue(batch,env) {
    for (const message of batch.messages) {
      try { await deliver(message.body,env); message.ack(); }
      catch (error) { console.error("EMIT queue retry",String(error)); message.retry(); }
    }
  },
  async fetch(request,env) {
    const url = new URL(request.url);
    if (url.hostname!==stagingHost) return reply({error:"NOT_FOUND"},404);
    if (url.pathname==="/" && request.method==="GET") {
      const board = await env.ZONE_R2.get("ui/index.html");
      return board ? new Response(board.body,{headers:{...displayHeaders,"content-type":"text/html; charset=utf-8"}})
        : reply({error:"BOARD_UNAVAILABLE"},503);
    }
    if (url.pathname==="/switch/launch") return reply({error:"GITHUB_LAUNCH_COMMAND_REQUIRED"},405);
    const actor = await operator(request,env);
    if (!actor) return reply({error:"OPERATOR_REQUIRED"},403);
    if (url.pathname==="/status" && request.method==="GET" && actor!=="sensor") return relay(stub(env),"/status");
    if (request.method!=="POST" || !["/tap","/sensor"].includes(url.pathname)) return reply({error:"NOT_FOUND"},404);
    let data;
    try { data = await readJSON(request); } catch { return reply({error:"INVALID_PAYLOAD"},400); }
    const action = data?.trigger;
    if (!CONTROL_ACTIONS.includes(action) || typeof data.id!=="string" || !stableId.test(data.id)) return reply({error:"INVALID_COMMAND"},400);
    if ((url.pathname==="/sensor")!==(actor==="sensor") || (actor==="sensor"&&action!=="IRQ_FLINCH")) return reply({error:"ROLE_DENIED"},403);
    const input = {action,actor,...(action==="ARM"?{mission:typeof data.mission==="string"?data.mission.slice(0,32):null}:{})};
    return relay(stub(env),"/event",{id:"cmd-"+data.id,input});
  }
};
