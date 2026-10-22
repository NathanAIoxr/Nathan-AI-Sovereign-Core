/* TABOR MISSION CONTROL 1.0: decision-support, not autonomous world repair.
 * Strict input schema; independent provenance, safety gates and human authorization.
 * Does not observe real bodies, people, the planet or cosmos without permitted adapters.
 */
(function(root,factory){'use strict';const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.TaborMissionControl=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){'use strict';
const DOMAINS=['body','community','earth','cosmos','unknown','software','hardware'];
const STATUSES=['observed','hypothesis','verified','simulated'];
const LEVELS=['information','routine','safety-critical'];
const RECOMMENDATIONS={
 body:{low:'Seek reliable information and record observed changes.',high:'For urgent symptoms, contact local emergency services or qualified medical care; do not use simulation as diagnosis.'},
 community:{low:'Ask affected people what help is wanted and identify available providers.',high:'Prioritize immediate safety, informed consent and qualified response teams.'},
 earth:{low:'Check calibrated environmental data and compare with source conditions.',high:'Refer hazards to appropriate emergency/environmental authorities; avoid automated physical intervention.'},
 cosmos:{low:'Consult calibrated observatories or published ephemerides before describing an anomaly.',high:'Treat unverified alerts as hypotheses; request independent observation, not a claim of cosmic threat.'},
 unknown:{low:'Document the hypothesis and what observation could falsify it.',high:'Do not attribute harm or danger to unseen forces without evidence.'},
 software:{low:'Reproduce the fault in a sandbox, capture logs and write a regression test.',high:'Isolate affected systems; require human-reviewed rollback or change plan.'},
 hardware:{low:'Review sensor calibration and operating limits with power isolated.',high:'Stop unsafe activity and refer to trained operators; never energize uncontrolled equipment.'}
};
function validText(s,max=500){return typeof s==='string'&&s.trim().length>0&&s.length<=max}
function normalizeIssue(source){
 if(!source||typeof source!=='object'||Array.isArray(source))throw Error('Issue object required');
 if(!DOMAINS.includes(source.domain))throw Error('Invalid domain');
 if(!validText(source.title,150))throw Error('Title required (maximum 150 characters)');
 if(!validText(source.description,3000))throw Error('Description required');
 if(!STATUSES.includes(source.evidenceStatus))throw Error('Evidence status required');
 if(!LEVELS.includes(source.risk))throw Error('Risk level required');
 const severity=Number(source.severity);
 if(!Number.isInteger(severity)||severity<1||severity>5)throw Error('Severity must be 1–5');
 const consent=source.consent===true;
 const sources=Array.isArray(source.sources)?source.sources.filter(x=>typeof x==='string'&&x.length<=500).slice(0,20):[];
 return {id:source.id&&/^ISSUE-[0-9A-Za-z_-]{1,50}$/.test(source.id)?source.id:'ISSUE-'+Date.now().toString(36),title:source.title.trim(),description:source.description.trim(),domain:source.domain,risk:source.risk,severity,evidenceStatus:source.evidenceStatus,sources,consent,ownerApproval:source.ownerApproval===true,location:typeof source.location==='string'?source.location.slice(0,140):'',time:new Date().toISOString()};
}
function triad(issue){
 return {empathy:{name:'EMPATHY / FILTER',question:'Who or what could be affected, and what evidence supports that?',passed:validText(issue.description)&&DOMAINS.includes(issue.domain)},
 sympathy:{name:'SYMPATHY / GATE',question:'Are affected people protected and their wishes respected?',passed:issue.consent===true||!['body','community'].includes(issue.domain)},
 compassion:{name:'COMPASSION / CREATOR',question:'What proportionate authorized help can be tested and verified?',passed:issue.ownerApproval===true&&issue.evidenceStatus==='verified'&&issue.risk==='routine'}};
}
function assess(input){
 const issue=normalizeIssue(input),gates=triad(issue),humanImpact=['body','community'].includes(issue.domain),reliableEvidence=issue.evidenceStatus==='verified'&&issue.sources.length>0;
 const allowedToAct=false; // no live execution adapter in browser, irrespective of approvals
 const mode=issue.risk==='safety-critical'?'escalate-safely':!reliableEvidence?'investigate':'propose-review';
 const planned=[
 {id:'observe',name:'Document observations',requiresApproval:false,category:'information'},
 {id:'verify',name:'Independently verify evidence and provenance',requiresApproval:false,category:'review'},
 {id:'plan',name:'Design a reversible, measurable intervention',requiresApproval:humanImpact||issue.risk!=='information',category:'proposal'},
 {id:'consent',name:'Obtain domain-specific consent and authorized operator review',requiresApproval:true,category:'authorization'},
 {id:'test',name:'Test safely in an isolated simulation or approved pilot',requiresApproval:true,category:'simulation'},
 {id:'measure',name:'Measure actual outcomes and revise hypothesis',requiresApproval:true,category:'verification'}];
 return {schema:'tabor.mission.assessment.v1',issue,gateChecks:gates,mode,readyForAutonomousAction:allowedToAct,needsExpertReview:issue.risk==='safety-critical'||humanImpact,verifiedFact:reliableEvidence,advice:RECOMMENDATIONS[issue.domain][issue.risk==='safety-critical'?'high':'low'],steps:planned,explanation:'Passing arithmetic or a simulated gate cannot prove truth or authorize external action. 1 + 1 = 2 and 1 − 1 = 0 are exact arithmetic and sovereign-identity design principles.'};
}
function deviceSpec(kind){
 const map={
 'environment-sensor':{id:'tabor.sensor.environment.v1',transport:'USB serial / BLE / LAN gateway by owner authorization',sample:{version:1,deviceId:'demo-weather-1',timestamp:'2026-10-22T00:00:00Z',observations:[{type:'temperature',value:22.1,unit:'degC',quality:'simulated'}]},limits:'Environmental readings require calibration and device-specific evidence; no automated actuators'},
 'body-sensor':{id:'tabor.sensor.body.v1',transport:'Approved health SDK / opt-in BLE',sample:{version:1,deviceId:'demo-health-1',timestamp:'2026-10-22T00:00:00Z',observations:[{type:'heart_rate',value:72,unit:'beats/min',quality:'simulated'}]},limits:'Not diagnostic, no automatic medical decisions; no real personal data stored'},
 'motion-sensor':{id:'tabor.sensor.motion.v1',transport:'Approved motion API / opt-in BLE',sample:{version:1,deviceId:'demo-motion-1',timestamp:'2026-10-22T00:00:00Z',observations:[{type:'heading',value:90,unit:'deg',quality:'simulated'}]},limits:'Not certified for navigation or safety-critical control'}
 };
 if(!Object.hasOwn(map,kind))throw Error('Unknown device class');
 return structuredClone(map[kind]);
}
function validatePacket(packet){
 if(!packet||packet.version!==1||!validText(packet.deviceId,100)||!validText(packet.timestamp,40)||!Number.isFinite(Date.parse(packet.timestamp))||!Array.isArray(packet.observations)||packet.observations.length>64)throw Error('Invalid sensor packet');
 const permitted=new Set(['temperature','humidity','heart_rate','heading','pressure','acceleration','light']);
 const units={temperature:'degC',humidity:'pct',heart_rate:'beats/min',heading:'deg',pressure:'hPa',acceleration:'m/s2',light:'lux'};
 for(const o of packet.observations){if(!o||!permitted.has(o.type)||o.unit!==units[o.type]||!Number.isFinite(o.value)||Math.abs(o.value)>1e8||!['simulated','uncalibrated','calibrated'].includes(o.quality))throw Error('Invalid sensor observation')}
 return {valid:true,source:packet.deviceId,observations:packet.observations.length,trustedForSafetyCriticalControl:false,simulated:packet.observations.some(o=>o.quality==='simulated')};
}
function exampleCases(){return [
 {domain:'body',title:'Illustrative physiological concern',description:'Fictional subject reports a change; no measurements taken.',severity:3,risk:'safety-critical',evidenceStatus:'hypothesis',consent:false,sources:[]},
 {domain:'earth',title:'Synthetic river temperature shift',description:'Demonstration data suggests a river temperature change; no calibrated readings.',severity:2,risk:'routine',evidenceStatus:'simulated',consent:false,sources:[]},
 {domain:'software',title:'Sample file checksum mismatch',description:'A simulated source-file integrity comparison failed in a sandbox.',severity:2,risk:'routine',evidenceStatus:'simulated',consent:false,sources:[]},
 {domain:'cosmos',title:'Unconfirmed telescope signal',description:'A fictional observation needs independent verification.',severity:1,risk:'information',evidenceStatus:'hypothesis',consent:false,sources:[]}
 ]}
return Object.freeze({DOMAINS,STATUSES,LEVELS,normalizeIssue,triad,assess,deviceSpec,validatePacket,exampleCases});
});