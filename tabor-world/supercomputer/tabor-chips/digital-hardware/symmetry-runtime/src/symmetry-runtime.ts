export type Node="WILL"|"WHEEL"|"WAY"|"MILL"|"MHEEL"|"MAY";
export type Event={step:number;from:Node;to:Node;action:string;accepted:boolean;reason:string};
export type Context={intent:string;authorized:boolean;thermalHeadroom:boolean;fabricReady:boolean;bufferReady:boolean;computeCapacity:number;requestedCapacity:number};
export const ninePoint:[Node,Node,string][]=[
["WILL","WILL","anchor-intent"],["WILL","WHEEL","request-compute"],["WHEEL","WAY","configure-route"],
["WAY","WAY","verify-route"],["WAY","WHEEL","allocate-memory"],["WHEEL","WHEEL","verify-compute"],
["WHEEL","WILL","return-measurements"],["WAY","WILL","return-network-feedback"],["WILL","WAY","dispatch-authorized-job"]];
export const sixPoint:[Node,Node,string][]=[
["WILL","MILL","refine-input"],["MILL","MHEEL","hold-buffer"],["MHEEL","WHEEL","release-to-compute"],
["WHEEL","WAY","configure-route"],["WAY","MAY","permission-handshake"],["MAY","WILL","return-result"]];
function permitted(action:string,c:Context):[boolean,string]{
 if(!c.authorized)return [false,"authorization_denied"];
 if(!c.intent.trim())return [false,"empty_intent"];
 if(action==="hold-buffer"&&!c.bufferReady)return [false,"buffer_unavailable"];
 if(["request-compute","verify-compute","release-to-compute"].includes(action)&&c.requestedCapacity>c.computeCapacity)return [false,"capacity_exceeded"];
 if(["configure-route","verify-route","dispatch-authorized-job"].includes(action)&&!c.fabricReady)return [false,"route_unavailable"];
 if(["configure-route","permission-handshake","dispatch-authorized-job"].includes(action)&&!c.thermalHeadroom)return [false,"thermal_limit"];
 return [true,"accepted"];
}
export function executeCircuit(steps:readonly (readonly [Node,Node,string])[],c:Context):{events:Event[];completed:boolean;haltReason:string|null}{
 const events:Event[]=[];
 for(let i=0;i<steps.length;i++){
  const [from,to,action]=steps[i];const [accepted,reason]=permitted(action,c);
  events.push({step:i+1,from,to,action,accepted,reason});
  if(!accepted)return {events,completed:false,haltReason:reason};
 }
 return {events,completed:true,haltReason:null};
}
export function runTwinEngines(c:Context){
 const w=executeCircuit(ninePoint,c),wm=executeCircuit(sixPoint,c);
 return {ninePoint:w,sixPoint:wm,unifiedCompleted:w.completed&&wm.completed};
}
