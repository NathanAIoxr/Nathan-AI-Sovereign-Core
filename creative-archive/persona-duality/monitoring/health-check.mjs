/** PD-011: read-only public Cloudflare runtime health and receipt verifier. */
export const DEFAULT_ORIGIN = "https://tabor-persona-duality.nathantaboract.workers.dev";
export const MAX_RECEIPT_AGE_MS = 45 * 60 * 1000;
export const TIMEOUT_MS = 8000;
export function assess(health, receiptEnvelope, now=Date.now()) {
  const checks=[];
  const check=(name,ok,detail)=>checks.push({name,ok:Boolean(ok),detail});
  check("health.ok",health?.ok===true,"Worker reports healthy");
  check("health.storage_bound",health?.storage_bound===true,"KV binding reported by runtime");
  check("health.read_only",health?.dispatch===false,"No automatic external dispatch");
  check("health.graph_counts",Number.isInteger(health?.nodes)&&health.nodes>=31&&Number.isInteger(health?.edges)&&health.edges>=38,"At least original graph baseline preserved");
  const receipt=receiptEnvelope?.latest;
  check("receipt.exists",Boolean(receipt),"A real scheduled receipt must exist");
  check("receipt.service",receipt?.service==="tabor-persona-duality","Receipt belongs to correct service");
  const timestamp=Date.parse(receipt?.scheduled_at??"");
  const age=now-timestamp;
  check("receipt.fresh",Number.isFinite(timestamp)&&age>=-60000&&age<=MAX_RECEIPT_AGE_MS,Number.isFinite(age)?("Receipt age "+Math.round(age/60000)+" minutes"):"Missing or invalid timestamp");
  check("receipt.not_executed",receipt?.result==="queued_for_review_not_executed"&&receipt?.external_dispatch===false&&receipt?.mutations_to_other_services===0,"Review rotation is not completed development");
  check("receipt.task_ids",Array.isArray(receipt?.task_ids)&&receipt.task_ids.length===3&&receipt.task_ids.every(id=>/^PD-0(?:0[1-9]|1[0-4])$/.test(id)),"Exactly three valid review IDs");
  return {service:"tabor-persona-duality",check_time:new Date(now).toISOString(),status:checks.every(c=>c.ok)?"healthy":"degraded",checks,receipt_summary:receipt?{scheduled_at:receipt.scheduled_at,task_ids:receipt.task_ids,result:receipt.result}:null,meaning:"Read-only monitoring; queued tasks are not completed tasks."};
}
export async function probe({fetcher=fetch,now=Date.now(),origin=DEFAULT_ORIGIN}={}){
  if(origin!==DEFAULT_ORIGIN) throw new Error("Origin is pinned to the owned Persona Atlas host");
  async function read(path){
    const controller=new AbortController();
    const timer=setTimeout(()=>controller.abort(),TIMEOUT_MS);
    try {
      const response=await fetcher(origin+path,{method:"GET",headers:{accept:"application/json"},redirect:"error",signal:controller.signal});
      if(!response.ok) throw new Error(path+" HTTP "+response.status);
      const contentType=response.headers?.get?.("content-type")||"";
      if(!contentType.toLowerCase().includes("application/json")) throw new Error(path+" unexpected content type");
      return await response.json();
    } finally {clearTimeout(timer);}
  }
  const [health,receipts]=await Promise.all([read("/api/health"),read("/api/receipts")]);
  return assess(health,receipts,now);
}
if(process.argv[1] && import.meta.url===new URL("file://"+process.argv[1]).href){
  probe().then(report=>{console.log(JSON.stringify(report,null,2));process.exitCode=report.status==="healthy"?0:1;}).catch(error=>{
    console.error(JSON.stringify({service:"tabor-persona-duality",status:"unreachable",error:String(error.message),meaning:"No claim of task completion."}));
    process.exitCode=1;
  });
}
