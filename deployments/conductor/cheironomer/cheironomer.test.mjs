import {DatabaseSync} from "node:sqlite";
import {readFileSync} from "node:fs";
import assert from "node:assert/strict";
import test from "node:test";
import {normalize,HOLD_CAPACITY} from "./src/zone_dispatcher.js";
import {readOwnedGraph} from "./src/nathan_reader_bots.js";
import {sha} from "./src/conductor.js";

test("sparse identity bounds are exact",()=>{
  assert.equal(HOLD_CAPACITY,"126732000000");
  assert.equal(normalize({action:"stage",namespace:"omni_god",id:"125999999999"}).manifest.status,"HOLD");
  assert.equal(normalize({action:"stage",namespace:"supernodes",id:"732000000"}).manifest.zoneId,"hold/supernodes/NT-732000000");
  assert.throws(()=>normalize({action:"stage",namespace:"supernodes",id:"732000001"}));
});
test("DNS stage accepts ten unique zones and caps the batch",()=>{
  const domains=Array.from({length:10},(_,index)=>({domain:"site"+index+".example.com",zoneId:String(index).padStart(32,"0")}));
  assert.equal(normalize({action:"register-dns",domains}).domains.length,10);
  assert.throws(()=>normalize({action:"register-dns",domains:[...domains,domains[0]]}));
});
test("reader dispatch accepts owned catalog roles",()=>{
  assert.equal(normalize({action:"dispatch",identity:"hold/omni_god/1",source:"github"}).role,"NATHAN_GH_BOT");
  assert.throws(()=>normalize({action:"dispatch",identity:"hold/omni_god/1",source:"https://example.com"}));
});
test("proof hashes commit to the normalized content",async()=>{
  const first=normalize({action:"extract",tile:"sensor",payload:{z:3,a:2}});
  assert.equal(await sha(JSON.stringify(first)),await sha(JSON.stringify(normalize({action:"extract",tile:"sensor",payload:{a:2,z:3}}))));
  assert.notEqual(await sha(JSON.stringify(first)),await sha("{}"));
});
test("root evidence uses explicit source scan status",async()=>{
  const env={VAULT_READ:{prepare:()=>({bind:()=>({all:async()=>({results:[
    {node_key:"path:1",kind:"GitHub file",scan_status:"no-static-reference"},
    {node_key:"path:2",kind:"GitHub file",scan_status:"references-found"}
  ]})})})}};
  assert.deepEqual((await readOwnedGraph(env,"github")).rows.map(row=>row.isTerminalRoot),[true,false]);
});

test("voice export trusts the exact main-branch Actions workflow", async ()=>{
  const {allowedVoiceExport,voiceProofs}=await import("./src/github_voice_proofs.js");
  const repository="NathanAIoxr/Nathan-AI-Sovereign-Core";
  const aud="https://unified-operations-cockpit.nathantaboract.workers.dev/tabor-sites/conductor/cheironomer/internal/voice-proofs";
  const now=Math.floor(Date.now()/1000);
  const claims={iss:"https://token.actions.githubusercontent.com",aud,repository,repository_id:"1038249626",
    ref:"refs/heads/main",workflow_ref:repository+"/.github/workflows/zone-switch.yml@refs/heads/main",
    event_name:"push",nbf:now-1,exp:now+60};
  assert.equal(allowedVoiceExport(claims,now),true);
  for(const changed of [{ref:"refs/heads/staging"},{repository_id:"999"},{event_name:"pull_request"},{aud:"elsewhere"},{exp:now}])
    assert.equal(allowedVoiceExport({...claims,...changed},now),false);
  const pair=await crypto.subtle.generateKey({name:"RSASSA-PKCS1-v1_5",modulusLength:2048,publicExponent:new Uint8Array([1,0,1]),hash:"SHA-256"},true,["sign","verify"]);
  const pub=await crypto.subtle.exportKey("jwk",pair.publicKey);
  const text=Buffer.from(JSON.stringify({alg:"RS256",kid:"test"})).toString("base64url")+"."+Buffer.from(JSON.stringify(claims)).toString("base64url");
  const signature=Buffer.from(await crypto.subtle.sign("RSASSA-PKCS1-v1_5",pair.privateKey,new TextEncoder().encode(text))).toString("base64url");
  const {ledgerHashes}=await import("./src/integrity.js");
  const voice={action:"voice",transcript:"PRIVATE",cleaned:"cleaned",entities:[]};
  const source_hash=await sha(JSON.stringify(voice));
  const payload_hash=await sha(JSON.stringify({...voice,proof:source_hash}));
  const prior_hash="0".repeat(64);
  const [alien_hash,neila_hash]=await ledgerHashes("proof",prior_hash,payload_hash);
  const row={event_id:"proof",source_hash,created_at:"date",sealed_at:"date",transcript:"PRIVATE",
    entities_json:JSON.stringify({cleaned:"cleaned",entities:[]}),event_type:"voice",payload_hash,prior_hash,alien_hash,neila_hash};
  let locked=false;
  const env={LEDGER:{prepare:()=>({
    all:async()=>({results:[row]}),
    bind:()=>({run:async()=>{locked=true;}})
  })}};
  const keys=async()=>Response.json({keys:[{...pub,kid:"test"}]});
  const request=new Request(aud,{headers:{Authorization:"Bearer "+text+"."+signature}});
  const verdict=await voiceProofs(request,env,keys);
  assert.equal(verdict.status,200);
  assert.deepEqual(await verdict.json(),{voiceEvidence:[{event_id:"proof",source_hash,created_at:"date"}]});
  row.transcript="changed";
  assert.equal((await voiceProofs(request,env,keys)).status,409);
  assert.ok(locked);
});

test("risk ledger seals the exact threshold, closes once and blocks SQL replacement",async()=>{
  const {evaluateRisk,riskInputs,riskStatus,settleRisk}=await import("./src/risk_gate.js");
  const sqlite=new DatabaseSync(":memory:");
  for(const name of ["0002_cheironomer.sql","0004_verified_ledger.sql"])
    sqlite.exec(readFileSync(new URL("../migrations/"+name,import.meta.url),"utf8"));
  const db={prepare(sql){const query=sqlite.prepare(sql);return {bind(...args){return {
    all:async()=>({results:query.all(...args)}),first:async()=>query.get(...args)??null,run:async()=>query.run(...args)
  };}};}};
  const input={unitStake:1,impliedProb:.5,trueProb:.545,feeDrag:.02};
  for(const raw of [{...input,trueProb:NaN},{...input,feeDrag:"0"},{...input,minEdgeHurdle:.01},{...input,outcomeSuccess:true}])
    assert.throws(()=>riskInputs(raw));
  assert.equal((await evaluateRisk(db,"operator",{...input,trueProb:.544999})).state,"REJECTED");
  const first=await evaluateRisk(db,"operator",input);
  assert.equal(first.state,"INTENT_LOCKED");
  assert.equal(first.netEdge,.025);
  assert.deepEqual(await riskStatus(db,"another",first.id),{error:"risk_not_found"});
  assert.equal((await settleRisk(db,"operator",first.id,true)).state,"SETTLED_2");
  assert.equal((await settleRisk(db,"operator",first.id,false)).error,"risk_already_closed");
  sqlite.exec("PRAGMA recursive_triggers=OFF");
  assert.throws(()=>sqlite.exec("UPDATE deterministic_ledger SET state='REJECTED'"),/immutable_risk/);
  assert.throws(()=>sqlite.exec("DELETE FROM deterministic_ledger"),/immutable_risk/);
  assert.throws(()=>sqlite.exec("INSERT OR REPLACE INTO deterministic_ledger SELECT * FROM deterministic_ledger"),/immutable_risk/);
  sqlite.exec("DROP TRIGGER risk_no_update; UPDATE deterministic_ledger SET payload_json='{}' WHERE ordinal=0");
  assert.equal((await riskStatus(db,"operator",first.id)).error,"integrity_lock");
  sqlite.close();
});

test("origin signature strips caller seals and rejects replay and changed request data",async()=>{
  const {signOriginRequest,verifyOriginRequest}=await import("./origin-seal.mjs");
  const secret="ab".repeat(32);
  const now=Date.now();
  const incoming=new Request("https://example.org/path?x=1",{method:"POST",body:"approved",
    headers:{"x-conductor-seal":"spoof","x-conductor-extra":"remove"}});
  const signed=await signOriginRequest(incoming,secret,now);
  const used=new Set();
  const claim=async(_host,nonce)=>{if(used.has(nonce))return false;used.add(nonce);return true;};
  assert.equal(signed.headers.has("x-conductor-extra"),false);
  assert.ok(await verifyOriginRequest(signed,secret,claim,now));
  assert.equal(await verifyOriginRequest(signed,secret,claim,now),false);
  const replay=new Request("https://example.org/path?x=2",{method:"POST",headers:signed.headers,body:"changed"});
  assert.equal(await verifyOriginRequest(replay,secret,async()=>true,now),false);
  assert.equal(await verifyOriginRequest(signed,secret,async()=>true,now+30001),false);
});

test("a DNS receipt binds the exact nameservers, route and provider state",async()=>{
  const {verifyDnsReceipt}=await import("./src/integrity.js");
  const row={checked_at:"2026-11-20T01:00:00Z",cf_status:"pending",domain:"example.org",nameservers_json:'["one.example.net"]',route_id:null,zone_id:"zone"};
  const body=JSON.stringify({at:row.checked_at,cfStatus:row.cf_status,domain:row.domain,gate:"HOLDING",
    nameservers:["one.example.net"],route:"",zoneId:row.zone_id});
  row.alien_seal=await sha("ALIEN|"+body);
  row.neila_seal=await sha("NEILA|"+row.alien_seal+"|"+body);
  assert.equal(await verifyDnsReceipt(row),true);
  assert.equal(await verifyDnsReceipt({...row,cf_status:"active"}),false);
});
