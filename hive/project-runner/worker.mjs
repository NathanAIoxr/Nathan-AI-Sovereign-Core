const ID = /^[a-z0-9][a-z0-9-]{0,79}$/;
const ROLES = ['build', 'review', 'integrate', 'verify'];
const MAX_BODY = 512 * 1024;
const LEASE_MS = 120_000;
const LEASE_EXPIRED = JSON.stringify({reason:'Lease expired before the receipt was saved'});
const AUTH_HEADER = { 'cache-control':'no-store', 'x-content-type-options':'nosniff' };

class RequestError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

const fail = (status, message) => { throw new RequestError(status, message); };
const json = (data, status = 200) => Response.json(data, {status,headers:AUTH_HEADER});
const str = (value, max) => typeof value === 'string' && value.trim().length > 0 && value.length <= max;
const validId = value => typeof value === 'string' && ID.test(value);
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);

async function digest(text) {
  return new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text)));
}

async function authorized(request, env) {
  if (!str(env.RUNNER_TOKEN,256) || env.RUNNER_TOKEN.length < 32) return false;
  const supplied = request.headers.get('authorization') ?? '';
  if (!supplied.startsWith('Bearer ') || supplied.length > 263) return false;
  const [left,right] = await Promise.all([digest(supplied.slice(7)),digest(env.RUNNER_TOKEN)]);
  return left.reduce((diff,value,index) => diff | (value ^ right[index]),0) === 0;
}

async function readBody(request) {
  if (!request.body) fail(400,'Expected JSON body');
  const reader = request.body.getReader();
  let size = 0;
  const decoder = new TextDecoder();
  let text = '';
  while (true) {
    const {done,value} = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > MAX_BODY) {
      await reader.cancel();
      fail(413,'Request exceeds 512 KiB');
    }
    text += decoder.decode(value,{stream:true});
  }
  let data;
  try { data = JSON.parse(text + decoder.decode()); } catch { fail(400,'Invalid JSON'); }
  if (!object(data)) fail(400,'Expected JSON object');
  return data;
}

function validatePlan(input) {
  const {id,title,mode,root,brief} = input;
  if (!validId(id) || !str(title,150) || !['code','manuscript','both'].includes(mode) ||
      !validId(root) || !str(brief,16000)) fail(400,'Invalid job identity or brief');
  if (!Array.isArray(input.tasks) || input.tasks.length < 1 || input.tasks.length > 500) {
    fail(400,'Provide between 1 and 500 tasks');
  }
  const byId = new Map();
  const tasks = input.tasks.map((task,ordinal) => {
    if (!object(task)) fail(400,'Invalid task');
    const {id,role,instruction,acceptance,dependsOn = [],maxAttempts = 3} = task;
    if (!validId(id) || byId.has(id) || !ROLES.includes(role) || !str(instruction,12000) ||
        !Array.isArray(acceptance) || !acceptance.length || acceptance.length > 20 ||
        !acceptance.every(item => str(item,1000)) ||
        !Array.isArray(dependsOn) || !dependsOn.every(validId) || new Set(dependsOn).size !== dependsOn.length ||
        !Number.isInteger(maxAttempts) || maxAttempts < 1 || maxAttempts > 20) fail(400,'Invalid or duplicate task');
    const value = {id,ordinal,role,instruction,acceptance,dependsOn,maxAttempts};
    byId.set(id,value);
    return value;
  });
  const active = new Set();
  const visited = new Set();
  function visit(id) {
    if (visited.has(id)) return;
    if (active.has(id)) fail(400,'Task dependencies contain a cycle');
    const task = byId.get(id);
    if (!task) fail(400,'Unknown task dependency');
    active.add(id);
    task.dependsOn.forEach(visit);
    active.delete(id);
    visited.add(id);
  }
  tasks.forEach(task => visit(task.id));
  return {id,title,mode,root,brief,tasks};
}

async function submit(db, body, now) {
  const plan = validatePlan(body);
  const encoded = JSON.stringify(plan.tasks);
  const fingerprint = Array.from(await digest(JSON.stringify(plan)),b=>b.toString(16).padStart(2,'0')).join('');
  await db.batch([
    db.prepare(`INSERT INTO runner_jobs VALUES (?,?,?,?,?,?,?)
      ON CONFLICT(id) DO NOTHING`).bind(plan.id,fingerprint,plan.title,plan.mode,plan.root,plan.brief,now),
    db.prepare(`INSERT INTO runner_tasks (job_id,id,ordinal,role,instruction,acceptance,max_attempts,available_at)
      SELECT j.id,json_extract(t.value,'$.id'),json_extract(t.value,'$.ordinal'),json_extract(t.value,'$.role'),
        json_extract(t.value,'$.instruction'),json_extract(t.value,'$.acceptance'),json_extract(t.value,'$.maxAttempts'),?
      FROM runner_jobs j,json_each(?) t WHERE j.id=? AND j.fingerprint=?
      ON CONFLICT(job_id,id) DO NOTHING`).bind(now,encoded,plan.id,fingerprint),
    db.prepare(`INSERT INTO runner_dependencies
      SELECT j.id,json_extract(t.value,'$.id'),d.value
      FROM runner_jobs j,json_each(?) t,json_each(t.value,'$.dependsOn') d WHERE j.id=? AND j.fingerprint=?
      ON CONFLICT(job_id,task_id,dependency_id) DO NOTHING`).bind(encoded,plan.id,fingerprint)
  ]);
  const job = await db.prepare('SELECT fingerprint FROM runner_jobs WHERE id=?').bind(plan.id).first();
  if (job?.fingerprint !== fingerprint) fail(409,'The job ID already has a different plan');
  return {id:plan.id,tasks:plan.tasks.length};
}

async function reconcile(db, jobId, now) {
  await db.batch([
    db.prepare(`UPDATE runner_tasks SET state=CASE WHEN attempt>=max_attempts THEN 'blocked' ELSE 'pending' END,
      lease_id=NULL,lease_until=NULL,available_at=?,receipt=?
      WHERE job_id=? AND state='running' AND lease_until<=?`).bind(now,LEASE_EXPIRED,jobId,now),
    db.prepare(`WITH RECURSIVE dependents(id) AS (
      SELECT id FROM runner_tasks WHERE job_id=?1 AND state='blocked'
      UNION
      SELECT d.task_id FROM runner_dependencies d JOIN dependents x ON x.id=d.dependency_id WHERE d.job_id=?1
    )
    UPDATE runner_tasks SET state='blocked',receipt=?
    WHERE job_id=?1 AND state='pending' AND id IN (SELECT id FROM dependents)`)
      .bind(jobId,JSON.stringify({reason:'A prerequisite is blocked'}))
  ]);
}

async function jobStatus(db, id) {
  const job = await db.prepare('SELECT id,title,mode,root,brief FROM runner_jobs WHERE id=?').bind(id).first();
  if (!job) fail(404,'Job not found');
  const {results} = await db.prepare(`SELECT id,role,state,attempt,max_attempts,receipt
    FROM runner_tasks WHERE job_id=? ORDER BY ordinal`).bind(id).all();
  const counts = {pending:0,running:0,accepted:0,blocked:0};
  const tasks = results.map(({receipt,...row}) => {
    counts[row.state]++;
    return {...row,receipt:receipt ? JSON.parse(receipt) : null};
  });
  const state = counts.running || counts.pending ? 'active' : counts.blocked ? 'blocked' : 'complete';
  const {brief,...summary} = job;
  return {job:summary,state,counts,tasks};
}

async function claim(db, id, body, now) {
  const {root,roles} = body;
  if (!validId(root) || !Array.isArray(roles) || !roles.length || roles.some(role=>!ROLES.includes(role))) {
    fail(400,'Invalid runner root or roles');
  }
  const job = await db.prepare('SELECT id,title,root,mode,brief FROM runner_jobs WHERE id=?').bind(id).first();
  if (!job) fail(404,'Job not found');
  if (job.root !== root) fail(409,'Job is assigned to a different workspace');
  await reconcile(db,id,now);
  const lease = crypto.randomUUID();
  const task = await db.prepare(`UPDATE runner_tasks SET
    state='running',attempt=attempt+1,lease_id=?1,lease_until=?2,receipt=NULL
    WHERE job_id=?3 AND id=(
      SELECT t.id FROM runner_tasks t
      WHERE t.job_id=?3 AND t.state='pending' AND t.available_at<=?4 AND t.attempt<t.max_attempts
        AND t.role IN (SELECT value FROM json_each(?5))
        AND NOT EXISTS (
          SELECT 1 FROM runner_dependencies d JOIN runner_tasks p ON p.job_id=d.job_id AND p.id=d.dependency_id
          WHERE d.job_id=t.job_id AND d.task_id=t.id AND p.state<>'accepted'
        )
      ORDER BY t.ordinal LIMIT 1
    ) RETURNING id,role,instruction,acceptance,attempt,lease_until`)
    .bind(lease,now+LEASE_MS,id,now,JSON.stringify(roles)).first();
  if (!task) return {task:null};
  const {results} = await db.prepare(`SELECT p.id,p.attempt,p.receipt
    FROM runner_dependencies d JOIN runner_tasks p ON p.job_id=d.job_id AND p.id=d.dependency_id
    WHERE d.job_id=? AND d.task_id=? ORDER BY p.ordinal`).bind(id,task.id).all();
  return {job,task:{...task,acceptance:JSON.parse(task.acceptance)},lease,
    dependencies:results.map(row=>({...row,receipt:JSON.parse(row.receipt)}))};
}

function receipt(body) {
  if (!str(body.lease,60) || !Number.isInteger(body.attempt) || body.attempt<1 ||
      !['accepted','retry','blocked'].includes(body.outcome)) fail(400,'Invalid completion');
  const evidence = body.evidence;
  if (!object(evidence) || JSON.stringify(evidence).length>8192) fail(400,'Invalid or oversized receipt');
  if (body.outcome==='accepted') {
    if (!object(evidence.artifact) || !str(evidence.artifact.path,1200) ||
        !/^[0-9a-f]{64}$/.test(evidence.artifact.sha256 ?? '') ||
        !Array.isArray(evidence.checks) || !evidence.checks.length || evidence.checks.length>30 ||
        evidence.checks.some(check=>!object(check) || !str(check.name,300) || check.result!=='passed')) {
      fail(400,'Acceptance requires an artifact checksum and passing checks');
    }
  } else if (!str(evidence.reason,2000)) fail(400,'A retry or blocker requires a reason');
  return JSON.stringify(evidence);
}

async function finish(db, jobId, taskId, body, now) {
  const encoded = receipt(body);
  const changed = await db.prepare(`UPDATE runner_tasks SET
      state=CASE WHEN ?1='retry' THEN CASE WHEN attempt>=max_attempts THEN 'blocked' ELSE 'pending' END ELSE ?1 END,
      receipt=?2,lease_id=NULL,lease_until=NULL,available_at=?3
      WHERE job_id=?4 AND id=?5 AND state='running' AND lease_until>?6 AND lease_id=?7 AND attempt=?8
      RETURNING state`).bind(body.outcome,encoded,now+Math.min(300_000,1000 * 2 ** body.attempt),
      jobId,taskId,now,body.lease,body.attempt).first();
  if (changed) return changed;
  const recorded = await db.prepare(`SELECT outcome,receipt FROM runner_receipts
    WHERE job_id=? AND task_id=? AND attempt=? AND lease_id=?`).bind(jobId,taskId,body.attempt,body.lease).first();
  if (recorded && recorded.receipt === encoded &&
      (recorded.outcome===body.outcome || body.outcome==='retry' && ['pending','blocked'].includes(recorded.outcome))) {
    return {state:recorded.outcome,replayed:true};
  }
  fail(409,'Lease is stale or completion differs');
}

export async function handle(request, env, now = Date.now()) {
  try {
    const parts = new URL(request.url).pathname.split('/').slice(1);
    if (request.method==='GET' && parts.join('/')==='healthz') return json({service:'Nathan AI Project Runner'});
    if (!await authorized(request,env)) fail(401,'Unauthorized');
    if (parts[0]!=='v1' || parts[1]!=='jobs') fail(404,'Unknown route');
    const db = env.LEDGER;
    if (parts.length===2 && request.method==='POST') return json(await submit(db,await readBody(request),now),201);
    const id = parts[2];
    if (!validId(id)) fail(404,'Unknown job route');
    if (parts.length===3 && request.method==='GET') {
      await reconcile(db,id,now);
      return json(await jobStatus(db,id));
    }
    if (request.method!=='POST') fail(404,'Unknown route');
    if (parts.length===4 && parts[3]==='claim') return json(await claim(db,id,await readBody(request),now));
    const [,, , taskSegment, taskId, action] = parts;
    if (parts.length!==6 || taskSegment!=='tasks' || !validId(taskId)) fail(404,'Unknown route');
    const body = await readBody(request);
    if (action==='finish') return json(await finish(db,id,taskId,body,now));
    if (action==='heartbeat') {
      if (!str(body.lease,60) || !Number.isInteger(body.attempt)) fail(400,'Invalid lease');
      const changed = await db.prepare(`UPDATE runner_tasks SET lease_until=?
        WHERE job_id=? AND id=? AND state='running' AND lease_until>? AND lease_id=? AND attempt=?
        RETURNING lease_until`).bind(now+LEASE_MS,id,taskId,now,body.lease,body.attempt).first();
      if (!changed) fail(409,'Lease is stale');
      return json(changed);
    }
    fail(404,'Unknown route');
  } catch (error) {
    if (error instanceof RequestError) return json({error:error.message},error.status);
    console.error('Project runner query failed',error?.message);
    return json({error:'Project runner unavailable'},503);
  }
}

export default {fetch: (request, env) => handle(request,env)};
