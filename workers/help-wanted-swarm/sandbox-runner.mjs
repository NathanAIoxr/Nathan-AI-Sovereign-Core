import { DurableObject } from "cloudflare:workers";
const BRAND = "Nathan AI / Absolute Intelligence";
const BYLINE = "By Nathan Tabor and Nathan AI";
const ANCHORS = ["1+1=2","1-1=0","1×1=1","1÷1=1"];
const DOC_CHECK="__ABSOLUTE_INTELLIGENCE_DOCUMENTATION_CHECK__";
const CASE = "__ABSOLUTE_INTELLIGENCE_HIVE_CANARY__";
const sqlRead = "SELECT checked_at, payload FROM repair_runtime WHERE id=?";
const sqlWrite = "INSERT INTO repair_runtime(id,checked_at,payload) VALUES(?,?,?) ON CONFLICT(id) DO UPDATE SET checked_at=excluded.checked_at,payload=excluded.payload WHERE excluded.checked_at>=repair_runtime.checked_at";
const dbKey = "linux-node-canary";

export class RepairSandbox extends DurableObject {
  runCanary() { return this.runCase(CASE); }
  runDocumentation(input) {
    const data=JSON.stringify(input);
    if(data.length>30000)throw new Error("Documentation input too large");
    return this.runCase(DOC_CHECK,[data]);
  }
  async runCase(code,args=[]) {
    return this.ctx.blockConcurrencyWhile(async () => {
      const container = this.ctx.container;
      if (!container) throw new Error("Container app is not bound yet");
      if (container.running) await container.destroy();
      try {
        container.start({
          image: "cloudflare/debian-trixie", instance:"lite",
          entrypoint: ["sleep","40"], enableInternet: false
        });
        const proc = await container.exec(["node","--input-type=module","-e",code,...args], {user:"1000:1000"});
        const result = await proc.output();

        const exitCode = result.exitCode;
        const decode = new TextDecoder();
        const stdout = decode.decode(result.stdout);
        if (!stdout) return {ok:false,exitCode,error:decode.decode(result.stderr).slice(0,180)};
        const value = JSON.parse(stdout);
        return {...value,exitCode,ok:exitCode===0&&value.exitCode!==null&&(value.exitCode===undefined||value.exitCode===0)};
      } finally {
        if (container.running) await container.destroy();
      }
    });
  }
}

async function run(env, time) {
  const current = await env.HIVE.prepare(sqlRead).bind(dbKey).first();
  if (current) {
    const status = JSON.parse(current.payload);
    const interval = status.ok ? 86400 : 900;
    if (time - current.checked_at < interval) return;
  }
  let receipt;
  try {
    const sandbox = env.SANDBOX.getByName(dbKey);
    receipt = await sandbox.runCanary();
  } catch (error) {
    receipt = {ok:false, error:String(error.message).slice(0,180)};
  }
  const payload = {name:BRAND,byline:BYLINE,anchors:ANCHORS,checkedAt:new Date().toISOString(),...receipt};
  await env.HIVE.prepare(sqlWrite).bind(dbKey,time,JSON.stringify(payload)).run();
  if (!payload.ok) console.warn(JSON.stringify({profile:dbKey,error:payload.error??"Test command failed"}));
}

async function drainRuntime(env) {
  const canary=await env.HIVE.prepare(sqlRead).bind(dbKey).first();
  if (!canary || !JSON.parse(canary.payload).ok) return;
  await env.HIVE.prepare(`UPDATE repair_runtime_tasks SET status='FAILED',updated_at=unixepoch(),
    result=json_object('ok',0,'error','Execution lease expired')
    WHERE status='RUNNING' AND attempts>=2 AND lease_until<=unixepoch()`).run();
  const token=crypto.randomUUID();
  const task=await env.HIVE.prepare(`UPDATE repair_runtime_tasks
    SET status='RUNNING', attempts=attempts+1,lease=?,lease_until=unixepoch()+120,updated_at=unixepoch()
    WHERE id=(SELECT id FROM repair_runtime_tasks
      WHERE profile='toml-comment-only' AND attempts<2
        AND (status='PENDING' OR (status='RUNNING' AND lease_until<=unixepoch()))
      ORDER BY updated_at,id LIMIT 1)
    RETURNING id, job_id, input, attempts`).bind(token).first();
  if (!task) return;
  let receipt;
  try {
    receipt=await env.SANDBOX.getByName(task.id).runDocumentation(JSON.parse(task.input));
  } catch(error) { receipt={ok:false,error:String(error.message).slice(0,180)}; }
  receipt={...receipt,byline:BYLINE,job:task.job_id,checkedAt:new Date().toISOString()};
  const status=receipt.ok?'PASSED':task.attempts<2?'PENDING':'FAILED';
  await env.HIVE.prepare(`UPDATE repair_runtime_tasks SET status=?,result=?,updated_at=unixepoch()
    WHERE id=? AND lease=? AND status='RUNNING' AND lease_until>unixepoch()`)
    .bind(status,JSON.stringify(receipt),task.id,token).run();
}
async function tick(env,time) {
  await run(env,time);
  await drainRuntime(env);
}
export default {
  fetch() { return new Response("Private runner", { status: 404 }); },
  scheduled(event, env, ctx) { ctx.waitUntil(tick(env, Math.floor(event.scheduledTime/1000))); }
};
