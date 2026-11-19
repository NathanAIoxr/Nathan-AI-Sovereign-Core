import test from "node:test";
import assert from "node:assert/strict";
import {assess,probe,DEFAULT_ORIGIN} from "./health-check.mjs";
const now=Date.parse("2026-11-19T02:30:00Z");
const health={ok:true,storage_bound:true,dispatch:false,nodes:31,edges:38};
const latest={service:"tabor-persona-duality",scheduled_at:"2026-11-19T02:15:04.449Z",task_ids:["PD-014","PD-001","PD-002"],result:"queued_for_review_not_executed",external_dispatch:false,mutations_to_other_services:0};
test("healthy means receipt fresh and review only",()=>{const report=assess(health,{latest},now);assert.equal(report.status,"healthy");assert.deepEqual(report.receipt_summary.task_ids,latest.task_ids);});
test("stale receipt fails closed",()=>{const report=assess(health,{latest},now+60*60*1000);assert.equal(report.status,"degraded");assert.equal(report.checks.find(x=>x.name==="receipt.fresh").ok,false);});
test("missing receipt never implies success",()=>{const report=assess(health,{latest:null},now);assert.equal(report.status,"degraded");assert.equal(report.receipt_summary,null);});
test("no silent dispatch or completion",()=>{assert.equal(assess(health,{latest:{...latest,result:"executed"}},now).status,"degraded");assert.equal(assess({...health,dispatch:true},{latest},now).status,"degraded");});
test("invalid task IDs rejected",()=>{assert.equal(assess(health,{latest:{...latest,task_ids:["PD-001","PD-002","PD-999"]}},now).status,"degraded");});
test("read-only pinned probe, JSON type and paths",async()=>{
 const paths=[];const fetcher=async(url,opts)=>{paths.push([url,opts.method,opts.redirect]);return {ok:true,headers:{get:()=>"application/json"},json:async()=>url.endsWith("/api/health")?health:{latest}}};
 const report=await probe({fetcher,now});assert.equal(report.status,"healthy");assert.deepEqual(paths.map(x=>x[0]),[DEFAULT_ORIGIN+"/api/health",DEFAULT_ORIGIN+"/api/receipts"]);assert.ok(paths.every(x=>x[1]==="GET"&&x[2]==="error"));
 await assert.rejects(()=>probe({fetcher,origin:"https://example.com"}),/pinned/);
});
test("HTTP errors fail rather than claiming health",async()=>{await assert.rejects(()=>probe({fetcher:async()=>({ok:false,status:503}),now}),/HTTP 503/);});
