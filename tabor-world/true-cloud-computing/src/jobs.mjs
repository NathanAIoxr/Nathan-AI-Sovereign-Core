import { canonical,sha256,toHex } from "./proofs.mjs";

export const jobKinds=["inventory-audit","genesis-selftest","telemetry-check"];
export const summarySql=`SELECT (SELECT COUNT(*) FROM true_cloud_jobs) total_jobs,
  (SELECT COUNT(*) FROM true_cloud_jobs WHERE status='completed') completed_jobs,
  (SELECT COUNT(*) FROM tabor_compute_fleet) registered_compute_nodes,
  (SELECT COUNT(*) FROM tabor_restoration_inventory) restoration_inventory`;

async function genesis() {
  const hex="01000000"+"00".repeat(32)+
    "3ba3edfd7a7b12b27ac72c3e67768f617fc81bc3888a51323a9fb8aa4b1e5e4a"+
    "29ab5f49"+"ffff001d"+"1dac2b7c";
  const header=Uint8Array.from(hex.match(/../g),byte=>parseInt(byte,16));
  const first=await crypto.subtle.digest("SHA-256",header);
  const hash=toHex(new Uint8Array(await crypto.subtle.digest("SHA-256",first)).reverse());
  return {hash,pass:hash==="000000000019d6689c085ae165831e934ff763ae46a2a6c172b3f1b60a8ce26f"};
}

export function inspect(kind,db) {
  if (kind==="genesis-selftest") return genesis();
  const sql=kind==="inventory-audit"? `SELECT (SELECT COUNT(*) FROM tabor_agent_assignments) agents,
    (SELECT COUNT(*) FROM tabor_coin_federation) coins,(SELECT COUNT(*) FROM tabor_restoration_inventory) restoration_entries,
    (SELECT COUNT(*) FROM tabor_compute_fleet) connected_compute_nodes` :
    `SELECT (SELECT COUNT(*) FROM nathan_supercomputer_telemetry_log) telemetry_records,
    (SELECT COUNT(*) FROM tabor_compute_heartbeats) heartbeat_records`;
  return db.prepare(sql).first();
}

export async function submit(db,id,kind) {
  const row=await db.prepare(`INSERT INTO true_cloud_jobs(id,kind,status) VALUES(?,?,'queued')
    ON CONFLICT(id) DO NOTHING RETURNING id,status,kind`).bind(id,kind).first();
  return row ?? db.prepare("SELECT id,status,kind FROM true_cloud_jobs WHERE id=?").bind(id).first();
}

async function complete(db,claim,job,status,result) {
  const body=canonical({version:1,id:job.id,kind:job.kind,status,attempt:claim.attempts,completed_at:new Date().toISOString(),result});
  const hash=await sha256(body);
  const owned=`SELECT 1 FROM true_cloud_job_claims WHERE job_id=? AND token=? AND expires_ms>?`;
  const now=Date.now();
  const [receipt]=await db.batch([
    db.prepare(`INSERT INTO true_cloud_receipts(job_id,body,sha256)
      SELECT ?,?,? WHERE EXISTS(${owned}) ON CONFLICT(job_id) DO NOTHING`)
      .bind(job.id,body,hash,job.id,claim.token,now),
    db.prepare(`UPDATE true_cloud_jobs SET status=?,completed_at=CURRENT_TIMESTAMP,result_json=?
      WHERE id=? AND status='running' AND EXISTS(${owned})`)
      .bind(status,canonical(result),job.id,job.id,claim.token,now)
  ]);
  return receipt.meta.changes ? {id:job.id,status,sha256:hash,result} : {id:job.id,state:"lease_expired"};
}

export async function runNext(db,now=Date.now()) {
  const token=crypto.randomUUID();
  const [,claim,job]=await db.batch([
    db.prepare(`UPDATE true_cloud_jobs SET status='failed', completed_at=CURRENT_TIMESTAMP,
      result_json='{"error":"Lease expired after three attempts"}'
      WHERE status='running' AND EXISTS(SELECT 1 FROM true_cloud_job_claims c
        WHERE c.job_id=true_cloud_jobs.id AND c.attempts>=3 AND c.expires_ms<=?)`).bind(now),
    db.prepare(`INSERT INTO true_cloud_job_claims(job_id,token,expires_ms,attempts)
      SELECT j.id,?,?,1 FROM true_cloud_jobs j LEFT JOIN true_cloud_job_claims c ON c.job_id=j.id
      WHERE j.status IN ('queued','running') AND (c.job_id IS NULL OR (c.expires_ms<=? AND c.attempts<3))
      ORDER BY j.created_at,j.id LIMIT 1
      ON CONFLICT(job_id) DO UPDATE SET token=excluded.token,expires_ms=excluded.expires_ms,attempts=true_cloud_job_claims.attempts+1
      RETURNING token,attempts`).bind(token,now+90000,now),
    db.prepare(`UPDATE true_cloud_jobs SET status='running',started_at=CURRENT_TIMESTAMP
      WHERE id=(SELECT job_id FROM true_cloud_job_claims WHERE token=?) RETURNING id,kind`).bind(token)
  ]);
  const lease=claim.results[0],task=job.results[0];
  if(!lease||!task) return {state:"idle"};
  try {
    const result=await inspect(task.kind,db);
    return await complete(db,lease,task,result.pass===false?"failed":"completed",result);
  } catch(error) {
    console.error("task failed",task.kind,error.name);
    if (lease.attempts>=3) return complete(db,lease,task,"failed",{error:"Audit failed after three attempts"});
    await db.prepare("UPDATE true_cloud_job_claims SET expires_ms=? WHERE job_id=? AND token=?").bind(Date.now()+30000,task.id,lease.token).run();
    return {id:task.id,state:"retry_wait"};
  }
}

export async function runScheduled(db,time) {
  const slot=new Date(time).toISOString().slice(0,16);
  await db.batch(jobKinds.map(kind=>db.prepare(`INSERT OR IGNORE INTO true_cloud_jobs(id,kind,status)
    VALUES(?,?,'queued')`).bind("cron-"+slot+"-"+kind,kind)));
  for (const _kind of jobKinds) await runNext(db);
}
