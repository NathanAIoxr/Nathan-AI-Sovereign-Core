import current from "../worker.mjs";
import {SupercomputerNode as OriginalNode,nodeFetch} from "../worker.mjs";
import {fleetCount,isNodeId,nodeId} from "../fleet-tasks.mjs";
import {batchReceipts,failure,fleetRoute,localReplica,matchesSuffix,requestJson} from "./release.mjs";

export * from "../worker.mjs";

export class SupercomputerNode extends OriginalNode {
  async fetch(request) {
    const {pathname}=new URL(request.url);
    const match=/^\/([^/]+)\/fleet(\/.*)?$/.exec(pathname);
    if (!match) return super.fetch(request);
    const [,id,route]=match;
    if (!isNodeId(id)) return failure(request,"unknown_node",404);
    const identity=await super.fetch(new Request("https://node.internal/"+id));
    if (!identity.ok) return identity;
    await identity.body?.cancel();
    return fleetRoute(request,id,"/v1/nodes/"+id+"/fleet",route??"/","node_sqlite",()=>localReplica(this.sql),this.env);
  }
}

export default {
  ...current,
  async fetch(request,env,ctx) {
    const url=new URL(request.url);
    try {
      if (url.pathname==="/v1/fleet/receipts") {
        if (request.method!=="GET") return failure(request,"method_not_allowed",405);
        return batchReceipts(request,nodeId,id=>nodeFetch(env,id,"GET","/fleet/receipt"),fleetCount);
      }
      const match=/^\/v1\/nodes\/([^/]+)\/fleet(\/.*)?$/.exec(url.pathname);
      if (!match) return current.fetch(request,env,ctx);
      const [,id,route]=match;
      const suffix=route??"/";
      if (!isNodeId(id) || !matchesSuffix(suffix)) return failure(request,"fleet_route_not_found",404);
      if (!["GET","HEAD","POST"].includes(request.method)) return failure(request,"method_not_allowed",405);
      let body;
      if (request.method==="POST") {
        const parsed=await requestJson(request);
        if (parsed.error) return failure(request,parsed.error,parsed.status);
        body=JSON.stringify(parsed.payload);
      }
      return await nodeFetch(env,id,request.method,"/fleet"+suffix+url.search,body,
        body===undefined?undefined:{"content-type":"application/json"});
    } catch {
      return failure(request,"federation_fleet_unavailable",503);
    }
  },
};
