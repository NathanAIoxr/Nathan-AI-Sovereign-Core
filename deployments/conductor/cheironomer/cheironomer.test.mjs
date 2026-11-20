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
