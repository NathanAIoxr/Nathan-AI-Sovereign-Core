import current from "../worker.js";
import {fleetRoute,oneReplica} from "./release.mjs";
export * from "../worker.js";

export default {
  ...current,
  fetch(request,env,ctx) {
    const {pathname}=new URL(request.url);
    if (pathname!=="/fleet"&&!pathname.startsWith("/fleet/")) return current.fetch(request,env,ctx);
    return fleetRoute(request,"one","/fleet",pathname.slice(6)||"/","one_d1",()=>oneReplica(env.DB),env);
  },
};
