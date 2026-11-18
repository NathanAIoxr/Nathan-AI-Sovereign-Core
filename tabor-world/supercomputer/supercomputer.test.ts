import { strict as assert } from "node:assert";
import { test } from "node:test";
import { SupercomputerRegistry, nextStage, reviewSignal, CAPACITY_MODELS, AXIOMS } from "./supercomputer";

test("preserves distinct historical and mythological identities",()=>{
  const registry=new SupercomputerRegistry();
  registry.register({id:"mind:cleopatra",name:"Cleopatra VII",kind:"historical-mind",capabilities:["multilingual coordination"],provenance:"council original",runtime:"conceptual"});
  registry.register({id:"deity:athena",name:"Athena",kind:"mythological-council",capabilities:["strategy"],provenance:"council original",runtime:"conceptual"});
  assert.equal(registry.list().length,2);
  assert.equal(registry.operationalCount(),0);
  assert.equal(registry.search("strategy")[0].name,"Athena");
  assert.throws(()=>registry.register({id:"mind:cleopatra",name:"Other",kind:"historical-mind",capabilities:[],provenance:"unknown",runtime:"conceptual"}));
});
test("task review gate and no destructive mutation",()=>{
  let s=nextStage("proposed","queue");
  s=nextStage(s,"claim");s=nextStage(s,"submit");
  assert.equal(s,"review");assert.equal(nextStage(s,"approve"),"approved");
  assert.throws(()=>nextStage("proposed","approve"));
  const r=reviewSignal({id:"x",payload:"CORRUPT: preserve exact original",stateBit:0,plane:"Literal"});
  assert.equal(r.original,"CORRUPT: preserve exact original");
  assert.equal(r.verified,false);assert.equal(r.destructiveAction,false);
});
test("logical capacity remains separate from live agent count",()=>{
  assert.equal(CAPACITY_MODELS.workerFamilies,172);
  assert.equal(CAPACITY_MODELS.proposedHiveWorkerAddresses,126_000_000_000);
  assert.equal(AXIOMS.build,"1+1=2");
});
