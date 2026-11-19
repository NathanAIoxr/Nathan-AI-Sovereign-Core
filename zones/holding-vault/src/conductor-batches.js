// Incremental bounded batch claiming for authorized catalog work.
export async function claimBatchItems(db,batchId,limit=100){
 const cap=Math.min(500,Math.max(1,Math.trunc(limit)));
 const batch=await db.prepare("SELECT batch_id,status FROM sovereign_conductor_batches_v1 WHERE batch_id=?").bind(batchId).first();
 if(!batch||!['queued','running'].includes(batch.status))return {claimed:[],state:'unavailable'};
 const rows=await db.prepare("SELECT item_id FROM sovereign_conductor_batch_items_v1 WHERE batch_id=? AND state='queued' ORDER BY item_id LIMIT ?").bind(batchId,cap).all();
 const claimed=[];
 for(const row of rows.results){
  const result=await db.prepare("UPDATE sovereign_conductor_batch_items_v1 SET state='claimed' WHERE batch_id=? AND item_id=? AND state='queued'").bind(batchId,row.item_id).run();
  if(result.meta?.changes)claimed.push(row.item_id);
 }
 if(claimed.length)await db.prepare("UPDATE sovereign_conductor_batches_v1 SET status='running',updated_at=CURRENT_TIMESTAMP WHERE batch_id=? AND status IN ('queued','running')").bind(batchId).run();
 return {claimed,state:'running',executed:0};
}
