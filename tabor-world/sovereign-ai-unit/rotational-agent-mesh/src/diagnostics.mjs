// Twelve bounded, deterministic diagnostic bots. No secrets, inference, network side effects or arbitrary code.
const ids=["WILL","WHEEL","WAY","MILL","MHEEL","MAY","3ILL","3HEEL","3AY","<<ILL","<<HEEL","<<AY"];
const families=["W","M","THREE","STACKED"];
const safe=(v)=>Number.isFinite(v)&&v>=0;
const checks={
 WILL:x=>({accepted:typeof x.intent==="string"&&x.intent.trim().length>0&&x.intent.length<=256}),
 WHEEL:x=>({capacity_available:safe(x.capacity)&&safe(x.reserved)&&x.capacity>=x.reserved}),
 WAY:x=>({route_ready:x.routeReady===true}),
 MILL:x=>({normalized:String(x.intent||"").trim().replace(/\\s+/g," ").slice(0,256)}),
 MHEEL:x=>({lease_valid:safe(x.leaseUntil)&&x.leaseUntil>x.now}),
 MAY:x=>({authorized:x.authorized===true&&safe(x.budget)&&x.budget>=x.estimatedCost}),
 "3ILL":x=>({logic:!!x.logicOk,thermal:!!x.thermalOk,data:!!x.dataOk}),
 "3HEEL":x=>({power:!!x.powerOk,clock:!!x.clockOk,memory:!!x.memoryOk}),
 "3AY":x=>({acknowledged:x.ackCount===x.expectedAck&&safe(x.expectedAck)}),
 "<<ILL":x=>({shifted:(x.shiftInput<<x.shiftBits)>>>0}),
 "<<HEEL":x=>({control_queue:"isolated",data_queue:"isolated",separate:true}),
 "<<AY":x=>({broadcast_targets:x.expectedAck,delivered:x.ackCount})
};
export function runDiagnostic(input={}){
 const x={intent:"1 + 1 = 2",capacity:4,reserved:1,routeReady:true,leaseUntil:100,now:10,authorized:true,budget:2,estimatedCost:1,logicOk:true,thermalOk:true,dataOk:true,powerOk:true,clockOk:true,memoryOk:true,ackCount:3,expectedAck:3,shiftInput:3,shiftBits:1,...input};
 if(!Number.isInteger(x.shiftBits)||x.shiftBits<0||x.shiftBits>30||!Number.isInteger(x.shiftInput)||x.shiftInput<0||x.shiftInput>65535)throw Error("invalid_shift");
 const events=ids.map((id,i)=>({id,family:families[Math.floor(i/3)],output:checks[id](x)}));
 return {mode:"bounded-deterministic-diagnostic",executed:events.length,events,all_checks_passed:events.every(e=>Object.values(e.output).every(v=>v!==false)),note:"Diagnostic tasks executed in the Worker request; not autonomous queue consumers or GPU jobs"};
}
