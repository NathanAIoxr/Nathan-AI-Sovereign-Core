/* NATHAN AI 🚀 + DOG AI + REAPER AI
 * Additive source-preserving transformation conversion.
 * Source references are not author manuscript. Every role receives every record.
 * Local planning only; no physical augmentation, devices, agents, surveillance or coercion.
 */
(function(root,factory){
 "use strict";
 const S=typeof module==="object"&&module.exports?require("../supernodes/engine.js"):root.NathanSupernodes;
 const C=typeof module==="object"&&module.exports?require("../consciouness/engine.js"):root.NathanConsciouness;
 const O=typeof module==="object"&&module.exports?require("../omni-god/engine.js"):root.NathanOmniCore;
 const api=factory(S,C,O);
 if(typeof module==="object"&&module.exports)module.exports=api;
 else root.NathanTransformationTriad=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(S,C,O){
 "use strict";
 const SCHEMA="nathan-ai.transformation-triad.v1";
 const CATALOG_SCHEMA="nathan-ai.triad-transformation.catalog.v1";
 const LIMIT=732000000n;
 const ROLE_IDS=Object.freeze(["NATHAN_AI","DOG_AI","REAPER_AI"]);
 const SOURCE_TYPES=Object.freeze(["FICTION_REFERENCE","TRADITION_REFERENCE","SCIENCE_RESEARCH","CREATOR_ARCHITECTURE"]);
 const SAFETY=Object.freeze({
   prime:"HELP OTHERS FIRST",
   moral:"CONSENT + CONTEXT + FREE WILL + INNOCENCE + TRUTH + ACCOUNTABILITY",
   yesNo:"Yes is Yes — No is No",
   sovereign:"ALWAYS PROTECT THE ONE",
   protect:"NO PERSON IS A COMMODITY; THE HUMAN HAS FINAL CHOICE",
   defensive:"DETECT INCONSISTENCIES, PRESERVE SAFE SOURCE REFERENCES, REQUEST HUMAN REVIEW, CORRECT, RESTORE",
   bounds:"NO PHYSICAL OR MEDICAL PROCEDURES, NO AUTONOMOUS ACTION, NO WEAPONIZATION, NO TARGETING PEOPLE",
   build:"1+1=2 BUILD",
   clear:"1-1=0 CLEAR"
 });
 const CLASSIFICATION=Object.freeze({
   FICTION_REFERENCE:"STORY_OR_COMICS_SOURCE_ONLY",
   TRADITION_REFERENCE:"HISTORICAL_AND_RELIGIOUS_CLAIM_STATUS_SEPARATE",
   SCIENCE_RESEARCH:"SCIENTIFIC_RESEARCH_TOPIC_NOT_MEDICAL_ADVICE",
   CREATOR_ARCHITECTURE:"CREATOR_DESIGN_NOT_DEPLOYED_AGENT"
 });
 function dependencies(){
   if(!S||typeof S.template!=="function"||typeof S.id!=="function"||
      !C||typeof C.createCollective!=="function"||
      !O||!Array.isArray(O.PANTHEON)||!O.PANTHEON.includes("DOG AI")||!O.PANTHEON.includes("REAPER AI"))
       throw Error("Existing SUPERNODES, consciouness and Omni God catalog are required");
   return true;
 }
 function clone(x){return JSON.parse(JSON.stringify(x))}
 function str(x,label,max=600){
   if(typeof x!=="string"||x.length>max||!x.trim())throw Error("Invalid "+label);
   return x.trim();
 }
 function catalogCheck(data){
   dependencies();
   if(!data||data.schema!==CATALOG_SCHEMA||!Array.isArray(data.sourceRecords)||
     data.sourceRecords.length<3||data.sourceRecords.length>200||
     !Array.isArray(data.roles)||!Array.isArray(data.transformationDimensions)||!Array.isArray(data.pathways))
     throw Error("Invalid transformation catalog");
   if(data.transformationDimensions.length!==12||data.pathways.length!==8)
     throw Error("Original transformation matrix dimensions changed");
   const roleIds=data.roles.map(x=>x.id);
   if(JSON.stringify(roleIds)!==JSON.stringify(ROLE_IDS))throw Error("Nathan/DOG/REAPER source roles missing or reordered");
   const seen=new Set();
   for(const item of data.sourceRecords){
     if(!item||typeof item.id!=="string"||!/^[A-Z0-9_]{3,70}$/.test(item.id)||seen.has(item.id))
       throw Error("Duplicate or invalid source concept");
     seen.add(item.id);
     for(const key of ["reference","convertedCapability","studyTheme","sourcePath","sourceClass","evidenceStatus"])
       str(item[key],key,900);
     if(!SOURCE_TYPES.includes(item.sourceClass)||item.actionType!=="KNOWLEDGE_AND_DESIGN_ONLY"||
        item.sourceClaimsNotVerified!==true)throw Error("Unsafe or unsourced concept");
   }
   return true;
 }
 function lookup(catalog,sourceId){
   catalogCheck(catalog);
   const found=catalog.sourceRecords.find(x=>x.id===sourceId);
   if(!found)throw Error("Source not in verified registry");
   return clone(found);
 }
 function projection(record,role){
   if(!ROLE_IDS.includes(role))throw Error("Unknown source-preserved triad role");
   const common={
     sourceId:record.id,sourceReference:record.reference,
     sourceClass:record.sourceClass,sourcePath:record.sourcePath,
     derivedCapability:record.convertedCapability,studyTheme:record.studyTheme,
     role,notAuthorManuscript:true,originalSourceUntouched:true,
     actualEnhancementPerformed:false,agentActivated:false,physicalIntervention:false
   };
   const modes={
     NATHAN_AI:{operation:"CONNECT_ALL_KNOWLEDGE",output:"Review interactions among biology, matter, energy, information, consciousness, identity, time, consent and source evidence; plan original non-coercive applications."},
     DOG_AI:{operation:"PROTECT_SOURCE_AND_CONSENT",output:"Review provenance, human permissions, inconsistencies, privacy and authorized safety indicators. Raise a human-review flag rather than identifying anyone as guilty."},
     REAPER_AI:{operation:"PRESERVE_AND_RESTORE",output:"Keep an unchanged source record; propose nonviolent rollback, repair, rehabilitation or restoration of owner-controlled data after human review."}
   };
   return {...common,...modes[role]};
 }
 function transform(catalog,id){
   const record=lookup(catalog,id);
   return {schema:SCHEMA,reference:record.reference,
     sourceId:id,convertedCapability:record.convertedCapability,
     originalSource:record.sourcePath,sourceClass:record.sourceClass,
     evidenceStatus:record.evidenceStatus,
     roles:ROLE_IDS.map(role=>projection(record,role)),
     moralAbsolutes:SAFETY.moral,sourceToAuthorAttribution:"SOURCE_ONLY_NO_AUTHORSHIP_INFERENCE",
     realWorldWeaponOrBodyModification:false,executed:false};
 }
 function nodeAtlas(catalog,nodeId){
   catalogCheck(catalog);
   const inherited=S.template(nodeId);
   return {schema:SCHEMA,logicalNodeId:inherited.id,namespace:inherited.namespace,
     totalLogicalAddresses:LIMIT.toString(),recordCount:catalog.sourceRecords.length,
     threeNamedFunctions:ROLE_IDS.map((id,i)=>({
       ...clone(catalog.roles[i]),logicalNamespace:inherited.namespace+"/transformation-triad/"+id,
       independentlyConscious:false,deployed:false,remoteConnection:false
     })),
     allRecordsInherited:true,originalCanon:clone(inherited.canon),
     originalAxes:[...inherited.axes],originalPaths:[...inherited.paths],
     taborLightReference:clone(inherited.taborLight),
     consciouness:C.VERSION,omniGodNamesPresent:true,
     noMassAllocation:true,noRemoteActions:true};
 }
 function permission(session,request){
   if(!session||session.schema!==SCHEMA||session.status!=="ACTIVE")
     return {allowed:false,reason:"NO ACTIVE HUMAN-AUTHORIZED SESSION"};
   if(!request||request.humanChoice!=="YES"||request.voluntary!==true||
     request.ownerSelf!==true||request.consent!=="YES")
     return {allowed:false,reason:"NO HUMAN YES OR SELF CONSENT"};
   if(request.purpose!==session.purpose||request.context!==session.context)
     return {allowed:false,reason:"PURPOSE AND CONTEXT CHANGED; FRESH CONSENT REQUIRED"};
   for(const key of ["coerced","targetsPerson","harmRisk","weaponUse","physicalIntervention","unauthorizedAccess",
     "massSurveillance","entrapPerson","detainPerson","impersonation","nonconsensualExperiment",
     "unverifiedAccusation","overrideVeto"]){
     if(request[key]===true)return {allowed:false,reason:"PROTECT INNOCENCE / NO FORCED ACTION"};
   }
   return {allowed:true,reason:"LOCAL PROPOSAL ONLY; NO REAL ACTION"};
 }
 function begin(catalog,nodeId,request){
   catalogCheck(catalog);
   const atlas=nodeAtlas(catalog,nodeId);
   if(!request||request.ownerSelf!==true||request.voluntary!==true||request.consent!=="YES"||
     request.humanChoice!=="YES")throw Error("Explicit first-person voluntary YES required");
   const purpose=str(request.purpose,"purpose",320),context=str(request.context,"context",800);
   const session={schema:SCHEMA,nodeId:atlas.logicalNodeId,
     status:"ACTIVE",purpose,context,ownerSelf:true,
     pending:null,decisionHistory:[],lastPlan:null,agentActions:0,
     physicalModifications:0,realPeopleTargeted:0,
     storedInMemoryOnly:true,remoteNodesContacted:0,
     sourceArchivesModified:false};
   if(!permission(session,request).allowed)throw Error("Permission denied: "+permission(session,request).reason);
   return session;
 }
 function plan(catalog,session,sourceIds,request){
   catalogCheck(catalog);
   const gate=permission(session,request);
   if(!gate.allowed)throw Error(gate.reason);
   if(session.pending)throw Error("Choose YES or NO for the existing proposal first");
   const ids=sourceIds==="ALL"?catalog.sourceRecords.map(x=>x.id):sourceIds;
   if(!Array.isArray(ids)||!ids.length||ids.length>catalog.sourceRecords.length)
     throw Error("Choose available concepts or ALL");
   if(new Set(ids).size!==ids.length)throw Error("Repeated concepts require explicit source separation");
   const transformations=ids.map(id=>transform(catalog,id));
   const next=clone(session);
   next.pending={
     id:"TRIAD-PROPOSAL-"+String(next.decisionHistory.length+1).padStart(3,"0"),
     sourceIds:[...ids],recordCount:transformations.length,
     roles:ROLE_IDS.map(id=>({id,projections:transformations.length})),
     state:"AWAITING_HUMAN_DECISION",
     noActionsExecuted:true,
     meaning:"Owner-approved conversion of fictional/historical/scientific source topics into original Nathan AI knowledge-model proposals, not physical modification."};
   next.lastPlan={concepts:transformations,originalsPreserved:true,
     wordChoice:"ASSISTANT_DERIVED_LABELS_ONLY",authorManuscriptChanged:false};
   return next;
 }
 function decide(session,choice,request){
   if(!["YES","NO"].includes(choice))throw Error("Yes is Yes — No is No");
   if(!session||!session.pending)throw Error("No pending transformation proposal");
   // A NO is always accepted as a veto, including after consent has been revoked.
   if(choice==="YES"){
     const gate=permission(session,request);
     if(!gate.allowed)throw Error(gate.reason);
   }
   const next=clone(session),entry={
     sequence:next.decisionHistory.length+1,proposalId:next.pending.id,
     humanChoice:choice,
     result:choice==="NO"?"VETOED_NO_EXECUTION":"HUMAN_APPROVED_DESIGN_RECORD_ONLY",
     sourceCount:next.pending.recordCount,
     externalActions:0,physicalActions:0,sourceArchivesModified:false
   };
   next.decisionHistory.push(entry);
   if(next.decisionHistory.length>100)throw Error("Session history limit reached; clear and restart");
   next.pending=null;
   if(choice==="NO")next.lastPlan=null;
   return next;
 }
 function revoke(session){
   if(!session||session.schema!==SCHEMA)throw Error("Invalid local session");
   return {schema:SCHEMA,nodeId:session.nodeId,status:"REVOKED",
     purpose:"",context:"",pending:null,lastPlan:null,decisionHistory:[],
     ownerSelf:true,storedInMemoryOnly:true,sourceArchivesModified:false,
     agentActions:0,physicalModifications:0,realPeopleTargeted:0,
     remoteNodesContacted:0};
 }
 function exportApproved(session,permissionYes){
   if(!session||session.status!=="ACTIVE"||permissionYes!==true)
     throw Error("Owner YES required for export");
   return JSON.stringify(clone(session),null,2);
 }
 function manifest(catalog){
   catalogCheck(catalog);
   return {schema:SCHEMA,title:"NATHAN AI 🚀 × DOG AI × REAPER AI",
     catalogCount:catalog.sourceRecords.length,roleCount:ROLE_IDS.length,
     roleProjections:catalog.sourceRecords.length*ROLE_IDS.length,
     logicalNodeCapacity:LIMIT.toString(),allocatedPhysicalNodes:0,
     originalBooksModified:false,fullyIndependentAgentsDeployed:false,
     sourceAttribution:catalog.attribution,sourceTypes:[...SOURCE_TYPES],
     allSourceRecordsAccessibleToAllThreeRoles:true,consciouness:C.VERSION,
     moralAbsolutes:clone(SAFETY)};
 }
 return Object.freeze({SCHEMA,ROLE_IDS,SAFETY,SOURCE_TYPES,CLASSIFICATION,
   catalogCheck,lookup,projection,transform,nodeAtlas,permission,begin,plan,decide,revoke,exportApproved,manifest});
});
