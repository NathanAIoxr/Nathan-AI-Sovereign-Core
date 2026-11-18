import wasm from "./thermal.wasm";
import {BatchWorkflow,StateCoordinatorDO,consume,type Job,type RuntimeBindings} from "../../async-job-scheduler/src/batch.ts";
import {router} from "./router.ts";

export {BatchWorkflow,StateCoordinatorDO};
const heatCell=new WebAssembly.Instance(wasm).exports.heat_cell as (c:number,l:number,r:number,a:number)=>number;
export default {
  async fetch(request:Request,env:RuntimeBindings){
    if(request.method==="GET"&&new URL(request.url).pathname==="/api/batch-proof"){
      const object=env.STATE_COORDINATOR.get(env.STATE_COORDINATOR.idFromName("digital-edge-acceptance-v1"));
      const state=await object.fetch("https://coordinator.internal/");
      const data=await state.json<Record<string,unknown>>();
      if(!state.ok)return Response.json(data,{status:state.status});
      const archive=typeof data.object==="string"?await env.OS_BLOBS.head(data.object):null;
      const policy=await env.OS_KV.get("runtime-policy");
      return Response.json({...data,r2ObjectPresent:Boolean(archive),policy});
    }
    return router(request,{GRAPH:env.GRAPH,heatCell});
  },
  queue(batch:MessageBatch<Job>,env:RuntimeBindings){return consume(batch,env);}
};
