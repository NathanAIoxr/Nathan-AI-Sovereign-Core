const keyPattern = /^[a-z][a-z0-9-]{0,39}$/;
const idPattern = /^[0-9a-f-]{36}$/i;
const retryKeyPattern = /^[A-Za-z0-9._:-]{1,100}$/;
const statuses = ["pending","running","generated","published","failed","cancelled","blocked","waiting"];

export const ready = `NOT EXISTS (SELECT 1 FROM build_job_meta m WHERE m.job_id=q.id AND m.cancelled_at IS NOT NULL)
 AND NOT EXISTS (SELECT 1 FROM build_dependencies d JOIN build_queue needs ON needs.id=d.needs_id
 WHERE d.job_id=q.id AND needs.status NOT IN ('generated','published'))`;
export const paused = async env => Boolean((await env.DB.prepare("SELECT paused FROM build_control WHERE singleton=1").first()).paused);

function validId(id) {
  if (typeof id !== "string" || !idPattern.test(id)) throw new RangeError("Invalid ID.");
  return id;
}

function verifyTasks(tasks) {
  if (!Array.isArray(tasks) || tasks.length < 1 || tasks.length > 50) throw new RangeError("Provide 1 to 50 tasks.");
  const rows = tasks.map(task => {
    if (!task || typeof task !== "object") throw new RangeError("Each task requires a key and prompt.");
    const { key, prompt, kind = "module", publish = false, depends_on = [] } = task;
    if (typeof key !== "string" || !keyPattern.test(key) || typeof prompt !== "string" || !prompt.trim() ||
        prompt.length > 4000 || !["module","probe"].includes(kind) || typeof publish !== "boolean" ||
        !Array.isArray(depends_on) || depends_on.length > 12 ||
        depends_on.some(dep => typeof dep !== "string" || !keyPattern.test(dep)) ||
        new Set(depends_on).size !== depends_on.length) throw new RangeError("A task has an invalid key, prompt or dependency.");
    return { key,prompt:prompt.trim(),kind,publish,depends_on };
  });
  const remaining = new Map(rows.map(row => [row.key,new Set(row.depends_on)]));
  if (remaining.size !== rows.length) throw new RangeError("Task keys must be unique.");
  if (rows.some(row => row.depends_on.some(dep => !remaining.has(dep)))) throw new RangeError("A dependency references an unknown task.");
  while (remaining.size > 0) {
    const leaves = [...remaining].filter(([,needs]) => !needs.size).map(([key]) => key);
    if (!leaves.length) throw new RangeError("Task dependencies contain a cycle.");
    for (const leaf of leaves) remaining.delete(leaf);
    for (const needs of remaining.values()) for (const leaf of leaves) needs.delete(leaf);
  }
  return rows;
}

export async function queuePlan(env,args,digest,now=Date.now()) {
  const title = typeof args.title === "string" ? args.title.trim() : "";
  const retryKey = args.idempotency_key ?? null;
  if (!title || title.length > 140 || (retryKey !== null && (typeof retryKey !== "string" || !retryKeyPattern.test(retryKey)))) {
    throw new RangeError("Provide a title up to 140 characters and a valid idempotency key.");
  }
  const tasks = verifyTasks(args.tasks);
  const hash = await digest(JSON.stringify([title,tasks]));
  const id = crypto.randomUUID(), ids = new Map(tasks.map(row => [row.key,crypto.randomUUID()]));
  const rows = JSON.stringify(tasks.map((row,pos)=>({ ...row,id:ids.get(row.key),pos,path:"generated-builds/"+id+"/"+row.key+".mjs" })));
  const deps = JSON.stringify(tasks.flatMap(row => row.depends_on.map(dep => ({ job:ids.get(row.key),needs:ids.get(dep) }))));
  await env.DB.batch([
    env.DB.prepare("INSERT INTO build_plans VALUES(?,?,?,?,?) ON CONFLICT(idempotency_key) DO NOTHING").bind(id,retryKey,hash,title,now),
    env.DB.prepare(`INSERT INTO build_queue(id,request_hash,task_prompt,file_path,kind,status,publish,next_at,created_at)
      SELECT value->>'id',?,value->>'prompt',value->>'path',value->>'kind','pending',value->>'publish',?,?
      FROM json_each(?) WHERE EXISTS(SELECT 1 FROM build_plans WHERE id=?)`).bind(hash,now,now,rows,id),
    env.DB.prepare(`INSERT INTO build_job_meta(job_id,plan_id,task_key,position)
      SELECT value->>'id',?,value->>'key',value->>'pos' FROM json_each(?) WHERE EXISTS(SELECT 1 FROM build_plans WHERE id=?)`).bind(id,rows,id),
    env.DB.prepare(`INSERT INTO build_dependencies(job_id,needs_id)
      SELECT value->>'job',value->>'needs' FROM json_each(?) WHERE EXISTS(SELECT 1 FROM build_plans WHERE id=?)`).bind(deps,id),
  ]);
  const plan = retryKey === null ? await env.DB.prepare("SELECT id,request_hash FROM build_plans WHERE id=?").bind(id).first() :
    await env.DB.prepare("SELECT id,request_hash FROM build_plans WHERE idempotency_key=?").bind(retryKey).first();
  if (!plan || plan.request_hash !== hash) throw new RangeError("That idempotency key already belongs to another plan.");
  return { id:plan.id,title,task_count:tasks.length };
}

export async function planStatus(env,id) {
  validId(id);
  const plan = await env.DB.prepare("SELECT id,title,created_at FROM build_plans WHERE id=?").bind(id).first();
  if (!plan) throw new RangeError("Build plan not found.");
  const [jobs,deps] = await env.DB.batch([
    env.DB.prepare("SELECT * FROM build_job_state WHERE plan_id=? ORDER BY position").bind(id),
    env.DB.prepare(`SELECT d.job_id,m.task_key FROM build_dependencies d JOIN build_job_meta m ON m.job_id=d.needs_id
      JOIN build_job_meta j ON j.job_id=d.job_id WHERE j.plan_id=? ORDER BY m.position`).bind(id),
  ]);
  return { ...plan,tasks:jobs.results.map(job=>({ ...job,depends_on:deps.results.filter(d=>d.job_id===job.id).map(d=>d.task_key) })) };
}

export async function listJobs(env,args) {
  const limit = args.limit ?? 20, page = args.page ?? 0, status = args.status ?? null;
  if (!Number.isInteger(limit) || limit<1 || limit>50 || !Number.isInteger(page) || page<0 || page>1000 ||
      (status !== null && !statuses.includes(status))) throw new RangeError("Invalid status or page.");
  return { jobs:(await env.DB.prepare("SELECT * FROM build_job_state WHERE (? IS NULL OR status=?) ORDER BY created_at DESC,id LIMIT ? OFFSET ?")
    .bind(status,status,limit,page*limit).all()).results,page };
}

export async function history(env,id) {
  return { events:(await env.DB.prepare("SELECT event,detail,when_at FROM build_events WHERE job_id=? ORDER BY seq DESC LIMIT 100")
    .bind(validId(id)).all()).results };
}

export async function cancelJob(env,id,now=Date.now()) {
  validId(id);
  const existing = await env.DB.prepare("SELECT status FROM build_job_state WHERE id=?").bind(id).first();
  if (existing?.status === "cancelled") return {id,status:"cancelled"};
  const statement = await env.DB.prepare(`INSERT INTO build_job_meta(job_id,cancelled_at)
    SELECT q.id,? FROM build_queue q WHERE q.id=? AND q.status='pending'
    ON CONFLICT(job_id) DO UPDATE SET cancelled_at=excluded.cancelled_at
    WHERE build_job_meta.cancelled_at IS NULL`).bind(now,id).run();
  if (!statement.meta.changes) throw new RangeError("Only queued jobs can be cancelled.");
  return { id,status:"cancelled" };
}

export async function retryJob(env,id,now=Date.now()) {
  validId(id);
  const row = await env.DB.prepare("SELECT status FROM build_job_state WHERE id=?").bind(id).first();
  if (row?.status === "cancelled") {
    const restored = await env.DB.prepare("UPDATE build_job_meta SET cancelled_at=NULL WHERE job_id=? AND cancelled_at IS NOT NULL RETURNING job_id").bind(id).first();
    if (!restored) throw new RangeError("Job state changed.");
  } else {
    const changed = await env.DB.prepare(`UPDATE build_queue SET status='pending',attempts=0,next_at=?,lease_owner=NULL,
      lease_until=NULL,finished_at=NULL,last_error=NULL WHERE id=? AND status='failed' RETURNING id`).bind(now,id).first();
    if (!changed) throw new RangeError("A failed or cancelled job is required.");
  }
  const current = await env.DB.prepare("SELECT status FROM build_job_state WHERE id=?").bind(id).first();
  return { id,status:current.status };
}

export async function setPaused(env,value,now=Date.now()) {
  if (typeof value !== "boolean") throw new RangeError("Set paused to true or false.");
  await env.DB.prepare("UPDATE build_control SET paused=?,updated_at=? WHERE singleton=1").bind(Number(value),now).run();
  return { paused:value };
}

export async function dependencyArtifacts(env,id) {
  return (await env.DB.prepare(`SELECT q.file_path,q.code_output,q.status FROM build_dependencies d
    JOIN build_queue q ON q.id=d.needs_id WHERE d.job_id=? ORDER BY q.file_path`).bind(id).all()).results;
}
