/* Nathan AI 🚀 / EYES — two independent, reviewable decision engines.
   Original design inspired by fictional capabilities in Person of Interest.
   No surveillance, interception, biometric identification, remote control or autonomous external action.
   Preserve existing Living Eyes source and owner-defined naming. MIT-compatible standalone JS. */
(function(root,factory){'use strict';const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.NathanEyesEngines=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const freeze=Object.freeze;
const MACHINE_MODULES=freeze(['CORE ANALYTICS','NEURAL NETWORKS','HEURISTIC ENGINES','RECURSION PROCESSORS','EVOLUTIONARY GENERATORS','BAYESIAN NETWORKS','DATA ACQUISITION','CRYPTOGRAPHIC ALGORITHMS','DOCUMENT PROCESSORS','COMPUTATIONAL LINGUISTICS','VOICEPRINT IDENTIFICATION','NATURAL LANGUAGE PROCESSING','FACIAL RECOGNITION','GAIT ANALYSIS','BIOMETRIC RECOGNITION','SUBJECT IDENTIFICATION','PATTERN MINING','INTEL INTERPRETATION','THREAT DETECTION','THREAT CLASSIFICATION','DISSEMINATION PROTOCOLS','CONTINUITY-OF-OPERATIONS PROTOCOLS']);
const SAMARITAN_MODULES=freeze(['INPUTS','PREPROCESSING','NEURAL NETS','PATTERN RECOGNITION','MEMORY ASSIMILATION','MACHINE LEARNING','EVOLUTIONARY COMPUTATION','RATIONAL AGENTS','COGNITIVE ARCHITECTURES','HEURISTICS','ALGORITHMIC ENGINES','FLEXIBLE PLANNING','SOCIAL ENGINEERING','AUTONOMOUS IMPROVEMENT']);
const DATA_LABELS=freeze(['NYPD.DISPATCH.SYS','911.CENTER.SYS','NYPD.ALPR.SYS','NYPD.DASHCAM.SYS','NYPD.HELICAM.SYS','FAA.ATC.SYS','CELL.GPS.SYS','CELL.MIC.SYS','CELL.CAM.SYS','CELL.DATA.SYS','ISP.DATA.SYS','WIFI.NETWORK.SYS','NY.DMV.SYS','FBI.CODIS.SYS','FBI.IRFID.SYS','KH11.REG1.OPI.SYS','KH11.REG1.IR.SYS','DOMAIN.AWARE.MIC.SYS','DOMAIN.AWARE.OPS.SYS','DOMAIN.AWARE.MOSFET.SYS','ISP.HEARTBLEED2.SYS']);
const SOURCES=freeze([
 {category:'show',subject:'The Machine',basis:'On-screen startup list; fan transcription',confidence:'transcribed',count:22},
 {category:'show',subject:'Samaritan',basis:'Deus Ex Machina executive labels; fan transcription',confidence:'transcribed',count:14},
 {category:'show',subject:'Samaritan',basis:'Death Benefit beta interface labels; fan transcription',confidence:'transcribed',count:21},
 {category:'implementation',subject:'Nathan AI',basis:'Independent safe, local, deterministic simulation',confidence:'implemented',count:0}
]);
const MODEL=freeze({schema:'nathan-ai.eyes.twin-engines.v1',machineModules:MACHINE_MODULES,samaritanModules:SAMARITAN_MODULES,historicalFeedLabels:DATA_LABELS,sourceNotes:SOURCES,limitations:'Names from fictional displays are research metadata, NOT real data connectors or implemented neural/biometric systems.'});
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
const bits=n=>Array.from({length:6},(_,i)=>String((n>>i)&1)).join('');
const norm=n=>{if(!Number.isInteger(n)||n<0||n>63)throw new RangeError('Six-bit state must be integer 0..63');return n;};
const transition=(state,mask)=>norm(state)^norm(mask);
const checksum=s=>{let h=2166136261;for(const c of s){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}return (h>>>0).toString(16).padStart(8,'0')};
function normalize(input){
 if(!input||typeof input!=='object')throw new TypeError('Event object required');
 const title=String(input.title||'Untitled owner-submitted scenario').slice(0,160);
 const description=String(input.description||'').slice(0,4000);
 const raw=Number(input.confidence??0.5),impact=Number(input.impact??0.5),urgency=Number(input.urgency??0.5);
 if(![raw,impact,urgency].every(v=>Number.isFinite(v)&&v>=0&&v<=1))throw new RangeError('confidence, impact, urgency must be 0..1');
 return freeze({title,description,confidence:raw,impact,urgency,consent:input.consent===true,evidence:Array.isArray(input.evidence)?freeze(input.evidence.filter(x=>typeof x==='string').slice(0,12).map(x=>x.slice(0,400))):freeze([]),tag:String(input.tag||'review').slice(0,48),hypothetical:true});
}
function contradictions(e){
 const positive=new Set(),negative=new Set(),issues=[];
 for(const v of e.evidence){const s=v.trim().toLowerCase(), neg=/^(not |no |false: |denied: )/.exec(s);const key=neg?s.slice(neg[0].length).trim():s;if(!key)continue;(neg?negative:positive).add(key);}
 for(const key of positive)if(negative.has(key))issues.push({type:'explicit-negation',claim:key});
 return issues;
}
function decide(kind,input){
 if(!['machine','samaritan'].includes(kind))throw new RangeError('Unknown engine');
 const e=normalize(input),issues=contradictions(e),sourceCount=e.evidence.length;
 const evidenceStrength=clamp(e.confidence*(sourceCount?1:0.45),0,1);
 const protection=e.impact*0.5+e.urgency*0.3+evidenceStrength*0.2;
 const optimization=e.impact*0.25+e.urgency*0.45+evidenceStrength*0.3;
 const score=Number((kind==='machine'?protection:optimization).toFixed(4));
 let decision='REVIEW',reason='Human review required';
 if(!e.consent){decision='BLOCK';reason='No authorization or consent supplied';}
 else if(issues.length){decision='CONFLICT';reason='Conflicting evidence detected';}
 else if(sourceCount===0){decision='INSUFFICIENT_EVIDENCE';reason='No supporting evidence supplied';}
 else if(evidenceStrength<0.5){decision='VERIFY';reason='Evidence confidence below verification threshold';}
 else if(kind==='machine'){decision=score>=0.55?'PROPOSE_PROTECTIVE_ACTION':'MONITOR_WITH_CONSENT';reason='Priority: protect individuals while preserving choice';}
 else {decision=score>=0.55?'PROPOSE_COORDINATED_ACTION':'OBSERVE_WITH_CONSENT';reason='Priority: optimize coordinated outcomes with human approval';}
 const initial=(Math.round(e.impact*7)|Math.round(e.urgency*7)<<3)&63;
 const change=(Math.round(evidenceStrength*7)|((kind==='machine'?2:5)<<3))&63;
 const next=transition(initial,change);
 return freeze({schema:'nathan-ai.eyes.decision.v1',engine:kind,event:e,decision,reason,score,issues:freeze(issues),requiresHumanApproval:true,executed:false,initialState:initial,nextState:next,mask:change,binary:freeze({initial:bits(initial),change:bits(change),next:bits(next)}),provenance:freeze({evidenceCount:sourceCount,confidence:e.confidence,evidenceStrength,checksum:checksum(JSON.stringify(e))})});
}
function compare(input){const e=normalize(input);return freeze({machine:decide('machine',e),samaritan:decide('samaritan',e),agreement:decide('machine',e).decision===decide('samaritan',e).decision});}
function simulate(kind,input){
 const base=normalize(input),variants=[['baseline',0,0],['urgency +0.25',0,.25],['impact +0.25',.25,0],['lower urgency',0,-.25]];
 return freeze(variants.map(([label,impact,urgency])=>freeze({label,result:decide(kind,{...base,impact:clamp(base.impact+impact,0,1),urgency:clamp(base.urgency+urgency,0,1)})})));
}
function createSession(){const log=[];return freeze({evaluate(input){const result=compare(input);log.push(freeze({sequence:log.length+1,result}));return result;},history(){return log.slice();},export(){return JSON.stringify({schema:'nathan-ai.eyes.audit.v1',entries:log},null,2);},clear(){log.length=0;}});}
function verify(){let n=0;const pairs=new Set();for(let state=0;state<64;state++)for(let mask=0;mask<64;mask++){const target=transition(state,mask);pairs.add(state+':'+target);n++;if(transition(target,mask)!==state)throw new Error('XOR reversibility failed');}return freeze({states:64,transformations:n,uniqueOrderedPairs:pairs.size,reversible:true});}
return freeze({MODEL,MACHINE_MODULES,SAMARITAN_MODULES,DATA_LABELS,bits,transition,normalize,contradictions,decide,compare,simulate,createSession,verify});
});
