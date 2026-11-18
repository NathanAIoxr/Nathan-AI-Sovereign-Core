import assert from "node:assert/strict";
import {test} from "node:test";
import {binary,lockMoves,lockState,pack,protocolClient} from "./src/protocol.mjs";
import {githubWorkflows,makeSnapshot,refresh,roster,sha,summarize} from "./src/registry.mjs";
import worker from "./src/index.mjs";

const w={id:71,name:"Build",state:"active",path:".github/workflows/build.yml"};
const fleet=[{agent_id:"TABOR-AGENT-01",execution_status:"planned"}];
const rotation=[{id:"3AY",state:"registered"}];

test("One into Zero uses two full right turns and four full left turns in order",async()=>{
  assert.deepEqual(lockMoves,["insert","right","right","left","left","left","left"]);
  assert.equal(binary,"1110000");
  assert.deepEqual(lockMoves.map((_,i)=>lockState(lockMoves.slice(0,i+1)).rotation),[0,360,720,360,0,-360,-720]);
  assert.equal(lockState(lockMoves.slice(0,-1)).open,false);
  assert.equal(lockState(["insert","right","left","left","left","left","right"]).open,false);
  const client=await import("data:text/javascript,"+encodeURIComponent(protocolClient()));
  assert.deepEqual(client.lockState(lockMoves),lockState(lockMoves));
});

test("both families produce exactly three deterministic assignments per source record",()=>{
  const snapshot=makeSnapshot([w],fleet,rotation,1),sum=summarize(snapshot);
  const parents=roster(snapshot,undefined,0,100).entries;
  assert.equal(sum.meeting,true);
  assert.equal(sum.assignment_count,parents.length*3);
  for(const entry of parents){
    assert.notEqual(entry.family,entry.counterpart.family);
    assert.deepEqual(entry.assignments.map(a=>a.role),["build","verify","relay"]);
    assert.equal(entry.assignments.every(a=>a.counterpart_id===entry.counterpart.id),true);
  }
  assert.equal(new Set(parents.flatMap(x=>x.assignments.map(a=>a.id))).size,sum.assignment_count);
  assert.deepEqual(roster(makeSnapshot([w],fleet,rotation,2),undefined,0,100).entries,parents);
  assert.equal(summarize(makeSnapshot([],fleet,rotation,2)).assignment_count,0);
  const international=makeSnapshot([w],[],[{id:"Φ_1",state:"registered"}],1);
  assert.ok(international.cards.some(record=>record.id==="cloudflare-rotational-%CE%A6_1"));
  assert.equal(roster(makeSnapshot([],fleet,rotation,2),undefined,0,100).entries[0].assignments.length,0);
});

test("binary packet binds source counts and lock bits to the roster hash",async()=>{
  const snapshot=makeSnapshot([w],fleet,rotation,1),sum=summarize(snapshot);
  const digest=await sha(JSON.stringify(snapshot)),bytes=pack(sum,digest),view=new DataView(bytes.buffer);
  assert.equal(Buffer.from(bytes).subarray(0,4).toString(),"TFED");
  assert.equal(view.getUint8(5),7);
  assert.equal(view.getUint8(6)>>1,0b1110000);
  assert.equal(view.getUint8(7),3);
  assert.equal(view.getUint32(8),sum.github);
  assert.equal(view.getUint32(12),sum.cloudflare);
  assert.equal(view.getUint32(16),sum.parent_count);
  assert.equal(Buffer.from(bytes).subarray(20).toString("hex"),digest);
});

test("the collector walks pagination and rejects an incomplete roster",async()=>{
  const fetcher=async url=>{
    assert.equal(new URL(url).hostname,"api.github.com");
    const page=Number(new URL(url).searchParams.get("page"));
    return Response.json({total_count:2,workflows:[{...w,id:page}]});
  };
  assert.deepEqual((await githubWorkflows(fetcher)).map(item=>item.id),[1,2]);
  await assert.rejects(githubWorkflows(async()=>Response.json({total_count:2,workflows:[]})),/Incomplete/);
});

test("federation refresh keeps last good data when an upstream fails and routes audit it",async()=>{
  let stored;
  const db={async batch(){return [{results:fleet},{results:rotation}];},prepare(sql){
    if(sql.startsWith("INSERT"))return {bind(at,roster_json,sha256){return {async run(){
      if(!stored||at>stored.observed_ms)stored={observed_ms:at,roster_json,sha256};
    }}}};
    return {async first(){return stored;}};
  }};
  const endpoint=path=>new Request("https://example.test"+path);
  await refresh(db,async()=>Response.json({total_count:1,workflows:[w]}),123);
  await assert.rejects(refresh(db,async()=>new Response(null,{status:503}),124),/unavailable/);
  const audit=await (await worker.fetch(endpoint("/api/audit"),{REGISTRY:db})).json();
  assert.equal(audit.verified,true);
  assert.equal((await worker.fetch(endpoint("/api/roster?family=github&limit=1"),{REGISTRY:db})).status,200);
  assert.equal((await worker.fetch(endpoint("/api/roster?family=third"),{REGISTRY:db})).status,400);
  assert.equal((await (await worker.fetch(endpoint("/health"),{REGISTRY:db})).json()).last_sync_ms,123);
  const lock=await (await worker.fetch(endpoint("/api/lock?moves=insert,right,right,left,left,left,left"),{})).json();
  assert.equal(lock.open,true);
  assert.equal((await worker.fetch(endpoint("/"),{})).status,200);
});
