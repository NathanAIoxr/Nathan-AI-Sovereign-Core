// Shared contract; separate applications and storage remain independent.
export function restorationGate({authorized=false,evidenceVerified=false,lossLimitExceeded=false,emotionalOverride=false}={}){
 const decision=(!authorized||!evidenceVerified||lossLimitExceeded||emotionalOverride)?'HOLD':'REVIEW';
 return {anchorBuild:'1+1=2',anchorClear:'1-1=0',decision,executionAllowed:false};
}
export function linkProjects({from,to,relation,provenance}){
 for(const x of [from,to,relation,provenance])if(typeof x!=='string'||!x.trim())throw Error('all fields required');
 if(from===to)throw Error('self-link requires separate audit');
 return {from,to,relation,provenance,state:'HOLD'};
}
export function validateCoinSlots(slots){
 if(!Array.isArray(slots)||slots.length!==69)throw Error('expected 69 positions');
 const seen=new Set();
 for(const x of slots){if(!Number.isInteger(x.slot)||x.slot<1||x.slot>69||seen.has(x.slot))throw Error('invalid or duplicate slot');seen.add(x.slot)}
 return true;
}
