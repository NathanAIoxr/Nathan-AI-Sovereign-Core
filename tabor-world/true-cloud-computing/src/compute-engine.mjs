import {canonical,sha256} from "./proofs.mjs";

const kernel="fp64-dot-lcg32-v1";

export function checksum(seed,terms) {
  let state=seed>>>0, sum=0;
  for(let i=0;i<terms;i++) {
    state=(Math.imul(state,1664525)+1013904223)>>>0;
    const a=state>>>22;
    state=(Math.imul(state,1664525)+1013904223)>>>0;
    sum+=a*(state>>>22);
  }
  return sum;
}

export async function execute(backend,seed,terms) {
  const response=await backend.fetch("https://compute.internal/api/compute/probe?seed="+seed+"&terms="+terms+"&faults=0",
    {signal:AbortSignal.timeout(10000)});
  if(!response.ok)throw Error("backend_unavailable");
  const {frame,digest}=await response.json();
  const data=frame?.Execution;
  if(frame?.Identity?.kernel!==kernel||data?.seed!==seed||data.terms!==terms||data.operations!==2*terms||
    data.checksumScale!==1048576||data.checksum!==checksum(seed,terms)||frame?.Integrity?.eccStatus!=="clean"||
    !Number.isSafeInteger(data.elapsedNs)||data.elapsedNs<0||typeof data.timed!=="boolean"||
    typeof digest!=="string"||digest!==await sha256(canonical(frame)))throw Error("verification_failed");
  const resultHash=await sha256(canonical({checksum:data.checksum,kernel,seed,terms}));
  if(frame.Mirror?.resultHash!==resultHash)throw Error("verification_failed");
  return {kernel,seed,terms,operations:data.operations,checksum:data.checksum,checksum_scale:data.checksumScale,
    elapsed_ns:data.timed&&data.elapsedNs>0?data.elapsedNs:null,
    measured_flops:data.timed&&data.elapsedNs>0?data.operations*1e9/data.elapsedNs:null,
    upstream_receipt_sha256:digest,result_sha256:resultHash,evidence:"independently_replayed_fp64"};
}

export async function runOne(env,id=null,now=Date.now()) {
  const db=env.DB,owner=crypto.randomUUID();
  const [,claim]=await db.batch([
    db.prepare(`UPDATE true_cloud_compute_jobs SET state='failed',error_code='retry_limit', updated_ms=?,lease_owner=NULL,lease_until=NULL
      WHERE state='running' AND lease_until<=? AND attempts>=3`).bind(now,now),
    db.prepare(`UPDATE true_cloud_compute_jobs SET state='running',attempts=attempts+1,updated_ms=?,lease_owner=?,lease_until=?
      WHERE id=(SELECT id FROM true_cloud_compute_jobs WHERE (? IS NULL OR id=?) AND attempts<3 AND
        ((state='queued' AND next_ms<=?) OR (state='running' AND lease_until<=?)) ORDER BY created_ms,id LIMIT 1)
      RETURNING id,namespace,seed,terms,attempts`).bind(now,owner,now+60000,id,id,now,now),
  ]);
  const job=claim.results[0];
  if(!job)return null;
  try {
    const result=await execute(env.SOVEREIGN_COMPUTE,job.seed,job.terms);
    const body=canonical({id:job.id,namespace:job.namespace,attempt:job.attempts,result});
    const hash=await sha256(body),finished=Date.now();
    const [sealed,completed]=await db.batch([
      db.prepare(`INSERT INTO true_cloud_compute_events(job_id,state,created_ms,receipt,receipt_sha)
       SELECT id,'verified',?,?,? FROM true_cloud_compute_jobs
       WHERE id=? AND state='running' AND lease_owner=? AND lease_until>?`).bind(finished,body,hash,job.id,owner,finished),
      db.prepare(`UPDATE true_cloud_compute_jobs SET state='completed',updated_ms=?,lease_owner=NULL,lease_until=NULL,error_code=NULL
       WHERE id=? AND state='running' AND lease_owner=? AND lease_until>?`).bind(finished,job.id,owner,finished)
    ]);
    return completed.meta.changes&&sealed.meta.changes?{id:job.id,state:"completed",receipt_sha256:hash}:null;
  }catch(error) {
    const status=job.attempts>=3||error.message==="verification_failed"?"failed":"queued";
    const code=error.message==="verification_failed"?"verification_failed":"backend_unavailable";
    const time=Date.now();
    await db.prepare(`UPDATE true_cloud_compute_jobs SET state=?,error_code=?,updated_ms=?,next_ms=?,lease_owner=NULL,lease_until=NULL
      WHERE id=? AND state='running' AND lease_owner=? AND lease_until>?`).bind(status,code,time,time+15000,job.id,owner,time).run();
    return {id:job.id,state:status};
  }
}

export async function benchmark(env,scheduledMs) {
  const bucket=Math.floor(scheduledMs/900000);
  const id="fp64-"+bucket;
  const prior=await env.DB.prepare("SELECT id FROM true_cloud_compute_benchmarks WHERE id=?").bind(id).first();
  if(prior)return;
  const result=await execute(env.SOVEREIGN_COMPUTE,73,2048);
  const body=canonical({id,scheduled_ms:scheduledMs,result});
  await env.DB.prepare("INSERT OR IGNORE INTO true_cloud_compute_benchmarks VALUES(?,?,?,?)").bind(id,scheduledMs,body,await sha256(body)).run();
}

export async function scheduledCompute(env,scheduledMs) {
  for(let i=0;i<3;i++)if(!await runOne(env))break;
  await benchmark(env,scheduledMs);
}
