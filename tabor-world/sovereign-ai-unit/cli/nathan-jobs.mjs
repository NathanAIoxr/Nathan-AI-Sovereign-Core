#!/usr/bin/env node
// NATHAN AI CLI — requires NATHAN_API_URL and NATHAN_API_TOKEN.
const [,,command,...args]=process.argv;
const base=process.env.NATHAN_API_URL?.replace(/\/$/,""),token=process.env.NATHAN_API_TOKEN,project=process.env.NATHAN_PROJECT_ID||"default";
if(!base||!token){console.error("Set NATHAN_API_URL and NATHAN_API_TOKEN");process.exit(2)}
const usage=()=>{console.log("Usage: nathan-jobs.mjs submit <prompt> [budget-usd] | list | inspect <id> | cancel <id> | artifact <id> | capacity | health");process.exit(2)};
let method="GET",path="/health",body;
switch(command){
 case "submit":if(!args[0])usage();path="/v1/jobs";method="POST";body={input:args[0],workload:"inference",max_cost_usd:Number(args[1]??"1")};break;
 case "list":path="/v1/jobs";break;
 case "inspect":if(!args[0])usage();path="/v1/jobs/"+encodeURIComponent(args[0]);break;
 case "cancel":if(!args[0])usage();path="/v1/jobs/"+encodeURIComponent(args[0])+"/cancel";method="POST";body={};break;
 case "artifact":if(!args[0])usage();path="/v1/jobs/"+encodeURIComponent(args[0])+"/artifact";break;
 case "capacity":path="/v1/capacity";break;
 case "health":break;
 default:usage();
}
const headers={"authorization":"Bearer "+token,"x-project-id":project};
if(method==="POST"){headers["content-type"]="application/json";headers["idempotency-key"]=process.env.NATHAN_IDEMPOTENCY_KEY||crypto.randomUUID()}
const start=performance.now();
const r=await fetch(base+path,{method,headers,body:body?JSON.stringify(body):undefined});
console.log(await r.text());
console.error(JSON.stringify({httpStatus:r.status,elapsedMs:Math.round(performance.now()-start)}));
if(!r.ok)process.exitCode=1;
