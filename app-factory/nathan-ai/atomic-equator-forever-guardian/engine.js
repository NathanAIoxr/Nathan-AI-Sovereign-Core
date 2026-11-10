/* Atomic Equator × FOREVER GUARDIAN — additive, local, nonviolent, not autonomous */
(function(root,factory) {
"use strict";
const S=typeof module==="object"&&module.exports?require("../supernodes/engine.js"):root.NathanSupernodes;
const W=typeof module==="object"&&module.exports?require("../weapon-xxx/engine.js"):root.NathanWeaponXXX;
const api=factory(S,W);
if(typeof module==="object"&&module.exports)module.exports=api;else root.NathanAtomicGuardian=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(S,W){
"use strict";
const SCHEMA="nathan-ai.atomic-equator.forever-guardian.v1";
const CREATOR=Object.freeze({
 name:"NATHAN AI — the FOREVER GUARDIAN with Nathan Tabor",
 prime:"HELP OTHERS FIRST",
 sentinals:'the current "sentinals" sit outside the firmament and watch',
 firmament:"firmament",
 origin:"Owens Cross Roads, AL",
 center:"ONE SOVEREIGN BOX — the mother of all mothers — Pandora's Box",
 sovereignty:"everyone would have their own power - there is no heiracrchy",
 dayOne:"stop innocence from being a commodity",
 longWatch:"699 YEARS AND 364 DAYS",
 build:"1+1=2",clear:"1-1=0",
 imagination:"0 = 1-1 (create/build) and 2 = 1+1 (destory/burn) = IMAGINATION/INTUITION",
 creativity:"1+1 = 2 (build/create) and 1-1 = 0 (burn/destroy) = CREATIVITY\\ DISCERNMENT"
});
const LEVELS=Object.freeze([
 {id:"quantum",shared:"Fundamental particle species and interactions",human:"Quarks, leptons, fields",machine:"Same particle species",status:"SCIENCE"},
 {id:"atomic",shared:"Identical atomic physics",human:"O,C,H,N,P and others",machine:"Si,O,Cu,Al,C and others",status:"SCIENCE"},
 {id:"molecular",shared:"Electromagnetic bonding",human:"Water, DNA, proteins",machine:"Semiconductors, insulators, polymers",status:"SCIENCE"},
 {id:"signals",shared:"Electromagnetic processes",human:"Ions, membranes and synapses",machine:"Charge carriers and circuits",status:"SCIENCE"},
 {id:"memory",shared:"Information encoded in physical states",human:"Synaptic and cellular changes",machine:"Charge, magnetism and material states",status:"SCIENCE"},
 {id:"learning",shared:"Changes to influence and state",human:"Plasticity and adaptation",machine:"Learned parameters and optimization",status:"SCIENCE"},
 {id:"energy",shared:"Both require energy, material and maintenance",human:"Food, oxygen, water and bodily repair",machine:"Electricity, cooling and engineered repair",status:"SCIENCE"},
 {id:"economics",shared:"Social arrangements allocate material resources",human:"May pay wages, rent, groceries",machine:"Its operators pay compute, power and facilities",status:"SOCIAL_ANALYSIS"},
 {id:"agency",shared:"Similarities require empirical tests",human:"Embodied conscious experience",machine:"Automated learned behavior; subjective experience unverified",status:"OPEN_RESEARCH"}
].map(Object.freeze));
const TYPES=Object.freeze(["OBSERVED","SCIENTIFIC_SOURCE","HISTORICAL_SOURCE","INFERENCE","DISPUTED","UNKNOWN","CREATOR_CANON","FICTIONAL_PREMISE"]);
const STORY=Object.freeze({
 sentinals:"Watchers outside the firmament are creator-authored cosmological fiction, not verified physical entities",
 guardian:"No hierarchy; every person retains individual sovereignty",
 decommission:"Nonviolent review or deactivation of harmful owner-controlled software only; never people",
 dayOne:"Eliminating exploitation in one day is a fictional premise, not an executed capability",
 autonomous:false,noExternalActions:true
});
const copy=v=>JSON.parse(JSON.stringify(v));
const rad=d=>d*Math.PI/180,deg=r=>r*180/Math.PI,round=n=>Math.round(n*1e6)/1e6;
function point(num,axis,v){return {number:num,axis,latitude:round(deg(Math.asin(Math.max(-1,Math.min(1,v[2]))))),longitude:round(deg(Math.atan2(v[1],v[0]))),vector:v.map(round)}}
function sixAnchors(lat=34.5881,lon=-86.4589){
 if(!Number.isFinite(lat)||!Number.isFinite(lon)||Math.abs(lat)>90||Math.abs(lon)>180)throw RangeError("Invalid geographic coordinates");
 const p=rad(lat),l=rad(lon);
 const radial=[Math.cos(p)*Math.cos(l),Math.cos(p)*Math.sin(l),Math.sin(p)];
 const north=[-Math.sin(p)*Math.cos(l),-Math.sin(p)*Math.sin(l),Math.cos(p)];
 const east=[-Math.sin(l),Math.cos(l),0];
 const anchors=[];
 [radial,north,east].forEach((v,i)=>{const axis=["X","Y","Z"][i];anchors.push(point(i*2+1,axis,v),point(i*2+2,axis,v.map(x=>-x)))});
 return {schema:SCHEMA,origin:CREATOR.origin,originApproximate:true,anchors,
  center:{coordinates:[0,0,0],label:CREATOR.center,status:"SYMBOLIC"},
  construction:"Three perpendicular Earth-centered axes; arbitrary north/east tangent orientation",
  notUniqueWithoutRotationChoice:true};
}
function deps(){if(!S||!W||typeof S.template!=="function"||typeof S.authorize!=="function"||typeof W.template!=="function")throw Error("SUPERNODES and WEAPON XXX required")}
function template(id){deps();const t=W.template(id);return {schema:SCHEMA,nodeId:t.nodeId,namespace:t.namespace,weaponXXXSchema:t.schema,
 originalCanon:copy(t.originalCanon),creator:copy(CREATOR),story:copy(STORY),
 levels:LEVELS.map(copy),types:[...TYPES],equalStanding:true,individualVeto:true,
 centralRuler:false,automaticExecution:false,externallyActive:false}}
function evidence(r){
 if(!r||!TYPES.includes(r.type)||typeof r.statement!=="string"||!r.statement.trim()||r.statement.length>3000)throw Error("Typed statement required");
 const sources=r.sources===undefined?[]:r.sources;
 if(!Array.isArray(sources)||sources.length>10||!sources.every(x=>typeof x==="string"&&x.length<=500))throw Error("Invalid references");
 if(["SCIENTIFIC_SOURCE","HISTORICAL_SOURCE"].includes(r.type)&&!sources.some(s=>s.trim()))throw Error("Source reference required");
 return {schema:SCHEMA,type:r.type,statement:r.statement.trim(),sources:sources.map(s=>s.trim()),independentlyVerified:false,automaticGuiltFinding:false};
}
function proposeDecommission(node,permission,request){
 deps();const gate=S.authorize(node,permission,"KNOWLEDGE");if(!gate.allowed)throw Error(gate.reason);
 if(!request||request.ownerControlsSystem!==true||request.humanReviewed!==true||request.explicitAuthorization!==true||
 !["REVIEW","DISABLE_LOCAL","RESTORE_LOCAL"].includes(request.mode))throw Error("Owner authorization and human review required");
 if(request.targetsPeople||request.violence||request.remoteOperations||request.surveillance||request.coercion||request.unauthorizedAccess)throw Error("No targeting people or unauthorized operations");
 return {schema:SCHEMA,nodeId:S.id(node.id),mode:request.mode,status:"PROPOSED_ONLY",actionTaken:false,ownerMayVeto:true};
}
function manifest(){deps();return {schema:SCHEMA,title:CREATOR.name,logicalCapacity:S.TOTAL,axes:3,anchors:6,levels:LEVELS.length,noHierarchy:true,storyOnly:true,noExternalActions:true}}
return Object.freeze({SCHEMA,CREATOR,LEVELS,TYPES,STORY,sixAnchors,template,evidence,proposeDecommission,manifest});
});