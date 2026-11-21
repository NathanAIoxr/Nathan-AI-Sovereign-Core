#!/usr/bin/env node
// Read-only benchmark runner: repeats GET /health, writes raw receipt; no synthetic 2X claims.
import {createHash} from "node:crypto";
import {writeFile} from "node:fs/promises";
const url=process.env.NATHAN_API_URL?.replace(/\/$/,"");
if(!url)throw new Error("NATHAN_API_URL required");
const n=Math.min(100,Math.max(1,Number(process.argv[2]||10)));
const revision=process.env.GITHUB_SHA||process.env.NATHAN_REVISION||"unrecorded";
const started=new Date().toISOString(),samples=[];
for(let i=0;i<n;i++){
 const start=performance.now();let status=0,error=null;
 try{const r=await fetch(url+"/health",{cache:"no-store"});status=r.status;await r.arrayBuffer()}catch(e){error=String(e)}
 samples.push({index:i,status,error,latency_ms:Math.round((performance.now()-start)*100)/100});
}
const finished=new Date().toISOString(),good=samples.filter(x=>x.status===200&&!x.error),sorted=good.map(x=>x.latency_ms).sort((a,b)=>a-b);
const receipt={type:"health-probe-not-inference",revision,model:null,dataset:null,hardware:"Cloudflare Worker HTTP endpoint",precision:null,window_start:started,window_end:finished,requested:n,accepted:good.length,failed:n-good.length,p95_ms:sorted.length?sorted[Math.ceil(sorted.length*.95)-1]:null,spend_usd:null,quality_threshold:"HTTP 200",samples};
const raw=JSON.stringify(receipt);const hash=createHash("sha256").update(raw).digest("hex");
const file="nathan-health-receipt-"+Date.now()+".json";await writeFile(file,JSON.stringify({...receipt,raw_sha256:hash},null,2));
console.log(JSON.stringify({file,accepted:good.length,failed:n-good.length,p95_ms:receipt.p95_ms,raw_sha256:hash},null,2));
