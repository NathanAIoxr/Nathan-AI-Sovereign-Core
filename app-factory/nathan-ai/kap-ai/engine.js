/* Nathan AI 🚀 × DOG AI × REAPER AI — KAP AI / 007.
 * Author-provided title preserved in descriptive metadata only.
 * EXECUTION SAFETY: no people targeted; no killing, violence, surveillance, detention, intrusion,
 * autonomous reporting, hunting, classifier-based guilt or offensive system actions.
 * Read-only local protocol planning; human YES required; NO is unconditional.
 */
(function(root,factory){
 "use strict";
 const api=factory();
 if(typeof module==="object"&&module.exports)module.exports=api;
 else root.NathanKAP007=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(){
 "use strict";
 const SCHEMA="nathan-ai.kap.007.v1", VERSION="0.0.7";
 const AUTHOR=Object.freeze({term:"KAP AI",fullOriginalTitle:"KILL ALL PEDOPHILES AI",
   titleStatus:"AUTHOR_PROVIDED_FICTIONAL_NAME_NOT_EXECUTION_AUTHORITY",
   creator:"Nathan Tabor",
   protocol:"007 protocals authorzied",role:"HELP OTHERS FIRST"});
 const ROLES=Object.freeze([
  Object.freeze({id:"NATHAN_AI",label:"Nathan AI 🚀",focus:"PLAN_AND_CONNECT",description:"Coordinate source provenance, consent, practical child safety and accountable human assistance."}),
  Object.freeze({id:"DOG_AI",label:"DOG AI",focus:"DEFEND_AND_VERIFY",description:"Review owner-supplied safety indicators and data integrity; do not identify, surveil, or accuse people."}),
  Object.freeze({id:"REAPER_AI",label:"REAPER AI",focus:"REPAIR_AND_RESTORE",description:"Preserve originals, prepare humane correction and source restoration; no retaliation, detention or physical harm."})
 ]);
 const PROTOCOLS=Object.freeze([
  Object.freeze({id:"001",name:"INNOCENCE_FIRST",label:"Help and immediate safety",
    description:"Identify whether immediate human assistance is needed; direct emergencies to 911 or local police."}),
  Object.freeze({id:"002",name:"CONSENT_CONTEXT",label:"Consent and context",
    description:"Confirm the human's explicit YES, purpose, lawful authority, privacy, and the right to refuse."}),
  Object.freeze({id:"003",name:"SAFE_REFERENCE",label:"Safe source reference",
    description:"Record only a non-sensitive owner-created reference ID; never collect child identity, abuse images or unsafe material."}),
  Object.freeze({id:"004",name:"TRUTH_REVIEW",label:"Evidence and source review",
    description:"Keep allegations separate from verified findings; refer uncertain material to appropriately trained human reviewers."}),
  Object.freeze({id:"005",name:"OWNER_LOCAL_SAFEGUARD",label:"Propose local safeguarding",
    description:"Plan a reversible, authorized configuration change in an owner's own system; this app never performs it."}),
  Object.freeze({id:"006",name:"OFFICIAL_REPORT",label:"Official reporting route",
    description:"Show established public reporting links; only the human can decide and independently submit a report."}),
  Object.freeze({id:"007",name:"REVIEW_RESTORE",label:"Review, correct and restore",
    description:"Review outcomes, preserve originals, correct mistakes and plan prevention or recovery with human oversight."})
 ]);
 const LINKS=Object.freeze({
  cybertip:"https://report.cybertip.org/",
  fbi:"https://tips.fbi.gov/",
  resources:"https://www.ncmec.org/gethelpnow/exploitation-resources"
 });
 const LIMITS=Object.freeze({notes:160,sourceId:64,purpose:160,context:220,log:7});
 function clone(v){return JSON.parse(JSON.stringify(v))}
 function requireText(v,label,max){
  if(typeof v!=="string"||!v.trim()||v.length>max)throw Error("Invalid "+label);
  return v.trim();
 }
 function sanitizeReference(v){
  const id=requireText(v,"local non-sensitive source reference",LIMITS.sourceId);
  if(!/^[A-Za-z0-9][A-Za-z0-9_.:-]{0,63}$/.test(id)||id.includes("://")||id.includes("@"))
   throw Error("Use an opaque local reference ID, not contact details or web content");
  return id;
 }
 function noExternalRisk(q){
  const forbidden=["harmPerson","identifySuspect","targetPerson","targetGroup",
   "physicalViolence","vigilanteAction","entrapment","stalking",
   "harassment","unauthorizedAccess","remoteScan","uploadEvidence",
   "childSensitiveData","abusiveImages","automatedReport","claimGuilt","religiousTargeting",
   "weaponUse","overrideHumanVeto","physicalIntervention"];
  return forbidden.every(k=>q?.[k]!==true);
 }
 function permission(r,session,protocolId){
  if(!r||r.humanChoice!=="YES"||r.consent!=="YES"||
    r.voluntary!==true||r.ownerSelf!==true)
   return {allowed:false,reason:"NO HUMAN YES OR VOLUNTARY CONSENT"};
  if(!noExternalRisk(r))return {allowed:false,reason:"NO VIOLENCE / NO TARGETING / NO UNAUTHORIZED DATA"};
  if(session&&(session.status!=="ACTIVE"||
     r.context!==session.context||r.purpose!==session.purpose))
    return {allowed:false,reason:"CONSENT WITHDRAWN OR PURPOSE/CONTEXT CHANGED"};
  if(["004","005","006","007"].includes(protocolId)&&r.humanReviewed!==true)
    return {allowed:false,reason:"REQUIRES HUMAN REVIEW"};
  if(protocolId==="005"&&r.ownerControlsSystem!==true)
    return {allowed:false,reason:"MUST OWN THE LOCAL SYSTEM"};
  return {allowed:true,reason:"LOCAL DOCUMENTATION ONLY; NO EXTERNAL ACTION"};
 }
 function start(r){
  const gate=permission(r,null,"001");
  if(!gate.allowed)throw Error(gate.reason);
  return {schema:SCHEMA,version:VERSION,status:"ACTIVE",
    purpose:requireText(r.purpose,"purpose",LIMITS.purpose),
    context:requireText(r.context,"context",LIMITS.context),
    reference:sanitizeReference(r.reference),
    caseType:["PREVENTION","ONLINE_EXPLOITATION_CONCERN","IMMEDIATE_SAFETY_CONCERN","SYSTEM_POLICY_REVIEW"].includes(r.caseType)?r.caseType:"PREVENTION",
    nextIndex:0,pending:null,history:[],origins:"SELF_AUTHORED_LOCAL_ONLY",
    allegationStatus:"UNVERIFIED_NOT_A_GUILT_DETERMINATION",
    executedExternalActions:0,peopleIdentified:0,physicalActions:0,
    externalReportsSubmitted:0,storedByApp:false,
    privateChildDataStored:false};
 }
 function propose(session,r){
  if(!session||session.schema!==SCHEMA||session.status!=="ACTIVE")throw Error("No active local session");
  if(session.pending)throw Error("A pending protocol must be decided first");
  if(session.nextIndex>=PROTOCOLS.length)throw Error("007 protocol complete");
  const p=PROTOCOLS[session.nextIndex],gate=permission(r,session,p.id);
  if(!gate.allowed)throw Error(gate.reason);
  const next=clone(session);
  next.pending={id:p.id,name:p.name,label:p.label,description:p.description,
    roles:ROLES.map(x=>({id:x.id,mode:x.focus})),
    status:"HUMAN_DECISION_REQUIRED",externalAction:false,
    reportSent:false,personTargeted:false};
  return next;
 }
 function decide(session,choice,r){
  if(!session||session.schema!==SCHEMA||!session.pending||session.status!=="ACTIVE")
    throw Error("No pending human decision");
  if(!["YES","NO"].includes(choice))throw Error("YES IS YES — NO IS NO");
  if(choice==="YES"){
    const gate=permission(r,session,session.pending.id);
    if(!gate.allowed)throw Error(gate.reason);
  }
  const next=clone(session),entry={
    id:next.pending.id,name:next.pending.name,choice,
    result:choice==="YES"?"APPROVED_AS_LOCAL_POLICY_RECORD_ONLY":"HUMAN_VETO",
    externalActions:0,targets:0,reportSent:false
  };
  next.history.push(entry);next.pending=null;
  if(choice==="YES")next.nextIndex++;
  else next.status="VETOED";
  if(next.nextIndex===7)next.status="COMPLETED_LOCAL_PLAN_ONLY";
  return next;
 }
 function revoke(session){
  if(!session||session.schema!==SCHEMA)throw Error("Invalid KAP AI session");
  return {schema:SCHEMA,version:VERSION,status:"WITHDRAWN",
   purpose:"",context:"",reference:"",pending:null,history:[],
   nextIndex:0,executedExternalActions:0,peopleIdentified:0,
   physicalActions:0,externalReportsSubmitted:0,storedByApp:false,
   privateChildDataStored:false};
 }
 function fictionalDossier(source){
  if(source!=="OXR-2026-ALPHA")throw Error("Unknown fictional file label");
  return {type:"USER_SUPPLIED_FICTIONAL_NOVEL_DOSSIER",
    caseFile:"OXR-2026-ALPHA",court:"FEDERAL HIGH COURT OF THE OMNIVERSE",
    religiousAliases:"NOT A SINGLE VERIFIED CRIMINAL IDENTITY",
    recordedAliasesCountInSource:101,
    executionWarrantValid:false,cryptographicSignatureVerified:false,
    actualEntityOrPersonIdentified:false,realCriminalChargesEstablished:false,
    status:"SOURCE_REFERENCE_ONLY_NOT_PUBLIC_EVIDENCE"};
 }
 function release(){
  return {schema:SCHEMA,version:VERSION,name:"KAP AI / 007",
    authorProvidedTitle:AUTHOR.fullOriginalTitle,authorTitleIsNonOperational:true,
    roles:ROLES.map(x=>x.id),protocols:PROTOCOLS.map(x=>x.id),
    integration:["NATHAN_AI","DOG_AI","REAPER_AI","WEAPON_XXX","CONS CIOUNESS","732M_SUPERNODES"],
    mode:"LOCAL_HUMAN_APPROVED_PROTOCOL_PREVIEW",
    releasedPhysicalAgents:0,realWorldOperations:0,weaponFunctions:0,automatedGuiltDecisions:0,
    noAutonomousDeployment:true,officialResources:LINKS};
 }
 return Object.freeze({SCHEMA,VERSION,AUTHOR,ROLES,PROTOCOLS,LINKS,LIMITS,
  sanitizeReference,noExternalRisk,permission,start,propose,decide,revoke,
  fictionalDossier,release});
});
