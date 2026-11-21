import {runTwinEngines,ninePoint,sixPoint,executeCircuit} from "./symmetry-runtime";
const ready={intent:"simulate optical route",authorized:true,thermalHeadroom:true,fabricReady:true,bufferReady:true,computeCapacity:8,requestedCapacity:4};
const ok=runTwinEngines(ready);
if(ninePoint.length!==9||sixPoint.length!==6||!ok.unifiedCompleted)throw new Error("full circuits failed");
if(executeCircuit(sixPoint,{...ready,authorized:false}).haltReason!=="authorization_denied")throw new Error("permission gate failed");
if(executeCircuit(sixPoint,{...ready,bufferReady:false}).haltReason!=="buffer_unavailable")throw new Error("MHEEL hold gate failed");
if(executeCircuit(ninePoint,{...ready,computeCapacity:2}).haltReason!=="capacity_exceeded")throw new Error("WHEEL capacity gate failed");
if(executeCircuit(sixPoint,{...ready,thermalHeadroom:false}).haltReason!=="thermal_limit")throw new Error("MAY thermal gate failed");
console.log("Nine-point and six-point symmetry runtime assertions passed");
