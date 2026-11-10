"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const G=require("./guardian.js");
const yes={humanChoice:"YES",voluntary:true,contextApproved:true,purposeApproved:true};
const reviewed={...yes,humanReviewed:true,ownerControlsSystem:true};
function begin(){return G.create({purpose:"Help others first",context:"Own systems only",evidenceReference:"owner-controlled-document-reference",permission:yes});}
test("creator authored guardian and sentinals spelling kept exact",()=>{
 assert.equal(G.CANON.title,"FOREVER GUARDIAN");
 assert.equal(G.CANON["author'sSpelling"],"sentinals");
 assert.match(G.CANON.authoredDisposition,/FOREVER GUARDIAN with Nathan Tabor/);
 assert.equal(G.CANON.role,"HELP OTHERS FIRST");
});
test("atomic, neuron, earth, firmament, cosmos, truth and consent middle axes coexist",()=>{
 const domains=G.POLARITIES.map(x=>x.domain);
 for(const key of ["ATOMIC","PARTICLE","NEURON","BIOLOGY","EARTH","FIRMAMENT","COSMOS","TRUTH","SOVEREIGNTY"])
   assert.ok(domains.includes(key));
 assert.equal(G.equator("TRUTH").middle,"REVIEW_UNRESOLVED");
 assert.equal(G.equator("FIRMAMENT").status,"FICTIONAL_COSMOLOGY");
 assert.equal(G.equator("EARTH").status,"GEOGRAPHIC_GEOMETRY");
 assert.throws(()=>G.equator("REAL_SENTINALS_LOCATED"),/Unknown/);
});
test("NO, no consent, coercion, force, unauthorized access and surveillance are forbidden",()=>{
 for(const risk of [{humanChoice:"NO"},{voluntary:false},{contextApproved:false},
   {coercion:true},{deception:true},{targetPerson:true},{unlawfulAccess:true},
   {massSurveillance:true},{entrapPerson:true},{physicalForce:true},{accuseWithoutEvidence:true}]){
   assert.equal(G.permission({...yes,...risk},"NOTICE_SAFETY_CONCERN").allowed,false);
 }
 assert.equal(G.permission(yes,"NOTICE_SAFETY_CONCERN").allowed,true);
});
test("decommission plans require both owner control and human review",()=>{
 assert.equal(G.permission(yes,"NONVIOLENT_DECOMMISSION_PLAN").allowed,false);
 assert.equal(G.permission({...yes,humanReviewed:true},"NONVIOLENT_DECOMMISSION_PLAN").allowed,false);
 assert.equal(G.permission({...yes,ownerControlsSystem:true},"NONVIOLENT_DECOMMISSION_PLAN").allowed,false);
 assert.equal(G.permission(reviewed,"NONVIOLENT_DECOMMISSION_PLAN").allowed,true);
});
test("six staged proposals have no ability to run external actions",()=>{
 let record=begin();
 assert.equal(record.allegationsNotProof,true);
 assert.equal(record.physicalActionsTaken,0);
 assert.equal(record.networkActionsTaken,0);
 assert.throws(()=>G.advance(record,{...yes,humanChoice:"NO"}),/NO HUMAN YES/);
 record=G.advance(record,yes);
 assert.equal(record.status,"PRESERVE_SAFE_REFERENCE");
 for(let i=2;i<G.WORKFLOW.length;i++)record=G.advance(record,reviewed);
 assert.equal(record.stageIndex,5);
 assert.equal(record.history.length,6);
 assert.equal(record.status,"VERIFIED_SAFE_RESTORATION_PLAN_ONLY");
 assert.equal(record.controlledSystemModified,false);
 assert.throws(()=>G.advance(record,reviewed),/complete/);
});
