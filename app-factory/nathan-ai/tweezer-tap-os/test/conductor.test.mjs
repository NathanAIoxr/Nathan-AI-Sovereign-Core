import { test } from "node:test";
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { readFileSync } from "node:fs";
import worker, { MasterConductor } from "../src/runtime.mjs";
import { initial, alien, neila, rehearsal, reverseScore, WATCHDOG_MS } from "../src/model.mjs";

const migration = readFileSync(new URL("../migrations/0003_conductor_runtime.sql",import.meta.url),"utf8");
function create() {
  const records = new DatabaseSync(":memory:");
  records.exec(migration);
  let alarm = null;
  let outage = false;
  const emitted = [];
  const r2 = new Map();
  const kv = new Map([["mode","HOLDING"],["emergency-brake","released"]]);
  const durable = new DatabaseSync(":memory:");
  const env = {
    OPERATOR_A_KEY:"a".repeat(40),OPERATOR_B_KEY:"b".repeat(40), SENSOR_KEY:"s".repeat(40),
    ZONE_DB:{prepare:sql=>({bind:(...args)=>({first:async()=>records.prepare(sql).get(...args),run:async()=>records.prepare(sql).run(...args)})})},
    ZONE_R2:{put:async(key,data,opts)=>{
      if (r2.has(key)) return null;
      r2.set(key,{customMetadata:opts.customMetadata,text:async()=>data});
      return {};
    },get:async(key)=>r2.get(key)},
    ZONE_KV:{get:async(key)=>kv.get(key),put:async(key,value)=>kv.set(key,value)},
    EMIT_BUS:{send:async(event)=>{if(outage)throw Error("temporary send failure");emitted.push(event);}}
  };
  const state = {storage:{
    sql:{exec:(sql,...args)=>{
      const q=durable.prepare(sql);
      if(!q.columns().length){q.run(...args);return;}
      return {toArray:()=>q.all(...args),one:()=>q.get(...args)};
    }},
    transactionSync:(fn)=>{
      durable.exec("BEGIN");
      try {const result=fn();durable.exec("COMMIT");return result;}
      catch(error){durable.exec("ROLLBACK");throw error;}
    },
    getAlarm:async()=>alarm,setAlarm:async(value)=>{alarm=value;}
  }};
  const instance = new MasterConductor(state,env);
  env.CONDUCTOR={idFromName:id=>id,get:()=>({fetch:(url,init)=>instance.fetch(new Request(url,init))})};
  return {env,records,instance,emitted,r2,kv,durable,get alarm(){return alarm;},set outage(value){outage=value;}};
}

const tap = (env,actor,id,trigger,mission="nostril_toy") => worker.fetch(new Request("https://tweezer-tap-os.test/tap",{
  method:"POST",headers:{authorization:"Bearer "+actor.repeat(40),"content-type":"application/json"},
  body:JSON.stringify({id,trigger,mission})
}),env);

test("ALIEN forward score is walkable backward, and altered evidence fails",()=>{
  const score=rehearsal(0);
  assert.equal(score.length,60);
  const audit=reverseScore(score);
  assert.equal(audit.passed,true);
  assert.deepEqual(audit.measures.map(m=>m.measure),Array.from({length:60},(_,i)=>60-i));
  const copy=structuredClone(score);
  copy[30].forward.undo.panic=999;
  assert.equal(reverseScore(copy).passed,false);
  const armed=alien(initial(),{action:"ARM",actor:"operator-a",mission:"nostril_toy"},0);
  const expired=alien(armed.after,{action:"TIME_TICK",actor:"clock"},WATCHDOG_MS);
  assert.equal(expired.after.outcome,"ER_WATCHDOG");
  assert.equal(neila(expired).passed,true);
});

test("TIME arms itself and deduplicates Cron and alarm ticks",async()=>{
  const c=create();
  const now=Date.now();
  await worker.scheduled({scheduledTime:now},c.env);
  await worker.scheduled({scheduledTime:now},c.env);
  assert.equal(c.emitted.length,1);
  assert.equal(c.emitted[0].type,"TIME_TICK");
  assert.ok(c.alarm>now);
  c.kv.set("emergency-brake","engaged");
  await c.instance.clock(now+60_000);
  assert.equal(c.emitted.length,1);
});

test("two distinct authenticated operators, idempotent retry and reverse-verified queue delivery",async()=>{
  const c=create();
  assert.equal((await tap(c.env,"x","missing-123","ARM")).status,403);
  assert.equal((await tap(c.env,"a","arm-round01","ARM")).status,200);
  const a = await tap(c.env,"a","hold-alpha1","HOLD_HEAD");
  assert.equal((await a.json()).result,"ACCEPTED");
  assert.equal((await (await tap(c.env,"a","hold-alpha1","HOLD_HEAD")).json()).duplicate,true);
  assert.equal((await tap(c.env,"a","hold-alpha1","IRQ_FLINCH")).status,409);
  assert.equal((await (await tap(c.env,"a","early-pull1","TWEEZERS_PULL")).json()).result,"INTERLOCK");
  await tap(c.env,"b","hold-beta01","HOLD_HEAD");
  await tap(c.env,"a","turn-light1","FLASHLIGHT_ON");
  assert.equal((await (await tap(c.env,"b","pull-ready1","TWEEZERS_PULL")).json()).result,"COMPLETE");
  let ack=0,retry=0;
  const message={body:c.emitted[0],ack(){ack++;},retry(){retry++;}};
  await worker.queue({messages:[message,message]},c.env);
  assert.equal(ack,2);
  assert.equal(retry,0);
  assert.equal(c.records.prepare("SELECT count(*) n FROM conductor_delivery_receipts").get().n,1);
  assert.throws(()=>c.records.exec("UPDATE conductor_evidence SET audit_status='BRAKE'"),/append-only/);
});

test("outbox survives a Queue error and retry preserves exact evidence",async()=>{
  const c=create();
  c.outage=true;
  await tap(c.env,"a","outbox-arm01","ARM");
  assert.equal(c.records.prepare("SELECT count(*) n FROM conductor_evidence").get().n,1);
  assert.equal(c.emitted.length,0);
  c.outage=false;
  await c.instance.publish();
  assert.equal(c.emitted.length,1);
  assert.equal(c.r2.size,1);
  assert.equal(c.durable.prepare("SELECT sent FROM pending_events").get().sent,1);
});

test("the staging board cannot promote or use a different hostname",async()=>{
  const c=create();
  assert.equal((await new Request("https://wrong.test")).method,"GET");
  assert.equal((await worker.fetch(new Request("https://wrong.test"),c.env)).status,404);
  assert.equal((await worker.fetch(new Request("https://tweezer-tap-os.test/switch/launch",{method:"POST"}),c.env)).status,405);
});

test("the release score requires every one of 72 checks and reverses from 72 to 1",async()=>{
  const {releaseMeasures}=await import("../src/release.mjs");
  const checks=Array.from({length:12},(_,i)=>["gate-"+i,true]);
  const release={head:"abc",base:"def",pr:1};
  const passed=await releaseMeasures(release,checks);
  assert.equal(passed.passed,true);
  assert.deepEqual(passed.reverse.map(m=>m.measure),Array.from({length:72},(_,i)=>72-i));
  checks[6][1]=false;
  assert.equal((await releaseMeasures(release,checks)).passed,false);
});
