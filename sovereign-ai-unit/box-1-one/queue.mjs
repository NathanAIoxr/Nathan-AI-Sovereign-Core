import { MAX_ATTEMPTS, PlatformError, sha256 } from "../protocol.mjs";
import { backends, compatible, estimate, execute, totalFor } from "./backends.mjs";
export const LEASE_MS = 180000;
const clock = () => Date.now();
const stmt = (db,sql,...params) => db.prepare(sql).bind(...params);
const get = (db,id) => stmt(db,"SELECT * FROM platform_jobs WHERE id=?",id).first();

export async function admit(db, principal, key, input, env, now=clock()) {
  const requestHash = await sha256(JSON.stringify(input));
  const find = () => stmt(db,"SELECT * FROM platform_jobs WHERE project=? AND idem=?",principal.project,key).first();
  const replay = row => {
    if (row.request_hash !== requestHash) throw new PlatformError("Idempotency key already belongs to another request.",409);
    return {row,duplicate:true};
  };
  const previous = await find();
  if (previous) return replay(previous);
  if (input.work.objectId) {
    if (!env.ARTIFACTS) throw new PlatformError("Scoped object storage is awaiting activation.",503);
    const object = await stmt(db,"SELECT sha256,expires FROM platform_objects WHERE project=? AND id=?",principal.project,input.work.objectId).first();
    if (!object || object.sha256 !== input.work.objectSha256 || object.expires <= now + input.deadlineSeconds*1000) {
      throw new PlatformError("Object unavailable for the requested project or deadline.",404);
    }
  }
  const { reserve,allowed } = estimate(input,backends(env));
  const total = totalFor(input);
  const job = {...input,allowed};
  const id = crypto.randomUUID();
  const dayStart = Math.floor(now/86400000)*86400000;
  const row = await stmt(db,`INSERT INTO platform_jobs
    (id,project,idem,request_hash,kind,payload,input_sha256,state,created,updated,ready_at,deadline,retain_ms,reserve_micro,total)
    SELECT ?,?,?,?,?,?,?,'queued',?,?,?,?,?,?,? WHERE
    (SELECT COUNT(*) FROM platform_jobs WHERE project=? AND state IN ('queued','running')) < ?
    AND (SELECT COALESCE(SUM(CASE WHEN state IN ('queued','running') THEN reserve_micro ELSE spent_micro END),0)
      FROM platform_jobs WHERE project=? AND (created>=? OR state IN ('queued','running') OR finished>=?)) + ? <= ?
    ON CONFLICT(project,idem) DO NOTHING RETURNING *`,
    id,principal.project,key,requestHash,input.kind,JSON.stringify(job),await sha256(JSON.stringify(input.work)),
    now,now,now+input.delaySeconds*1000,now+input.deadlineSeconds*1000,input.retentionSeconds*1000,reserve,total,
    principal.project,principal.maxActive,principal.project,dayStart,dayStart,reserve,principal.dailyMicro).first();
  if (row) return {row,duplicate:false};
  const existing = await find();
  if (existing) return replay(existing);
  throw new PlatformError("Project queue or daily budget limit reached.",429);
}

export async function reap(db,now=clock()) {
  await stmt(db,`UPDATE platform_jobs SET state='failed',error='Deadline expired',finished=?,updated=?,
    attempt_charge=0 WHERE state IN ('queued','running') AND deadline<=?`,now,now,now).run();
  await stmt(db,`UPDATE platform_jobs SET state=CASE WHEN attempt>=? THEN 'failed' ELSE 'queued' END,
    error='Worker lease expired', finished=CASE WHEN attempt>=? THEN ? ELSE NULL END, updated=?,ready_at=?,
    lease_token=NULL,lease_until=NULL,attempt_charge=0 WHERE state='running' AND lease_until<=?`,MAX_ATTEMPTS,MAX_ATTEMPTS,now,now,now,now).run();
  await stmt(db,"UPDATE platform_jobs SET lease_token=NULL,lease_until=NULL WHERE state NOT IN ('queued','running') AND lease_until<=?",now).run();
  const purged = await stmt(db,`UPDATE platform_jobs SET state='cleared',payload=NULL,checkpoint=NULL,output=NULL,updated=?
    WHERE state IN ('succeeded','failed','cancelled') AND finished+retain_ms<=?`,now,now).run();
  return purged.meta.changes;
}

export async function claim(db,env,now=clock()) {
  const {results} = await stmt(db,`SELECT * FROM platform_jobs
    WHERE state='queued' AND ready_at<=? AND deadline>? ORDER BY ready_at,created LIMIT 30`,now,now).all();
  const pools = backends(env);
  for (const row of results) {
    const job=JSON.parse(row.payload);
    const eligible = pools.filter(pool=>job.allowed.includes(pool.id) && compatible(pool,job)
      && (job.kind!=="training" || !row.progress || row.backend===pool.id))
      .sort((a,b)=>(Number(row.attempt>0 && a.id===row.backend)-Number(row.attempt>0 && b.id===row.backend))
        || a.priceMicro-b.priceMicro || a.id.localeCompare(b.id));
    for (const pool of eligible) {
      const count = Math.min(row.total-row.progress,job.kind==="training"?1:pool.chunk);
      const charge = pool.priceMicro*count;
      const token = crypto.randomUUID();
      const taken = await stmt(db,`UPDATE platform_jobs SET state='running',backend=?,lease_token=?,lease_until=?,
        attempt=attempt+1,attempt_charge=?,spent_micro=spent_micro+?,updated=?,first_started=COALESCE(first_started,?)
        WHERE id=? AND state='queued' AND progress=? AND ready_at<=? AND deadline>? AND attempt<?
        AND spent_micro+?<=reserve_micro AND (SELECT COUNT(*) FROM platform_jobs WHERE backend=? AND lease_until>?)<?
        RETURNING *`,pool.id,token,now+LEASE_MS,charge,charge,now,now,row.id,row.progress,now,now,MAX_ATTEMPTS,charge,pool.id,now,pool.slots).first();
      if (taken) return {row:taken,pool,job};
    }
  }
  return null;
}
export async function cancel(db,project,id,now=clock()) {
  return stmt(db,`UPDATE platform_jobs SET state='cancelled',error=NULL,finished=?,updated=?,attempt_charge=0
    WHERE id=? AND project=? AND state IN ('queued','running') RETURNING *`,now,now,id,project).first();
}

export async function commitSlice(db,claimInfo,slice,revision,now=clock()) {
  const {row,pool,job}=claimInfo;
  const progress=row.progress+slice.completed;
  const final=progress===row.total;
  const output = job.kind==="sha256" || job.kind==="training" ? slice.data : [
    ...JSON.parse(row.checkpoint??"[]"),...slice.data
  ];
  const serialized=JSON.stringify(output);
  const hash=final?await sha256(serialized):null;
  const history=JSON.parse(row.evidence??"[]");
  const evidence=JSON.stringify([...history,{stage:"Fo",backend:pool.id,offset:row.progress,count:slice.completed,
    backendMs:slice.ms,estimatedMicros:row.attempt_charge,quality:slice.quality,revision}]);
  return stmt(db,`UPDATE platform_jobs SET state=?,updated=?,ready_at=?,progress=?,checkpoint=?,output=?,output_sha256=?,evidence=?,
    finished=?,attempt=0,attempt_charge=0,lease_token=NULL,lease_until=NULL,error=NULL
    WHERE id=? AND lease_token=? AND state='running' AND lease_until>? AND deadline>? RETURNING *`,
    final?"succeeded":"queued",now,now,progress,final?null:serialized,final?serialized:null,hash,evidence,final?now:null,
    row.id,row.lease_token,now,now).first();
}
export async function failSlice(db,row,now=clock()) {
  const retry=row.attempt<MAX_ATTEMPTS && row.deadline>now+1000;
  await stmt(db,`UPDATE platform_jobs SET state=?,error=?,updated=?,ready_at=?,finished=?,
    lease_token=NULL,lease_until=NULL,attempt_charge=0 WHERE id=? AND lease_token=? AND lease_until>? AND state='running'`,
    retry?"queued":"failed","Backend unavailable or result failed verification",now,now+1000*row.attempt,retry?null:now,row.id,row.lease_token,now).run();
}

export async function drain(env, limit=4) {
  const db=env.BOX_1_LEDGER;
  await reap(db);
  let processed=0;
  while (processed < limit) {
    const selected=await claim(db,env);
    if (!selected) break;
    processed++;
    const {row,job,pool}=selected;
    try {
      let object;
      if (job.kind==="sha256" || job.kind==="training" && row.progress===0) {
        const saved=await env.ARTIFACTS.get(row.project+"/"+job.work.objectId);
        if (!saved || saved.size>8*1024*1024) throw new Error("Input unavailable");
        object=await saved.arrayBuffer();
      }
      const slice=await execute(pool,job,row,env,object);
      await commitSlice(db,selected,slice,env.PLATFORM_REVISION??null);
    } catch {
      await failSlice(db,row);
    } finally {
      await stmt(db,"UPDATE platform_jobs SET lease_token=NULL,lease_until=NULL WHERE id=? AND lease_token=? AND state NOT IN ('queued','running')",row.id,row.lease_token).run();
    }
  }
  return processed;
}

export const jobFor = (db,project,id) => stmt(db,"SELECT * FROM platform_jobs WHERE project=? AND id=?",project,id).first();
export const listFor = async (db,project) => (await stmt(db,"SELECT * FROM platform_jobs WHERE project=? ORDER BY created DESC LIMIT 50",project).all()).results;
export function publicJob(row) {
  return { id:row.id, project:row.project, kind:row.kind, state:row.state, backend:row.backend,
    created:row.created, started:row.first_started, finished:row.finished, deadline:row.deadline,
    progress:row.progress,total:row.total, reservedMicro:["queued","running"].includes(row.state)?row.reserve_micro:0,
    spentEstimateMicro:row.spent_micro, sha256:row.output_sha256, error:row.error,
    phases:["Fe"].concat(row.backend?["Fi"]:[],row.progress?["Fo"]:[],row.output_sha256?["Fum"]:[]),
    inputSha256:row.input_sha256, slices:JSON.parse(row.evidence??"[]") };
}
