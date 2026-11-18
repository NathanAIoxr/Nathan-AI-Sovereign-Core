import {DurableObject,WorkflowEntrypoint,type WorkflowEvent,type WorkflowStep} from "cloudflare:workers";
import {runPlan} from "../../../agent-core/dag.ts";
import {hex,sha,utf8} from "../../../shared/core.ts";

export interface Job {kind:"verify-fixtures";id:string}
export interface RuntimeBindings {
  GRAPH: D1Database; OS_KV: KVNamespace; OS_BLOBS: R2Bucket;
  OS_QUEUE: Queue<Job>;
  STATE_COORDINATOR: DurableObjectNamespace<StateCoordinatorDO>;
  BATCH: Workflow<Job>;
}
const plan=[
  {id:"boolean",syscall:"OG-017"},
  {id:"dsp",syscall:"017",after:["boolean"]},
  {id:"integrity",syscall:"004",after:["dsp"]},
  {id:"graph",syscall:"071",after:["integrity"]}
];
export class StateCoordinatorDO extends DurableObject<RuntimeBindings> {
  async fetch(request:Request):Promise<Response>{
    if(request.method==="POST"){const data=await request.json();await this.ctx.storage.put("receipt",data);return Response.json({stored:true});}
    const data=await this.ctx.storage.get("receipt");
    return data===undefined?Response.json({state:"pending"},{status:404}):Response.json(data);
  }
}
export class BatchWorkflow extends WorkflowEntrypoint<RuntimeBindings,Job> {
  async run(event:WorkflowEvent<Job>,step:WorkflowStep) {
    const id=event.payload.id;
    const results=await step.do("execute fixed fixture plan",async()=>{
      const payload=await runPlan(plan,{GRAPH:this.env.GRAPH});
      return {serialized:JSON.stringify(payload),order:payload.order};
    });
    return step.do("archive content and store receipt",async()=>{
      const serialized=results.serialized,digest=hex(await sha(utf8(serialized))),key="receipts/"+digest+".json";
      await this.env.OS_BLOBS.put(key,serialized,{httpMetadata:{contentType:"application/json"}});
      const receipt={job:id,state:"complete",steps:results.order,sha256:digest,object:key};
      const obj=this.env.STATE_COORDINATOR.get(this.env.STATE_COORDINATOR.idFromName(id));
      const saved=await obj.fetch("https://coordinator.internal",{method:"POST",body:JSON.stringify(receipt)});
      if(!saved.ok)throw new Error("Receipt could not be stored");
      return receipt;
    });
  }
}
export async function consume(batch:MessageBatch<Job>,env:RuntimeBindings){
  for(const message of batch.messages){
    const job=message.body;
    if(!job||job.kind!=="verify-fixtures"||job.id!=="digital-edge-acceptance-v1"){message.ack();continue;}
    try {await env.BATCH.create({id:job.id,params:job});message.ack();}
    catch {
      try {await (await env.BATCH.get(job.id)).status();message.ack();}
      catch {message.retry();}
    }
  }
}
