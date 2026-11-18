import legacy from "../legacy/orchestrator-live.mjs";
import { PLATFORM, PlatformError, bodyJson, json, validateJob, ident, uuid, receipt, headers } from "../protocol.mjs";
import { backends } from "./backends.mjs";
import { admit, cancel, drain, publicJob, jobFor, listFor } from "./queue.mjs";
import { upload, purgeObjects } from "./objects.mjs";

const benchmarkRows = async db => (await db.prepare(
  "SELECT id,revision,recorded,receipt,sha256 FROM platform_benchmarks ORDER BY recorded DESC LIMIT 12"
).all()).results.map(row=>({...row,receipt:JSON.parse(row.receipt)}));
async function status(env,project) {
  const db=env.BOX_1_LEDGER;
  const scope = project ? " WHERE project=?" : "";
  const prepare = sql => project ? db.prepare(sql).bind(project) : db.prepare(sql);
  const [totals,running] = await db.batch([
    prepare(`SELECT state,COUNT(*) AS n,SUM(spent_micro) AS spent,SUM(CASE WHEN state IN ('running','queued') THEN reserve_micro ELSE 0 END) AS reserved FROM platform_jobs`+scope+" GROUP BY state"),
    prepare("SELECT backend,COUNT(*) AS n FROM platform_jobs"+scope+(project?" AND":" WHERE")+" lease_until>CAST(strftime('%s','now') AS INTEGER)*1000 GROUP BY backend")
  ]);
  const pools=backends(env).map(pool => ({
    ...pool, occupied:running.results.find(row=>row.backend===pool.id)?.n??0,
    available:project?null:Math.max(0,pool.slots-(running.results.find(row=>row.backend===pool.id)?.n??0))
  })).map(({binding,...pool})=>pool);
  const count=totals.results.reduce((acc,x)=>({...acc,[x.state]:x.n}),{});
  return {
    platform:PLATFORM, revision:env.PLATFORM_REVISION??null, scope:project??"aggregate", jobs:count,
    spending:{estimatedUsdMicros:totals.results.reduce((sum,x)=>sum+x.spent,0),reservedUsdMicros:totals.results.reduce((sum,x)=>sum+x.reserved,0), basis:"Conservative platform estimates, excluding shared edge overhead. Not provider billing."},
    pools, objectStorage:Boolean(env.ARTIFACTS), physicalDevicesRegistered:pools.filter(pool=>pool.runtime==="authorized-service").reduce((sum,pool)=>sum+pool.deviceCount,0),
    projects:["pie-pi-phi","supercalifragilisticexpialidocious"], stages:["Fe","Fi","Fo","Fum"]
  };
}
const response = (decision,reason,value={},status=200) => json({receipt:receipt(decision,reason),...value},status);
async function privateRoutes(request,env,ctx,url) {
  if (url.origin !== "https://box-one") return json({error:"Not found"},404);
  const path=url.pathname, method=request.method, db=env.BOX_1_LEDGER;
  if (path==="/platform/status" && method==="GET") return json(await status(env));
  if (path==="/platform/benchmarks" && method==="GET") return json({benchmarks:await benchmarkRows(db)});
  const project=request.headers.get("x-platform-project")??"";
  if (!ident.test(project)) throw new PlatformError("Project identity required.",403);
  if (path==="/platform/status" && method==="POST") return response("accepted","project-status",{status:await status(env,project)});
  if (path==="/platform/jobs" && method==="POST") {
    const raw = await bodyJson(request,24576);
    const input = validateJob(raw);
    const key=request.headers.get("idempotency-key")??"";
    const dailyMicro=Number(request.headers.get("x-platform-daily-micro"));
    const maxActive=Number(request.headers.get("x-platform-max-active"));
    if (!/^[a-zA-Z0-9_-]{1,80}$/.test(key) || !Number.isSafeInteger(dailyMicro) || dailyMicro<0 || dailyMicro>1e9
      || !Number.isSafeInteger(maxActive) || maxActive<1 || maxActive>64) throw new PlatformError("Invalid admission parameters.");
    const {row,duplicate}=await admit(db,{project,dailyMicro,maxActive},key,input,env);
    if (!duplicate && row.state==="queued" && row.ready_at<=Date.now()) ctx?.waitUntil(drain(env).catch(()=>console.error("platform dispatch unavailable")));
    return response(duplicate?"accepted":input.delaySeconds?"deferred":"accepted",duplicate?"duplicate-replayed":row.backend==="verified-cache"?"verified-cache-hit":input.delaySeconds?"scheduled-delay":"job-queued",
      {job:publicJob(row),duplicate},duplicate?200:202);
  }
  if (path==="/platform/jobs" && method==="GET") return response("accepted","project-jobs",{jobs:(await listFor(db,project)).map(publicJob)});
  if (path==="/platform/objects" && method==="POST") return response("accepted","object-stored",{object:await upload(env,request,project)},201);
  const [,id,artifact] = /^\/platform\/jobs\/([^/]+)(\/artifact)?$/.exec(path)??[];
  if (!uuid.test(id??"")) throw new PlatformError("Not found.",404);
  let row = await jobFor(db,project,id);
  if (!row) throw new PlatformError("Job not found.",404);
  if (method==="DELETE" && !artifact) {
    row=await cancel(db,project,id)??await jobFor(db,project,id);
    if (row.state!=="cancelled") throw new PlatformError("Job has already reached a terminal state.",409);
    return response("cleared","cancelled",{job:publicJob(row)});
  }
  if (method!=="GET") throw new PlatformError("Method not allowed.",405);
  if (!artifact) return response("accepted","job-status",{job:publicJob(row)});
  if (row.state==="cleared" || (row.finished && row.finished+row.retain_ms<=Date.now())) throw new PlatformError("Artifact retention ended.",410);
  if (row.state!=="succeeded") throw new PlatformError("Verified artifact is not available.",409);
  return new Response(row.output,{headers:{...headers,"content-type":"application/json",
    "content-disposition":'attachment; filename="result.json"',"x-artifact-sha256":row.output_sha256,"x-platform-decision":"accepted",
    "x-platform-request-id":crypto.randomUUID()}});
}
export default {
  async fetch(request,env,ctx) {
    const url=new URL(request.url);
    if (!url.pathname.startsWith("/platform/")) return legacy.fetch(request,env,ctx);
    try { return await privateRoutes(request,env,ctx,url); }
    catch (error) {
      if (!(error instanceof PlatformError)) console.error("platform job service unavailable");
      return response(error.status===429||!error.status||error.status===503?"deferred":"rejected",
        error instanceof PlatformError?error.message:"Job service unavailable.",{},error instanceof PlatformError?error.status:503);
    }
  },
  async scheduled(controller,env) {
    await drain(env);
    if (new Date(controller.scheduledTime).getUTCMinutes()===0) await purgeObjects(env);
  }
};
