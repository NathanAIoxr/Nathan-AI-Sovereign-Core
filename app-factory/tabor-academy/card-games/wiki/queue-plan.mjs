import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';

const hash = (s) => createHash('sha256').update(s).digest('hex');
function id(label) {
  const s = hash(label);
  return s.slice(0,8) + '-' + s.slice(8,12) + '-4' + s.slice(13,16) + '-8' + s.slice(17,20) + '-' + s.slice(20,32);
}
export function queuePlan(plan, now = Date.now()) {
  const token = /^[a-z][a-z0-9-]{0,99}$/;
  if (!token.test(plan.key) || !Array.isArray(plan.tasks) || plan.tasks.length < 1 || plan.tasks.length > 8) throw Error('Invalid card build plan');
  const tasks = plan.tasks;
  const ids = new Map(tasks.map(({key}) => [key,id(plan.key + ':' + key)]));
  if (ids.size !== tasks.length) throw Error('Duplicate build task');
  const planId = id(plan.key);
  const digest = hash(JSON.stringify([plan.title,tasks]));
  const batch = [{ sql:'INSERT INTO build_plans(id,idempotency_key,request_hash,title,created_at) VALUES(?,?,?,?,?) ON CONFLICT DO NOTHING',params:[planId,plan.key,digest,plan.title,String(now)] }];
  for (const [position,task] of tasks.entries()) {
    if (!token.test(task.key) || task.kind !== 'module' || task.publish !== 0 || task.prompt.length > 4000 ||
      !Array.isArray(task.depends_on) || task.depends_on.some((key) => !tasks.slice(0,position).some((v) => v.key === key))) {
      throw Error('Invalid draft task: ' + task.key);
    }
    const job = ids.get(task.key);
    batch.push({
      sql:`INSERT INTO build_queue(id,request_hash,task_prompt,file_path,kind,status,publish,next_at,created_at)
        SELECT ?,?,?,?,'module','pending',0,?,? WHERE EXISTS
        (SELECT 1 FROM build_plans WHERE id=? AND request_hash=?) ON CONFLICT DO NOTHING`,
      params:[job,digest,task.prompt,'generated-builds/' + planId + '/' + task.key + '.mjs',String(now),String(now),planId,digest],
    },{
      sql:`INSERT INTO build_job_meta(job_id,plan_id,task_key,position)
        SELECT ?,?,?,? WHERE EXISTS (SELECT 1 FROM build_queue WHERE id=? AND request_hash=?) ON CONFLICT DO NOTHING`,
      params:[job,planId,task.key,String(position),job,digest],
    });
    for (const key of task.depends_on) batch.push({
      sql:`INSERT INTO build_dependencies(job_id,needs_id)
        SELECT ?,? WHERE EXISTS (SELECT 1 FROM build_queue WHERE id=? AND request_hash=?) ON CONFLICT DO NOTHING`,
      params:[job,ids.get(key),job,digest],
    });
  }
  return {planId,digest,taskIds:Object.fromEntries(ids),batch};
}

if (process.argv.includes('--sql-json')) {
  const plan = JSON.parse(await readFile(new URL('./draft-plan.json',import.meta.url),'utf8'));
  console.log(JSON.stringify(queuePlan(plan)));
}
