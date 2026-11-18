import { readFile,writeFile } from "node:fs/promises";
import { MODEL,sha256 } from "../protocol.mjs";
import { api,artifact,submit,wait,origin } from "./client.mjs";
const [file,parallelRaw="1",label="fresh-baseline",cacheMode="fresh"]=process.argv.slice(2);
const parallel=Number(parallelRaw);
if (!file || !Number.isInteger(parallel) || parallel<1 || parallel>4 || !["fresh","verified"].includes(cacheMode)) throw Error("Usage: node tools/benchmark.mjs output.json [1-4] [label] [fresh|verified]");
const datasetRaw=await readFile(new URL("benchmark-dataset.json",import.meta.url),"utf8");
const dataset=JSON.parse(datasetRaw);
const info=await (await api("/status",{auth:false})).json();
const pool=info.pools.find(x=>x.id==="workers-ai-bge");
const runId=crypto.randomUUID();
const started=Date.now(),raw=[];
const cosine=(a,b)=>a.reduce((acc,x,i)=>acc+x*b[i],0)/Math.sqrt(a.reduce((acc,x)=>acc+x*x,0)*b.reduce((acc,x)=>acc+x*x,0));
async function measure(item) {
  const begin=Date.now();
  let job=null;
  try {
    job=(await submit({kind:"batch-embedding",texts:[item.query,...item.candidates],benchmark:true,budgetMicro:300,cacheMode,
      region:"provider-managed",deadlineSeconds:dataset.acceptance.maxLatencyMs/1000,retentionSeconds:3600},
      "bench-"+runId+"-"+item.id)).job;
    if(!["succeeded","failed","cancelled","cleared"].includes(job.state)) job=await wait(job.id,180);
    if(job.state!=="succeeded") throw Error(job.error??job.state);
    const result=await artifact(job.id);
    const scores=item.candidates.map((_,i)=>cosine(result.data[0],result.data[i+1]));
    const found=scores.indexOf(Math.max(...scores));
    const latency=job.finished-job.created;
    return {case:item.id,id:job.id,latencyMs:latency,observedMs:Date.now()-begin,
      backendMs:job.slices.reduce((t,s)=>t+s.backendMs,0),queueWaitMs:job.started===null?0:job.started-job.created,estimatedMicros:job.spentEstimateMicro,
      accepted:latency<=dataset.acceptance.maxLatencyMs && found===item.expected,expected:item.expected,found,scores,
      inputSha256:job.inputSha256,resultSha256:result.hash,backend:job.backend,slices:job.slices,cache:job.backend==="verified-cache"?"hit":"fresh"};
  } catch(error) {
    return {case:item.id,id:job?.id??null,accepted:false,error:error.message,estimatedMicros:job?.spentEstimateMicro??null,observedMs:Date.now()-begin};
  }
}
for(let i=0;i<dataset.cases.length;i+=parallel) raw.push(...await Promise.all(dataset.cases.slice(i,i+parallel).map(measure)));
const finished=Date.now();
const accepted=raw.filter(r=>r.accepted).length;
const ms=raw.flatMap(x=>Number.isFinite(x.latencyMs)?[x.latencyMs]:[]).sort((a,b)=>a-b);
const estimated=raw.every(r=>Number.isInteger(r.estimatedMicros))?raw.reduce((n,r)=>n+r.estimatedMicros,0):null;
const report = {
  runId,revision:info.revision,model:MODEL,dataset:{name:dataset.name,sha256:await sha256(datasetRaw)},hardware:pool?.deviceType??null,
  devices:pool?.deviceCount??null,precision:pool?.precision??null,interconnect:pool?.interconnect??null,
  load:{concurrency:parallel,requests:raw.length,cacheMode,label},time:{start:new Date(started).toISOString(),end:new Date(finished).toISOString(),durationMs:finished-started},
  criteria:{...dataset.acceptance,quality:dataset.quality},latencyUnit:"Job creation to durable artifact commit",
  summary:{accepted,total:raw.length,failed:raw.length-accepted,top1:raw.filter(r=>r.found!==undefined&&r.found===r.expected).length/raw.length,
    cacheHits:raw.filter(r=>r.cache==="hit").length,p95LatencyMs:ms[Math.ceil(ms.length*.95)-1]??null,acceptedPerSecond:1000*accepted/Math.max(1,finished-started),
    acceptedPerHour:3600000*accepted/Math.max(1,finished-started),timeToFirstTokenMs:null,errorRate:raw.filter(r=>r.error).length/raw.length,
    estimatedMicros:estimated,estimatedMicrosPerAccepted:accepted&&estimated!==null?estimated/accepted:null,actualSpend:null},
  costBasis:pool?.rateBasis??null,raw,
  benchmarkClaim:"Baseline only. Equal-spend 2X+ requires a second comparable run with reconciled billing.",
  reproduce:{endpoint:origin,command:"node tools/benchmark.mjs output.json "+parallel+" "+label+" "+cacheMode}
};
await writeFile(file,JSON.stringify(report,null,2)+"\n",{flag:"wx"});
console.log(JSON.stringify({file,runId,summary:report.summary}));
if(report.summary.top1<dataset.acceptance.minimumTop1 || accepted!==raw.length) process.exitCode=1;
