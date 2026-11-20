// PD-011: read-only evidence validator. Never schedules, dispatches or mutates.
export function classifyReceipt(receipt, {now=Date.now(), maxAgeMs=60*60*1000}={}) {
  if (!receipt || typeof receipt !== "object" || Array.isArray(receipt)) return {status:"missing",development_completed:false};
  const date=Date.parse(receipt.scheduled_at);
  const validIds=Array.isArray(receipt.task_ids) && receipt.task_ids.length<=3 &&
    receipt.task_ids.every(id=>typeof id==="string" && /^PD-0(?:0[1-9]|1[0-4])$/.test(id));
  const valid=receipt.service==="tabor-persona-duality" &&
    receipt.operation==="review_queue_rotation" &&
    receipt.result==="queued_for_review_not_executed" &&
    receipt.external_dispatch===false && receipt.mutations_to_other_services===0 &&
    Number.isFinite(date) && validIds;
  if (!valid) return {status:"invalid",development_completed:false};
  if (date>now+60000) return {status:"future_timestamp",development_completed:false};
  if (now-date>maxAgeMs) return {status:"stale",development_completed:false,scheduled_at:receipt.scheduled_at};
  return {status:"review_queued",development_completed:false,scheduled_at:receipt.scheduled_at,task_ids:[...receipt.task_ids]};
}
