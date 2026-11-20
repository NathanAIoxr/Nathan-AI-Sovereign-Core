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
  const verdict=await voiceProofs(new Request(aud,{headers:{Authorization:"Bearer "+text+"."+signature}}),{
    LEDGER:{prepare:()=>({all:async()=>({results:[{event_id:"proof",source_hash:"digest",created_at:"date",transcript:"PRIVATE"}]})})}
  },async()=>Response.json({keys:[{...pub,kid:"test"}]}));
  assert.equal(verdict.status,200);
  assert.deepEqual(await verdict.json(),{voiceEvidence:[{event_id:"proof",source_hash:"digest",created_at:"date"}]});
});
