"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const G=require("./engine.js"),S=require("../supernodes/engine.js");
const close=(a,b)=>Math.abs(a-b)<1e-5;
test("three diameters, six antipodal endpoints",()=>{
 const x=G.sixAnchors();assert.equal(x.anchors.length,6);assert.equal(x.center.status,"SYMBOLIC");
 for(let i=0;i<6;i+=2)for(let j=0;j<3;j++)assert.ok(close(x.anchors[i].vector[j],-x.anchors[i+1].vector[j]));
 assert.ok(close(x.anchors[0].latitude,34.5881));assert.ok(close(x.anchors[1].longitude,93.5411));
 assert.throws(()=>G.sixAnchors(91,0));
});
test("creator mappings and 732m logical namespace capacity inherited",()=>{
 for(const n of ["1","732000000"]){const t=G.template(n);
 assert.equal(t.originalCanon.build,"1+1=2");assert.equal(t.originalCanon.clear,"1-1=0");
 assert.equal(t.equalStanding,true);assert.equal(t.automaticExecution,false);}
 assert.notEqual(G.template("1").namespace,G.template("732000000").namespace);
 assert.equal(G.manifest().logicalCapacity,"732000000");
});
test("physics, economics, and fiction separately represented",()=>{
 assert.ok(G.LEVELS.some(x=>x.id==="economics"));
 assert.equal(G.STORY.noExternalActions,true);
 assert.match(G.CREATOR.sentinals,/sentinals/);
 assert.match(G.CREATOR.sovereignty,/heiracrchy/);
});
test("typed claims do not convert into verified facts",()=>{
 assert.throws(()=>G.evidence({type:"SCIENTIFIC_SOURCE",statement:"x"}));
 assert.equal(G.evidence({type:"SCIENTIFIC_SOURCE",statement:"x",sources:["reference"]}).independentlyVerified,false);
 assert.throws(()=>G.evidence({type:"FAKE",statement:"x"}));
});
test("local system decommission requires authorization and never executes",()=>{
 const node=S.createNode("1",{self:true,voluntary:true,consent:"YES",purpose:"Help others first",context:"Owner-controlled local work"});
 const p={humanChoice:"YES",voluntary:true,purpose:node.purpose,context:node.context};
 const r={mode:"DISABLE_LOCAL",ownerControlsSystem:true,humanReviewed:true,explicitAuthorization:true};
 assert.throws(()=>G.proposeDecommission(node,{...p,humanChoice:"NO"},r));
 assert.throws(()=>G.proposeDecommission(node,p,{...r,targetsPeople:true}));
 assert.throws(()=>G.proposeDecommission(node,p,{...r,remoteOperations:true}));
 assert.equal(G.proposeDecommission(node,p,r).actionTaken,false);
});