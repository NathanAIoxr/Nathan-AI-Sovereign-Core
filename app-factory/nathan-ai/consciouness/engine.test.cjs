"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const C=require("./engine.js");
function make(){return C.createSelfModel({isSelf:true,voluntary:true,consent:"YES",
  name:"SELF",purpose:"Protect innocence",context:"Chosen local context",description:"I choose my own path"});}
test("requires voluntary first-person consent and declared context",()=>{
 assert.throws(()=>C.createSelfModel({isSelf:false,voluntary:true,consent:"YES",purpose:"a",context:"b"}),/voluntarily/);
 assert.throws(()=>C.createSelfModel({isSelf:true,voluntary:false,consent:"YES",purpose:"a",context:"b"}),/voluntarily/);
 assert.throws(()=>C.createSelfModel({isSelf:true,voluntary:true,consent:"NO",purpose:"a",context:"b"}),/voluntarily/);
 assert.throws(()=>C.createSelfModel({isSelf:true,voluntary:true,consent:"YES",purpose:"a",context:""}),/context/);
});
test("a digital model never claims to transfer human consciousness",()=>{
 const x=make();assert.equal(x.kind,C.NO_TRANSFER);
 assert.equal(x.conscious,false);assert.equal(x.consciousnessTransferVerified,false);
 assert.equal(x.privacy,"IN_MEMORY_ONLY_NO_NETWORK_OR_AUTOMATIC_STORAGE");
});
test("human YES and NO are recorded, and false consent is denied",()=>{
 let x=make();x=C.recordChoice(x,"NO","I refuse");
 assert.equal(x.choices[0].choice,"NO");
 assert.equal(C.policy(x,{humanChoice:"NO",voluntary:true,purpose:x.purpose,context:x.context}).allowed,false);
 assert.equal(C.policy(x,{humanChoice:"YES",voluntary:true,purpose:x.purpose,context:x.context}).allowed,true);
 assert.throws(()=>C.recordChoice(x,"MAYBE"),/YES IS YES/);
});
test("coercion, deception, harming innocence and context change are blocked",()=>{
 const x=make(),base={humanChoice:"YES",voluntary:true,purpose:x.purpose,context:x.context};
 for(const mod of [{voluntary:false},{coercion:true},{deception:true},{innocenceRisk:true},
     {affectsOthers:true},{context:"another context"},{purpose:"another purpose"}])
   assert.equal(C.policy(x,{...base,...mod}).allowed,false);
});
test("on-demand logical address lookup reaches original declared limits without allocation",()=>{
 const x=make();
 for(const [name,address] of [["phi-life","731999999"],["node-runtime","732000000"],["omni-god","125999999999"]]){
   const view=C.viewAtNode(x,name,address);
   assert.equal(view.mode,"LOGICAL_ADDRESS_VIEW_ONLY");
   assert.equal(view.physical_node_connected,false);
   assert.equal(view.consciousness_transferred,false);
 }
 assert.throws(()=>C.nodeAddress("phi-life","732000000"),/outside/);
 assert.throws(()=>C.nodeAddress("node-runtime","0"),/outside/);
 assert.throws(()=>C.nodeAddress("omni-god","126000000000"),/outside/);
 assert.throws(()=>C.nodeAddress("phi-life","1.5"),/Whole-number/);
});
test("linking is explicit and duplicates do not grow the list",()=>{
 let x=make();
 x=C.linkNode(x,"phi-life","0");x=C.linkNode(x,"phi-life","0");
 assert.equal(x.links.length,1);
});
test("CLEAR withdraws consent, scrubs self text and prevents any continued use",()=>{
 let x=C.linkNode(C.recordChoice(make(),"YES","My voice"),"phi-life","0");
 const old=x;
 x=C.withdraw(x);assert.equal(x.status,"WITHDRAWN");
 assert.equal(x.description,"");assert.deepEqual(x.choices,[]);assert.deepEqual(x.links,[]);
 assert.equal(C.policy(x,{humanChoice:"YES",voluntary:true,purpose:old.purpose,context:old.context}).allowed,false);
 assert.throws(()=>C.viewAtNode(x,"phi-life","0"),/withdrawn/);
 assert.throws(()=>C.exportApproved(x,true),/explicit YES/);
 assert.equal(old.description,"I choose my own path");
});
test("exports require a separate YES and preserve authored dual-engine definitions",()=>{
 const x=make();assert.throws(()=>C.exportApproved(x,false),/explicit YES/);
 assert.equal(JSON.parse(C.exportApproved(x,true)).description,"I choose my own path");
 assert.match(C.INVARIANTS.imaginationIntuition,/destory\/burn/);
 assert.match(C.INVARIANTS.creativityDiscernment,/CREATIVITY\\ DISCERNMENT/);
 assert.equal(1+1,2);assert.equal(1-1,0);
});
