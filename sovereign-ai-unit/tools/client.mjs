import { sha256 } from "../protocol.mjs";
export const origin = process.env.SOVEREIGN_URL ?? "https://sovereign-ai-unit.nathantaboract.workers.dev/platform";
export async function api(path,options={}) {
  const auth = options.auth===false ? {} : {
    authorization:"Bearer "+(process.env.SOVEREIGN_JOB_TOKEN??""),
    "x-sovereign-project":process.env.SOVEREIGN_PROJECT??""
  };
  const response=await fetch(origin+path,{...options,redirect:"error",headers:{...auth,...options.headers}});
  if (!response.ok) {
    const body=await response.json().catch(()=>({}));
    throw Object.assign(new Error(body.receipt?.reason??"HTTP "+response.status),{status:response.status,body});
  }
  return response;
}
export function submit(payload,key=crypto.randomUUID()) {
  return api("/jobs",{method:"POST",headers:{"content-type":"application/json","idempotency-key":key},body:JSON.stringify(payload)}).then(r=>r.json());
}
export async function artifact(id) {
  const response=await api("/jobs/"+id+"/artifact");
  const raw=await response.text();
  const hash=await sha256(raw);
  if(hash!==response.headers.get("x-artifact-sha256")) throw new Error("Artifact hash mismatch");
  return {raw,hash,data:JSON.parse(raw)};
}
export async function wait(id,seconds=240) {
  const deadline=Date.now()+seconds*1000;
  while(Date.now()<deadline) {
    const job=(await (await api("/jobs/"+id)).json()).job;
    if(!["queued","running"].includes(job.state)) return job;
    await new Promise(resolve=>setTimeout(resolve,6000));
  }
  throw new Error("Job did not complete within the wait window: "+id);
}
