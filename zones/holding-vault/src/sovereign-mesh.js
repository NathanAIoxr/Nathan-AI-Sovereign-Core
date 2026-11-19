// Shared primitives for authorized deployments. No external self-enrollment or arbitrary code execution.
const encoder=new TextEncoder();
export async function sha256(value){const data=typeof value==='string'?encoder.encode(value):value;const digest=await crypto.subtle.digest('SHA-256',data);return Array.from(new Uint8Array(digest),x=>x.toString(16).padStart(2,'0')).join('');}
export async function appendEvent(db,{eventId,projectId,eventType,payload,source}) {
 const serialized=JSON.stringify(payload);
 const hash=await sha256(serialized);
 const previous=await db.prepare('SELECT payload_sha256 FROM sovereign_events_v1 WHERE project_id=? ORDER BY created_at DESC,event_id DESC LIMIT 1').bind(projectId).first();
 await db.prepare('INSERT INTO sovereign_events_v1(event_id,project_id,event_type,payload_sha256,previous_sha256,source) VALUES(?,?,?,?,?,?)').bind(eventId,projectId,eventType,hash,previous?.payload_sha256??null,source).run();
 return {eventId,hash,previousHash:previous?.payload_sha256??null};
}
export async function claimApprovedJob(db,jobId){
 const update=await db.prepare("UPDATE sovereign_dispatch_v1 SET status='claimed',claimed_at=CURRENT_TIMESTAMP WHERE job_id=? AND status='queued' AND approved=1").bind(jobId).run();
 if(!update.meta?.changes)return null;
 return db.prepare('SELECT job_id,project_id,job_kind,payload_json FROM sovereign_dispatch_v1 WHERE job_id=?').bind(jobId).first();
}
export async function recordTelemetry(db,{receiptId,nodeId,projectId,metrics,verifiedIdentity=false}){
 await db.prepare('INSERT INTO sovereign_node_telemetry_v1(receipt_id,node_id,project_id,metrics_json,verified_identity) VALUES(?,?,?,?,?)').bind(receiptId,nodeId,projectId,JSON.stringify(metrics),verifiedIdentity?1:0).run();
}
