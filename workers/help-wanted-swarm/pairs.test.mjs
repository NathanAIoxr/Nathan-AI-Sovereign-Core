import assert from "node:assert/strict";
import test from "node:test";
import {asPair,pairIds,probeProjects,servePairs} from "./pairs.mjs";

const row={id:"bugzilla:example#1",title:"One issue",url:"https://example.org/1",provider:"bugzilla",scope:"GLOBAL",
 bee_id:"bee:bugzilla:example#1",ant_id:"ant:bugzilla:example#1",bee_status:"VERIFIED",ant_seen:1,updated_at:2};
test("pairs name distinct Bee and Ant assignments for the same indexed issue",()=>{
 assert.deepEqual(pairIds(row.id),{bee:row.bee_id,ant:row.ant_id});
 const value=asPair(row,"help-wanted");
 assert.equal(value.workerBee.status,"VERIFIED");
 assert.equal(value.antBot.status,"INDEXED");
});
test("public project listing filters by visibility and paginates by stable ID",async()=>{
 const prepared=[];
 const db={prepare(sql){prepared.push(sql);return {
  first:async()=>({help_wanted:6,projects:1}),
  bind(after,limit){assert.equal(after,"last");assert.equal(limit,2);return {all:async()=>({results:[row,{...row,id:"second"}]})};}
 };}};
 const res=await servePairs(new Request("https://example.org/api/repair/pairs?kind=projects&after=last&limit=1"),db,{});
 assert.equal(res.status,200);
 const body=await res.json();assert.equal(body.items.length,1);assert.equal(body.nextAfter,row.id);
 assert.match(prepared[0],/visibility='public'/);
});
test("project probes record real responses and ignore destinations outside the account",async()=>{
 const writes=[];const reads=[];
 const sources=[{id:"owned",probe_url:"https://bibletopia.nathantaboract.workers.dev/"},{id:"other",probe_url:"https://example.org/"}];
 const db={prepare(sql){return sql.startsWith("SELECT")?{all:async()=>({results:sources})}:
  {bind(...values){writes.push(values);return {run:async()=>({})};}};}};
 await probeProjects(db,async (url,options)=>{reads.push(url);assert.equal(options.redirect,"manual");return new Response(null,{status:204});});
 assert.deepEqual(reads,[sources[0].probe_url]);
 assert.equal(writes.length,1);assert.equal(writes[0][2],"HTTP_OK");
});
