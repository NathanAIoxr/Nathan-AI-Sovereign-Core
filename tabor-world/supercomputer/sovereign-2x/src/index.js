import legacy from "./legacy.mjs";
import { blueprint,canonical,dot,fieldCount,frameContract,kernelId,route,run,sha,validateFrame } from "./core.mjs";
import { dashboard, dashboardCsp } from "./site.mjs";

const headers={"cache-control":"no-store","x-content-type-options":"nosniff","access-control-allow-origin":"*"};
const json=(data,status=200)=>Response.json(data,{status,headers});
const prefix="/api/compute/";
const select="SELECT run_id,created_ms,source,receipt,digest FROM sovereign_compute_runs";
const exampleKey="launch-2.1.0";

async function store(db,key,result) {
  await db.prepare("INSERT INTO sovereign_compute_runs(run_id,created_ms,source,receipt,digest) VALUES(?,?,?,?,?) ON CONFLICT DO NOTHING")
    .bind(key,result.frame.Identity.createdMs,result.frame.Identity.source,canonical(result.frame),result.digest).run();
}

function summarize(row) {
  const frame=JSON.parse(row.receipt);
  const {terms,operations,elapsedNs,checksum,timed}=frame.Execution;
  return {id:row.run_id,created_ms:row.created_ms,source:row.source,digest:row.digest,terms,operations,elapsed_ns:elapsedNs,checksum,
    measured_flop_s:timed?operations*1e9/elapsedNs:null,ecc_status:frame.Integrity.eccStatus,slot:frame.Routing.slot};
}

export async function audit(row) {
  const stored=JSON.parse(row.receipt);
  validateFrame(stored);
  const e=stored.Execution, expectedRoute=route(e.seed);
  const routeMatches=expectedRoute.slot===stored.Routing.slot && expectedRoute.logicalId===stored.Routing.logicalId &&
    expectedRoute.forward.every((slot,i)=>slot===expectedRoute.reverse[expectedRoute.reverse.length-1-i]);
  const rebuilt=await run({seed:e.seed,terms:e.terms,faults:stored.Integrity.faultCount,
    source:stored.Identity.source,now:stored.Identity.createdMs});
  const stableLayers=["Operation","Noise","Integrity","Routing"];
  const stableMatch=stableLayers.every(layer=>canonical(rebuilt.frame[layer])===canonical(stored[layer]));
  const checksumMatch=e.checksum===rebuilt.frame.Execution.checksum && e.operations===rebuilt.frame.Execution.operations &&
    (!e.operations || e.checksum===dot(e.seed,e.terms));
  const expectedHash=await sha(canonical({kernel:kernelId,seed:e.seed,terms:e.terms,checksum:e.checksum}));
  const result={receipt_hash:await sha(canonical(stored))===row.digest,checksum_replay:checksumMatch,reverse_route:routeMatches,
    operation_integrity:stableMatch,result_hash:expectedHash===stored.Mirror.resultHash,
    identity:row.created_ms===stored.Identity.createdMs&&row.source===stored.Identity.source};
  return {verified:Object.values(result).every(Boolean),checks:result};
}

async function compute(request,env,url) {
  if (request.method!=="GET") return json({error:"GET required"},405);
  const path=url.pathname.slice(prefix.length);
  if (path==="manifest") return json({...blueprint,frame_fields:fieldCount,contract:frameContract,
    hpl_evidence:"pending hardware run",launch_receipt:exampleKey});
  if (path==="probe") {
    const num=(name,fallback)=>{
      const value=url.searchParams.get(name);
      if (value===null) return fallback;
      if (!/^\d{1,10}$/.test(value)) throw RangeError("Expected an unsigned integer for "+name);
      return Number(value);
    };
    return json(await run({seed:num("seed",73),terms:num("terms",2048),faults:num("faults",1)}));
  }
  if (path==="receipts") {
    const {results}=await env.COMPUTE.prepare(select+" ORDER BY created_ms DESC,run_id DESC LIMIT 20").all();
    return json({receipts:results.map(summarize)});
  }
  const match=/^receipts\/([A-Za-z0-9-]{1,100})(\/audit)?$/.exec(path);
  if (!match) return json({error:"Unknown compute endpoint"},404);
  const row=await env.COMPUTE.prepare(select+" WHERE run_id=?").bind(match[1]).first();
  if (!row) return json({error:"Receipt not found"},404);
  return json(match[2]?await audit(row):{...summarize(row),frame:JSON.parse(row.receipt)});
}

export default {
  async fetch(request,env) {
    const url=new URL(request.url);
    if (request.method==="GET" && url.pathname==="/") {
      return new Response(dashboard(""),{headers:{...headers,"content-type":"text/html; charset=utf-8","content-security-policy":dashboardCsp("'self'")}});
    }
    if (url.pathname.startsWith(prefix)) {
      try { return await compute(request,env,url); }
      catch(error) {
        if (error instanceof RangeError) return json({error:error.message},400);
        console.error("compute",error.message);
        return json({error:"Compute route unavailable"},503);
      }
    }
    return legacy.fetch(request,env);
  },
  async scheduled(event,env,ctx) {
    ctx.waitUntil((async ()=>{
      const bucket=Math.floor(event.scheduledTime/900000);
      const result=await run({seed:bucket>>>0,terms:4096,source:"cloudflare-cron",now:event.scheduledTime});
      await store(env.COMPUTE,"cron-"+bucket,result);
    })());
  }
};
