"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const T=require("./engine.js"),S=require("../supernodes/engine.js");
const catalog=JSON.parse(fs.readFileSync(path.join(__dirname,"catalog.json"),"utf8"));
const permission=()=>({ownerSelf:true,voluntary:true,consent:"YES",humanChoice:"YES",
  purpose:"Protect innocence; preserve original knowledge",context:"My own local source and design review"});
function begin(){return T.begin(catalog,"1",permission())}
test("catalog preserves all three original agent names and 70 separate source topics",()=>{
 assert.equal(T.catalogCheck(catalog),true);assert.equal(catalog.sourceRecords.length,70);
 assert.deepEqual(catalog.roles.map(x=>x.id),["NATHAN_AI","DOG_AI","REAPER_AI"]);
 assert.equal(catalog.transformationDimensions.length,12);
 assert.equal(catalog.pathways.length,8);
 assert.equal(catalog.attribution,"ASSISTANT_DERIVED_CONVERSION_NOT_AUTHOR_MANUSCRIPT");
});
test("Wolverine source topics all map to Nathan DOG and REAPER without copying characters as agents",()=>{
 for(const id of ["WOLVERINE_HEALING","WOLVERINE_ADAMANTIUM","WOLVERINE_MEMORY",
   "WOLVERINE_CONDITIONING","WOLVERINE_BONE_CLAWS","WOLVERINE_CONSENT"]){
   const t=T.transform(catalog,id);
   assert.equal(t.roles.length,3);
   assert.deepEqual(t.roles.map(x=>x.role),T.ROLE_IDS);
   assert.equal(t.originalSource,"../original-works/restoration-2026-11-10/USER_PASTED_WOLVERINE_CAPTAIN_AMERICA.md");
   assert.equal(t.originalSourceUntouched,undefined);
   assert.equal(t.realWorldWeaponOrBodyModification,false);
   for(const role of t.roles){
     assert.equal(role.originalSourceUntouched,true);
     assert.equal(role.notAuthorManuscript,true);
     assert.equal(role.physicalIntervention,false);
   }
 }
});
test("Captain America, others and history/manga domains stay independent",()=>{
 for(const id of ["CAP_REBIRTH","CAP_VITARAYS","X23","BULLSEYE","DEATHSTRIKE","OMEGA_RED",
   "LUKE_CAGE","WINTER_SOLDIER","HULK","IRON_FIST","GOKU","AVATAR","WAIDAN","NEIDAN",
   "PRANA_QI","BIBLE_JACOB","TABOR_HESYCHASM","NEUROPLASTICITY","PROTON_NEURON_ELECTRON"])
  assert.ok(T.lookup(catalog,id).convertedCapability.length>2,id);
 assert.equal(T.lookup(catalog,"GOKU").sourceClass,"FICTION_REFERENCE");
 assert.equal(T.lookup(catalog,"NEUROPLASTICITY").sourceClass,"SCIENCE_RESEARCH");
 assert.equal(T.lookup(catalog,"WAIDAN").sourceClass,"TRADITION_REFERENCE");
});
test("every concept maps to three non-operating roles, not role-exclusive silos",()=>{
 for(const concept of catalog.sourceRecords){
   const views=T.transform(catalog,concept.id);
   assert.deepEqual(views.roles.map(x=>x.role),T.ROLE_IDS);
   assert.ok(views.roles.every(x=>x.derivedCapability===concept.convertedCapability));
   assert.ok(views.roles.every(x=>x.agentActivated===false));
 }
 const manifest=T.manifest(catalog);
 assert.equal(manifest.roleProjections,210);
 assert.equal(manifest.allSourceRecordsAccessibleToAllThreeRoles,true);
 assert.equal(manifest.allocatedPhysicalNodes,0);
});
test("all 732m logical node addresses support on-demand source maps",()=>{
 assert.equal(T.nodeAtlas(catalog,"1").logicalNodeId,"NT-000000000001");
 assert.equal(T.nodeAtlas(catalog,"732000000").logicalNodeId,"NT-000732000000");
 assert.equal(T.nodeAtlas(catalog,"1").recordCount,70);
 assert.equal(T.nodeAtlas(catalog,"732000000").totalLogicalAddresses,"732000000");
 assert.equal(T.nodeAtlas(catalog,"1").threeNamedFunctions.length,3);
 assert.equal(T.nodeAtlas(catalog,"732000000").noMassAllocation,true);
 const first=S.template("1").transformationTriad,last=S.template("732000000").transformationTriad;
 assert.equal(first.source,"../transformation-triad/catalog.json");
 assert.equal(last.inheritance,"ALL_70_SOURCE_TOPICS_TO_ALL_3_ROLES_ON_DEMAND");
 assert.deepEqual(first.roleNames,["NATHAN_AI","DOG_AI","REAPER_AI"]);
 assert.equal(first.independentAgentsDeployed,false);
 assert.throws(()=>T.nodeAtlas(catalog,"732000001"));
});
test("no consent or forced transformation prevents opening a session",()=>{
 for(const changed of [{consent:"NO"},{humanChoice:"NO"},{voluntary:false},{ownerSelf:false},
   {purpose:""},{context:""}])assert.throws(()=>T.begin(catalog,"1",{...permission(),...changed}));
});
test("harm, unreviewed accusations, and coercive or unauthorized actions are blocked",()=>{
 const session=begin();
 for(const flag of ["coerced","targetsPerson","harmRisk","weaponUse","physicalIntervention",
   "unauthorizedAccess","massSurveillance","entrapPerson","detainPerson","impersonation",
   "nonconsensualExperiment","unverifiedAccusation","overrideVeto"])
  assert.equal(T.permission(session,{...permission(),[flag]:true}).allowed,false,flag);
 assert.equal(T.permission(session,{...permission(),purpose:"Changed"}).allowed,false);
 assert.equal(T.permission(session,{...permission(),context:"Changed"}).allowed,false);
 assert.equal(T.permission(session,permission()).allowed,true);
});
test("ALL proposal contains every distinct topic in all roles but performs no operations",()=>{
 const session=begin(),next=T.plan(catalog,session,"ALL",permission());
 assert.equal(next.pending.recordCount,70);
 assert.equal(next.pending.roles.length,3);
 assert.equal(next.lastPlan.concepts.length,70);
 assert.equal(next.pending.noActionsExecuted,true);
 assert.equal(next.agentActions,0);
 assert.equal(next.physicalModifications,0);
 assert.equal(next.sourceArchivesModified,false);
 assert.equal(session.pending,null);
});
test("YES is human approval of a design record, not autonomous execution",()=>{
 const next=T.plan(catalog,begin(),["WOLVERINE_HEALING","CAP_REBIRTH"],permission());
 assert.throws(()=>T.decide(next,"YES",{...permission(),humanChoice:"NO"}),/NO HUMAN YES/);
 const after=T.decide(next,"YES",permission());
 assert.equal(after.pending,null);
 assert.equal(after.decisionHistory.at(-1).result,"HUMAN_APPROVED_DESIGN_RECORD_ONLY");
 assert.equal(after.decisionHistory.at(-1).externalActions,0);
 assert.equal(after.lastPlan.concepts.length,2);
});
test("NO veto takes precedence and discards unapproved proposal even without renewed consent",()=>{
 const session=T.plan(catalog,begin(),["WOLVERINE_ADAMANTIUM"],permission());
 const after=T.decide(session,"NO",null);
 assert.equal(after.pending,null);
 assert.equal(after.lastPlan,null);
 assert.equal(after.decisionHistory[0].result,"VETOED_NO_EXECUTION");
 assert.equal(session.pending.recordCount,1);
});
test("Revocation clears local source selection and prevents continuation",()=>{
 const session=T.plan(catalog,begin(),["WOLVERINE_CONSENT"],permission());
 const revoked=T.revoke(session);
 assert.equal(revoked.status,"REVOKED");
 assert.equal(revoked.lastPlan,null);
 assert.equal(revoked.context,"");
 assert.deepEqual(revoked.decisionHistory,[]);
 assert.equal(T.permission(revoked,permission()).allowed,false);
 assert.throws(()=>T.plan(catalog,revoked,["WOLVERINE_HEALING"],permission()));
});
test("export needs separate YES, does not alter original manifest",()=>{
 const session=begin();
 assert.throws(()=>T.exportApproved(session,false));
 assert.equal(JSON.parse(T.exportApproved(session,true)).nodeId,session.nodeId);
 assert.equal(S.CANON?.consciouness||S.template("1").canon.consciouness,"consciouness");
 assert.equal(T.SAFETY.build,"1+1=2 BUILD");
 assert.equal(T.SAFETY.clear,"1-1=0 CLEAR");
});
test("malformed catalogs cannot silently merge original identities or remove roles",()=>{
 const data=JSON.parse(JSON.stringify(catalog));
 data.sourceRecords.push({...data.sourceRecords[0]});
 assert.throws(()=>T.catalogCheck(data),/Duplicate/);
 const other=JSON.parse(JSON.stringify(catalog));
 other.roles.pop();assert.throws(()=>T.catalogCheck(other),/roles/);
});
