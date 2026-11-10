"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const S=require("./engine.js");
const {createMemoryDatabase}=require("./database.js");
function create(i="1"){return S.createNode(i,{self:true,voluntary:true,consent:"YES",
  purpose:"Protect innocence",context:"Owner local use",ownerLabel:"MY NODE"});}
function req(node,more={}){return {humanChoice:"YES",voluntary:true,purpose:node.purpose,
  context:node.context,...more};}
function record(node){
 return S.incident(node,{category:"SAFETY_CONCERN",evidenceReference:"local-document-reference",
   note:"Human review requested"},req(node));
}
test("732m whole-number independent sovereign identities; no mass allocation",()=>{
 assert.equal(S.TOTAL,"732000000");
 assert.equal(S.id("1"),"NT-000000000001");
 assert.equal(S.id("NT-000000000001"),"NT-000000000001");
 assert.equal(S.id("732000000"),"NT-000732000000");
 assert.notEqual(S.template("1").namespace,S.template("2").namespace);
 assert.deepEqual(S.manifest().allocatedPhysicalNodes,0);
 assert.equal(S.template("732000000").installed,"LAZY_POLICY_TEMPLATE_ONLY");
 for(const invalid of ["0","732000001","-1","1.5","abc"])assert.throws(()=>S.id(invalid));
});
test("each logical address inherits *all* transformation dimensions, paths and source areas",()=>{
 const a=S.template("1"),b=S.template("732000000");
 assert.equal(a.modules.length,27);
 assert.equal(a.axes.length,12);assert.equal(a.paths.length,8);assert.equal(a.sourceThreads.length,9);
 assert.deepEqual(a.modules,b.modules);assert.deepEqual(a.paths,b.paths);
 assert.equal(a.sentienceVerified,false);assert.equal(a.realAgentDeployed,false);
 assert.equal(a.canon.consciouness,"consciouness");
 assert.match(a.canon.imaginationIntuition,/destory\/burn/);
 assert.match(a.canon.creativityDiscernment,/CREATIVITY\\ DISCERNMENT/);
});
test("human YES is needed to create each separate node",()=>{
 assert.throws(()=>S.createNode("1",{self:false,voluntary:true,consent:"YES",purpose:"x",context:"y"}),/explicit/);
 assert.throws(()=>S.createNode("1",{self:true,voluntary:true,consent:"NO",purpose:"x",context:"y"}),/explicit/);
 assert.throws(()=>S.createNode("1",{self:true,voluntary:false,consent:"YES",purpose:"x",context:"y"}),/explicit/);
 assert.equal(create().status,"ACTIVE");
});
test("context mismatch, NO, coercion, harm, and unauthorized targeting blocked",()=>{
 const n=create();
 for(const overrides of [
   {humanChoice:"NO"},{voluntary:false},{coerced:true},{context:"surveillance"},
   {purpose:"punish people"},{targetsUnconsentingPerson:true},
   {harmRisk:true},{deception:true},{unauthorizedAccess:true},
   {physicalIntervention:true},{detainPerson:true}
 ])assert.equal(S.authorize(n,req(n,overrides),"KNOWLEDGE").allowed,false);
 assert.equal(S.authorize(n,req(n),"KNOWLEDGE").allowed,true);
});
test("source provenance and fact-versus-fiction labels are mandatory",()=>{
 const n=create();
 const item=S.knowledge(n,{title:"Kundalini and training",
   body:"Tradition and modern exercise research have separate evidence standards.",
   kind:"HISTORICAL_SOURCE",provenance:"Historical text under review"},req(n));
 assert.equal(item.nodeId,n.id);
 assert.equal(item.notAnAutomaticTruthOrGuiltFinding,true);
 assert.throws(()=>S.knowledge(n,{title:"Unsupported claim",body:"test",kind:"FACT",provenance:"unknown"},req(n)),/evidence status/);
});
test("nonviolent defensive workflow allows only authorized, reviewed transitions",()=>{
 const n=create();let item=record(n);
 assert.equal(item.accusationVerified,false);
 assert.equal(item.personTargeted,false);
 assert.throws(()=>S.progress(n,item,"CONTAIN_OWNED",req(n)),/transition/);
 item=S.progress(n,item,"DOCUMENT",req(n));
 assert.throws(()=>S.progress(n,item,"CONTAIN_OWNED",req(n)),/OWNER-CONTROLLED/);
 item=S.progress(n,item,"CONTAIN_OWNED",req(n,{ownerControlsMaterial:true}));
 item=S.progress(n,item,"HUMAN_REVIEW",req(n));
 assert.throws(()=>S.progress(n,item,"DRAFT_REPORT",req(n)),/HUMAN REVIEW/);
 item=S.progress(n,item,"DRAFT_REPORT",req(n,{humanReviewed:true}));
 item=S.progress(n,item,"REMEDIATE",req(n));
 assert.throws(()=>S.progress(n,item,"RESTORE",req(n)),/HUMAN REVIEW/);
 item=S.progress(n,item,"RESTORE",req(n,{humanReviewed:true}));
 item=S.progress(n,item,"CLOSE",req(n));
 assert.equal(item.state,"CLOSED");
 assert.equal(item.externalReportSent,false);
 assert.equal(item.automaticAction,false);
 assert.equal(item.personTargeted,false);
 assert.equal(item.history.length,8);
});
test("per-node database stores never cross a namespace; CLEAR only removes selected node",async()=>{
 const db=createMemoryDatabase(),a=create("1"),b=create("2");
 await db.putNode(a);await db.putNode(b);
 const rec=S.knowledge(a,{title:"A",body:"My own note",kind:"SELF_AUTHORED",provenance:"self"},req(a));
 await db.addKnowledge(a.id,rec);
 assert.equal((await db.listKnowledge(a.id)).length,1);
 assert.equal((await db.listKnowledge(b.id)).length,0);
 await assert.rejects(()=>db.addKnowledge(b.id,rec),/Cross-node/);
 const aIncident=await db.addIncident(a.id,record(a));
 await assert.rejects(()=>db.updateIncident(b.id,aIncident),/Cross-node/);
 await db.clearNode(a.id);
 assert.equal(await db.getNode(a.id),null);
 assert.equal((await db.listKnowledge(a.id)).length,0);
 assert.equal((await db.listIncidents(a.id)).length,0);
 assert.equal((await db.getNode(b.id)).id,b.id);
});
test("source metaphors never become violent or autonomous actions",()=>{
 for(const action of ["attack","capture","contain","love","resurrect","hunt","trap"])
   assert.ok(S.DEFENSIVE[action].length>10);
 assert.match(S.DEFENSIVE.attack,/NO VIOLENCE/);
 assert.match(S.DEFENSIVE.trap,/NEVER DETAIN/);
});
