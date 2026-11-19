// Stille Nacht score is a symbolic state machine, not a wall-clock scheduler or audio renderer.
export const SCORE_ID='stille-nacht-6-8-72';
export const STAGES=Object.freeze(['initialize','provision','commit','deploy','provenance','verify']);
export function position(measure,beat=1,subdivision=1){
 if(!Number.isInteger(measure)||measure<1||measure>72||![1,2].includes(beat)||![1,2,3].includes(subdivision))throw new RangeError('Invalid 6/8 score position');
 const stanza=Math.floor((measure-1)/12)+1;
 const localMeasure=(measure-1)%12+1;
 return {measure,stanza,localMeasure,phrase:Math.floor((localMeasure-1)/4)+1,beat,subdivision,stage:STAGES[stanza-1],baton:beat===1?'down':'up',phraseCutoff:localMeasure%4===0&&beat===2&&subdivision===3};
}
export async function advanceVerifiedMeasure(db,runId,receipt){
 const run=await db.prepare('SELECT * FROM conductor_score_runs_v1 WHERE run_id=?').bind(runId).first();
 if(!run||run.state!=='running')return {advanced:false,reason:'not_running'};
 const stop=await db.prepare("SELECT paused FROM conductor_control_v1 WHERE scope='global'").first();
 if(!stop||stop.paused!==0||run.approval_required!==0)return {advanced:false,reason:'paused_or_unapproved'};
 if(!receipt||receipt.verified!==true||receipt.measure!==run.measure)return {advanced:false,reason:'missing_verified_receipt'};
 const stage=position(run.measure).stage;
 await db.prepare('INSERT OR IGNORE INTO conductor_score_receipts_v1(run_id,measure,stage,receipt_json,verified) VALUES(?,?,?,?,1)').bind(runId,run.measure,stage,JSON.stringify(receipt)).run();
 const result=await db.prepare("UPDATE conductor_score_runs_v1 SET measure=CASE WHEN measure<72 THEN measure+1 ELSE measure END,stanza=CASE WHEN measure<72 THEN CAST(measure/12 AS INTEGER)+1 ELSE 6 END,state=CASE WHEN measure=72 THEN 'completed' ELSE 'waiting' END,updated_at=CURRENT_TIMESTAMP WHERE run_id=? AND measure=? AND state='running'").bind(runId,run.measure).run();
 return {advanced:!!result.meta?.changes,nextMeasure:run.measure===72?null:run.measure+1,state:run.measure===72?'completed':'waiting'};
}
