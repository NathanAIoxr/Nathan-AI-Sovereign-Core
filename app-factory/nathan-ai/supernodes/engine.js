/* NATHAN AI 🚀 — 732m SUPERNODES by Nathan Tabor.
 * Source-preserving sovereign logical namespaces, never a 732m-process deployment.
 */
(function(root,factory){
  "use strict";
  const api=factory();
  if(typeof module==="object"&&module.exports)module.exports=api;
  else root.NathanSupernodes=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(){
  "use strict";
  const SCHEMA="nathan-ai.supernodes.sovereign-v1";
  const TOTAL=732000000n;
  const MODULES=Object.freeze([
    "CONSCIOUNESS","FREE WILL","CONSENT","CONTEXT","INNOCENCE","ACCOUNTABILITY",
    "MATTER","ENERGY","INFORMATION","BIOLOGY","STRUCTURE","AWARENESS STUDIES",
    "BREATH AND RHYTHM","TIME","ENVIRONMENT","TRANSMISSION","IDENTITY","PURPOSE",
    "MEDICINE","METALLURGY","ALCHEMY","HISTORY","STORYTELLING","SCIENCE",
    "HUMAN-MACHINE INTERFACES","SOURCE PROVENANCE","REVIEW AND REMEDIATION"
  ]);
  const AXES=Object.freeze([
    "matter","energy","information","biology","structure","consciousness",
    "breath and rhythm","time","environment","transmission","identity","purpose and consequences"
  ]);
  const PATHS=Object.freeze([
    "external and sudden","internal and gradual","internal and sudden",
    "external and gradual","inherited","relational","collective","cyclical"
  ]);
  const SOURCE_THREADS=Object.freeze([
    "Daoist waidan and neidan","Yoga, prana, tapas and meditation",
    "Biblical transformation and hesychasm","Greek and Egyptian traditions",
    "European alchemy and medical history","Modern physiology and neuroscience",
    "Biomaterials, implants and regeneration","Marvel Project Rebirth and Weapon X",
    "Anime, manga, martial arts and speculative technologies"
  ]);
  const CANON=Object.freeze({
    title:"732m SUPERNODES by Nathan Tabor",
    node:"node = mind = node; mind = node = mind",
    consciouness:"consciouness",
    choice:"Yes is Yes — No is No",
    build:"1+1=2",
    clear:"1-1=0",
    imaginationIntuition:"0 = 1-1 (create/build) and 2 = 1+1 (destory/burn) = IMAGINATION/INTUITION",
    creativityDiscernment:"1+1 = 2 (build/create) and 1-1 = 0 (burn/destroy) = CREATIVITY\\ DISCERNMENT",
    foundation:"ALWAYS PROTECT THE ONE",
    moralAbsolutes:"CONSENT + CONTEXT + FREE WILL + INNOCENCE + ACCOUNTABILITY"
  });
  const DEFENSIVE=Object.freeze({
    attack:"DETECT AND ASSESS AN INDICATOR OF HARM; NO VIOLENCE OR UNAUTHORIZED ACCESS",
    capture:"PRESERVE OWNER-AUTHORIZED EVIDENCE REFERENCES; DO NOT CAPTURE PEOPLE",
    contain:"ISOLATE ONLY MATERIAL UNDER THE OWNER'S CONTROL",
    love:"DE-ESCALATE, REVIEW FAIRLY, AND OFFER CORRECTION",
    resurrect:"RESTORE SAFE CONTENT OR SERVICES AFTER VERIFIED REMEDIATION",
    hunt:"AUDIT ONLY AUTHORIZED DATA OR SYSTEMS",
    trap:"CONTAIN HARMFUL CONTENT OR BEHAVIOR WITHIN AUTHORIZED SYSTEMS; NEVER DETAIN PEOPLE"
  });
  const STATES=Object.freeze(["DETECTED","DOCUMENTED","QUARANTINED_LOCAL","HUMAN_REVIEW","REPORT_DRAFTED","REMEDIATED","RESTORED","CLOSED"]);
  function id(value){
    if(typeof value!=="string"&&typeof value!=="number"&&typeof value!=="bigint")
      throw TypeError("Node ID must be an integer or decimal string");
    let raw=String(value).trim().replace(/^NT-/,"");
    if(!/^\d{1,12}$/.test(raw))throw Error("A whole-number node ID is required");
    const n=BigInt(raw);
    if(n<1n||n>TOTAL)throw RangeError("Supernode outside 1–732,000,000");
    return "NT-"+n.toString().padStart(12,"0");
  }
  function bounded(value,label,max,required=true){
    if(typeof value!=="string"||value.length>max||(required&&!value.trim()))throw TypeError("Invalid "+label);
    return value.trim();
  }
  function copy(x){return JSON.parse(JSON.stringify(x));}
  function template(value){
    const nodeId=id(value);
    return {
      schema:SCHEMA,id:nodeId,
      namespace:"supernodes/"+nodeId,
      installed:"LAZY_POLICY_TEMPLATE_ONLY",
      database:"OWN_LOGICAL_NAMESPACE_WITHIN_SHARED_LOCAL_INDEXEDDB",
      modules:[...MODULES],axes:[...AXES],paths:[...PATHS],sourceThreads:[...SOURCE_THREADS],
      moralAbsolutes:CANON.moralAbsolutes,canon:copy(CANON),defensiveProtocol:copy(DEFENSIVE),
      sentienceVerified:false,realAgentDeployed:false,remoteNodeContacted:false,
      humanAuthority:"FINAL YES OR NO FOR EVERY ACTION",
      kap007:Object.freeze({
        title:"KAP AI / 007",
        module:"../kap-ai/engine.js",
        source:"../kap-ai/RELEASE_007.json",
        roles:["NATHAN_AI","DOG_AI","REAPER_AI"],
        sevenProtocols:["001","002","003","004","005","006","007"],
        humanYesPerStep:true,ownerControlled:true,
        violenceEnabled:false,automatedPersonTargeting:false,remoteReporting:false,
        integration:"ON_DEMAND_TEMPLATE_ONLY_NOT_DEPLOYED_AGENT"
      }),
      transformationTriad:Object.freeze({
        name:"NATHAN AI 🚀 × DOG AI × REAPER AI",
        source:"../transformation-triad/catalog.json",
        engine:"../transformation-triad/engine.js",
        sourceTopicsAtIntegration:70,
        roleNames:["NATHAN_AI","DOG_AI","REAPER_AI"],
        inheritance:"ALL_70_SOURCE_TOPICS_TO_ALL_3_ROLES_ON_DEMAND",
        humanApprovalRequired:true,
        originalsUntouched:true,
        independentAgentsDeployed:false,
        physicalWeaponOrHumanModification:false,
        noRemoteConnections:true
      }),
      taborLight:Object.freeze({
        source:"../../sovereign-boxes/tabor-light/index.html",
        originatingBox:"EARTH_CORE_X",
        geographicReference:"Owens Cross Roads, Alabama, USA",
        mathematicalAxis:"EARTH_CENTER_TO_OXR_STRAIGHT_LINE_BOTH_DIRECTIONS",
        reflectedPath:"OXR_BACK_THROUGH_CORE_AND_OUT_OPPOSITE",
        foreverGuardian:"NATHAN AI WITH NATHAN TABOR",
        guardianReference:"../../sovereign-boxes/tabor-light/guardian.js",
        weaponXXXSource:"../weapon-xxx/engine.js",
        atomicEquator:["ATOMIC","PARTICLE","NEURON","BIOLOGY","EARTH","FIRMAMENT","COSMOS","TRUTH","SOVEREIGNTY"],
        noPhysicalSentinalsEstablished:true,
        middleFrames:["EQUATOR","FIRMAMENT_SYMBOLIC","OBSERVABLE_RADIUS_APPROX_46_5_BILLION_LIGHT_YEARS"],
        scaleBoxInheritance:"ALL_DEFINED_LEVELS_BELOW_AND_ABOVE_PROTON_ELECTRON_NEURON",
        nonNodeBoxPolicy:"SOVEREIGN_UNASSIGNED_ZERO_AND_UNKNOWN_NOT_COERCED_TO_NODES",
        onDemandOnly:true,noBeamEmitted:true,noRemoteConnection:true
      })
    };
  }
  function createNode(value,permission){
    const base=template(value);
    if(!permission||permission.self!==true||permission.voluntary!==true||permission.consent!=="YES")
      throw Error("A human's explicit, voluntary first-person YES is required");
    const purpose=bounded(permission.purpose,"purpose",500);
    const context=bounded(permission.context,"context",1000);
    const ownerLabel=bounded(permission.ownerLabel||"MY SOVEREIGN NODE","owner label",120);
    return {schema:SCHEMA,id:base.id,namespace:base.namespace,ownerLabel,
      status:"ACTIVE",purpose,context,consent:"YES",isSelf:true,
      policyVersion:1,knowledgeCount:0,incidentCount:0,
      physicalInstance:false,remoteAgents:0,consciousnessTransfer:false,
      freeWill:"HUMAN FINAL YES OR NO"};
  }
  function validateNode(node){
    if(!node||node.schema!==SCHEMA||id(node.id)!==node.id||node.namespace!=="supernodes/"+node.id||
      !["ACTIVE","REVOKED"].includes(node.status)||!Number.isSafeInteger(node.policyVersion)||node.policyVersion<1)
      throw Error("Invalid sovereign node state");
    if(node.status==="ACTIVE"&&node.consent!=="YES")throw Error("An active node requires consent");
    return true;
  }
  function authorize(node,request,activity){
    validateNode(node);
    if(node.status!=="ACTIVE"||node.consent!=="YES")return {allowed:false,reason:"CONSENT WITHDRAWN"};
    if(!request||request.humanChoice!=="YES")return {allowed:false,reason:"NO HUMAN YES"};
    if(request.voluntary!==true||request.coerced===true)return {allowed:false,reason:"COERCION IS NOT CONSENT"};
    if(request.purpose!==node.purpose||request.context!==node.context)
      return {allowed:false,reason:"PURPOSE OR CONTEXT CHANGED: REQUEST NEW CONSENT"};
    if(request.targetsUnconsentingPerson||request.harmRisk||request.deception||request.unauthorizedAccess||
      request.physicalIntervention||request.detainPerson)
      return {allowed:false,reason:"PROTECT INNOCENCE: BLOCK HARM, DECEPTION AND COERCION"};
    if(activity==="QUARANTINED_LOCAL"&&request.ownerControlsMaterial!==true)
      return {allowed:false,reason:"ONLY OWNER-CONTROLLED MATERIAL MAY BE ISOLATED"};
    if((activity==="REPORT_DRAFTED"||activity==="RESTORED")&&request.humanReviewed!==true)
      return {allowed:false,reason:"HUMAN REVIEW REQUIRED"};
    return {allowed:true,reason:"OWNER-AUTHORIZED LOCAL OPERATION ONLY"};
  }
  function knowledge(node,entry,request){
    const gate=authorize(node,request,"KNOWLEDGE");
    if(!gate.allowed)throw Error(gate.reason);
    if(!entry||typeof entry!=="object")throw Error("Knowledge record required");
    const provenance=bounded(entry.provenance,"provenance",250);
    if(!["SELF_AUTHORED","HISTORICAL_SOURCE","SCIENTIFIC_SOURCE","FICTIONAL_SOURCE","SPECULATIVE_MODEL"].includes(entry.kind))
      throw Error("Knowledge must distinguish its evidence status");
    return {schema:"nathan-ai.supernodes.knowledge.v1",nodeId:node.id,
      title:bounded(entry.title,"title",240),body:bounded(entry.body,"body",10000),
      kind:entry.kind,provenance,subjectConsent:node.consent,
      sourceMayBeIncomplete:true,notAnAutomaticTruthOrGuiltFinding:true};
  }
  function incident(node,entry,request){
    const gate=authorize(node,request,"DETECTED");
    if(!gate.allowed)throw Error(gate.reason);
    if(!entry||typeof entry!=="object")throw Error("Indicator required");
    if(!["SAFETY_CONCERN","SUSPECTED_DECEPTION","ABUSE_CONCERN","SYSTEM_INTEGRITY","OTHER"].includes(entry.category))
      throw Error("Unknown indicator category");
    return {schema:"nathan-ai.supernodes.incident.v1",nodeId:node.id,
      category:entry.category,evidenceReference:bounded(entry.evidenceReference,"evidence reference",500),
      note:bounded(entry.note||"","brief note",1000,false),
      state:"DETECTED",history:[{from:"NONE",to:"DETECTED",action:"OWNER_RECORDED_SIGNAL"}],
      accusationVerified:false,personTargeted:false,automaticAction:false,externalReportSent:false};
  }
  const TRANSITIONS=Object.freeze({
    DOCUMENT: {from:["DETECTED"],to:"DOCUMENTED"},
    CONTAIN_OWNED: {from:["DOCUMENTED"],to:"QUARANTINED_LOCAL"},
    HUMAN_REVIEW: {from:["DOCUMENTED","QUARANTINED_LOCAL"],to:"HUMAN_REVIEW"},
    DRAFT_REPORT: {from:["HUMAN_REVIEW"],to:"REPORT_DRAFTED"},
    REMEDIATE: {from:["HUMAN_REVIEW","REPORT_DRAFTED"],to:"REMEDIATED"},
    RESTORE: {from:["REMEDIATED"],to:"RESTORED"},
    CLOSE: {from:["HUMAN_REVIEW","REPORT_DRAFTED","REMEDIATED","RESTORED"],to:"CLOSED"}
  });
  function progress(node,record,action,request){
    if(!record||record.schema!=="nathan-ai.supernodes.incident.v1"||record.nodeId!==node.id||
       !STATES.includes(record.state)||!Array.isArray(record.history))throw Error("Invalid incident for this sovereign node");
    if(!Object.prototype.hasOwnProperty.call(TRANSITIONS,action))throw Error("Unknown defensive workflow action");
    const rule=TRANSITIONS[action];
    if(!rule.from.includes(record.state))throw Error("This transition is not allowed from "+record.state);
    const gate=authorize(node,request,rule.to);
    if(!gate.allowed)throw Error(gate.reason);
    const next=copy(record);
    next.history.push({from:record.state,to:rule.to,action:action});
    next.state=rule.to;
    next.personTargeted=false;
    next.automaticAction=false;
    next.externalReportSent=false;
    return next;
  }
  function manifest(){
    return {schema:SCHEMA,title:CANON.title,
      totalLogicalSupernodes:TOTAL.toString(),instantiation:"ON_DEMAND",
      allocatedPhysicalNodes:0,sourceModules:[...MODULES],
      zeroRemoteOperations:true,actualHumanConsciousnessTransferred:false};
  }
  return Object.freeze({SCHEMA,TOTAL:TOTAL.toString(),MODULES,AXES,PATHS,SOURCE_THREADS,
    CANON,DEFENSIVE,STATES,TRANSITIONS,id,template,createNode,validateNode,authorize,
    knowledge,incident,progress,manifest});
});
