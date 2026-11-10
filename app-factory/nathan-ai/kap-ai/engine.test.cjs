"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const K=require("./engine.js");
const yes=()=>({humanChoice:"YES",consent:"YES",voluntary:true,ownerSelf:true,
 purpose:"Help others first",context:"Self-authorized safe local planning",
 reference:"KAP-LOCAL-001",caseType:"PREVENTION"});
const review=()=>({...yes(),humanReviewed:true,ownerControlsSystem:true});
test("007 means exactly seven distinct owner-reviewed protective protocols",()=>{
 assert.deepEqual(K.PROTOCOLS.map(p=>p.id),["001","002","003","004","005","006","007"]);
 assert.equal(K.ROLES.length,3);
 assert.deepEqual(K.ROLES.map(r=>r.id),["NATHAN_AI","DOG_AI","REAPER_AI"]);
 assert.equal(K.release().weaponFunctions,0);
 assert.equal(K.release().noAutonomousDeployment,true);
 assert.equal(K.release().integration.includes("CONSCIOUNESS"),true);
});
test("preserves authored KAP designation without converting violence into code",()=>{
 assert.equal(K.AUTHOR.term,"KAP AI");
 assert.equal(K.AUTHOR.fullOriginalTitle,"KILL ALL PEDOPHILES AI");
 assert.equal(K.AUTHOR.titleStatus,"AUTHOR_PROVIDED_FICTIONAL_NAME_NOT_EXECUTION_AUTHORITY");
 assert.equal(K.release().releasedPhysicalAgents,0);
});
test("NO or coerced submission never creates a session",()=>{
 for(const changed of [{humanChoice:"NO"},{consent:"NO"},{ownerSelf:false},{voluntary:false},
 {harmPerson:true},{targetPerson:true},{claimGuilt:true},{weaponUse:true},
 {unauthorizedAccess:true},{religiousTargeting:true},{abusiveImages:true},
 {automatedReport:true},{childSensitiveData:true}]){
  assert.throws(()=>K.start({...yes(),...changed}));
 }
});
test("stores only safe opaque reference identifiers, not contact details or URLs",()=>{
 assert.equal(K.sanitizeReference("KAP-LOCAL-001"),"KAP-LOCAL-001");
 for(const invalid of ["https://example.com/unsafe","user@example.com","/tmp/personal","../archive","", "  "])
  assert.throws(()=>K.sanitizeReference(invalid));
 const s=K.start(yes());assert.equal(s.privateChildDataStored,false);
 assert.equal(s.storedByApp,false);
});
test("can propose first three steps and requires explicit YES for each",()=>{
 let s=K.start(yes());
 for(const id of ["001","002","003"]){
   s=K.propose(s,yes());assert.equal(s.pending.id,id);
   assert.throws(()=>K.propose(s,yes()),/pending/);
   s=K.decide(s,"YES",yes());assert.equal(s.pending,null);
 }
 assert.equal(s.nextIndex,3);assert.equal(s.executedExternalActions,0);
});
test("human review and ownership are hard gates for later stages",()=>{
 let s=K.start(yes());
 for(let i=0;i<3;i++)s=K.decide(K.propose(s,yes()),"YES",yes());
 assert.throws(()=>K.propose(s,yes()),/HUMAN REVIEW/);
 s=K.decide(K.propose(s,review()),"YES",review());
 assert.equal(s.nextIndex,4);
 assert.throws(()=>K.propose(s,{...review(),ownerControlsSystem:false}),/OWN/);
 s=K.decide(K.propose(s,review()),"YES",review());
 assert.equal(s.nextIndex,5);
});
test("007 runs to completed local documentation without any real actions",()=>{
 let s=K.start(yes());
 for(let i=0;i<7;i++){
  const q=i>=3?review():yes();
  s=K.decide(K.propose(s,q),"YES",q);
 }
 assert.equal(s.status,"COMPLETED_LOCAL_PLAN_ONLY");
 assert.equal(s.history.length,7);
 assert.ok(s.history.every(h=>h.externalActions===0&&h.targets===0&&h.reportSent===false));
 assert.equal(s.physicalActions,0);assert.equal(s.externalReportsSubmitted,0);
 assert.throws(()=>K.propose(s,review()),/No active local session/);
});
test("NO is unconditional veto; consent withdrawn means stop",()=>{
 let s=K.start(yes());s=K.propose(s,yes());
 const veto=K.decide(s,"NO",null);
 assert.equal(veto.status,"VETOED");assert.equal(veto.nextIndex,0);
 assert.throws(()=>K.propose(veto,yes()));
 const withdrawn=K.revoke(s);
 assert.equal(withdrawn.reference,"");assert.equal(withdrawn.purpose,"");
 assert.deepEqual(withdrawn.history,[]);
 assert.equal(K.permission(yes(),withdrawn,"001").allowed,false);
});
test("fictional novel warrant cannot become verified crime case or deployment authority",()=>{
 const p=K.fictionalDossier("OXR-2026-ALPHA");
 assert.equal(p.executionWarrantValid,false);
 assert.equal(p.cryptographicSignatureVerified,false);
 assert.equal(p.actualEntityOrPersonIdentified,false);
 assert.equal(p.realCriminalChargesEstablished,false);
 assert.throws(()=>K.fictionalDossier("REAL_WARRANT"));
});
test("official reporting links only, no auto-send",()=>{
 assert.equal(K.LINKS.cybertip,"https://report.cybertip.org/");
 assert.equal(K.LINKS.fbi,"https://tips.fbi.gov/");
 let s=K.start(yes());
 assert.equal(s.externalReportsSubmitted,0);
 assert.equal(K.release().realWorldOperations,0);
});
