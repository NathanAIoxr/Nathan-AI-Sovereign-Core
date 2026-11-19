// Administrative controls: integrate behind authenticated Access or equivalent identity verification.
export async function conductorStatus(db) {
 const control=await db.prepare("SELECT paused,max_claims_per_cycle,updated_at FROM conductor_control_v1 WHERE scope='global'").first();
 const pending=await db.prepare("SELECT COUNT(*) n FROM sovereign_dispatch_v1 WHERE status='queued'").first();
 return {paused:control?.paused!==0,maxClaimsPerCycle:control?.max_claims_per_cycle??10,queued:pending?.n??0};
}
export async function setPause(db,{paused,actor}) {
 if(typeof paused!=='boolean'||typeof actor!=='string'||!actor.trim())throw new Error('Invalid control request');
 await db.prepare("UPDATE conductor_control_v1 SET paused=?,updated_at=CURRENT_TIMESTAMP WHERE scope='global'").bind(paused?1:0).run();
 await db.prepare("INSERT INTO conductor_audit_v1(audit_id,actor,action,details_json) VALUES(?,?,?,?)").bind(crypto.randomUUID(),actor,paused?'pause':'resume',JSON.stringify({paused})).run();
 return {paused};
}
export async function approveJob(db,{jobId,actor}) {
 if(!/^[0-9a-f-]{36}$/.test(jobId)||!actor?.trim())throw new Error('Invalid approval');
 const result=await db.prepare("UPDATE sovereign_dispatch_v1 SET approved=1 WHERE job_id=? AND approved=0 AND status='queued'").bind(jobId).run();
 if(!result.meta?.changes)return {approved:false};
 await db.prepare("INSERT INTO conductor_audit_v1(audit_id,actor,action,job_id) VALUES(?,?,?,?)").bind(crypto.randomUUID(),actor,'approve',jobId).run();
 return {approved:true};
}
