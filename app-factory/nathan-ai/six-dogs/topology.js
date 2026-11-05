/* Nathan AI / Six Dogs: sovereign macro topology + micro engine.
 * Deterministic, offline, no implicit mutations, no deception detector.
 * UMD exports to browser and CommonJS.
 */
(function(root){"use strict";
const GATE=Object.freeze({RETAIN:1,HOLD:0});
const SENTINEL=Object.freeze({CHECKED:"STRUCTURE_CHECKED",PENDING:"EVIDENCE_REVIEW_REQUIRED",INVALID:"INVALID_PACKET"});
const NODES=Object.freeze([
 Object.freeze({id:"user",name:"Sovereign user",layer:"governance"}),
 Object.freeze({id:"registry",name:"Ontological registry",layer:"macro"}),
 Object.freeze({id:"store",name:"Local data repository",layer:"macro"}),
 Object.freeze({id:"events",name:"Event-driven pub/sub",layer:"macro"}),
 Object.freeze({id:"runtime",name:"Offline edge runtime",layer:"macro"}),
 Object.freeze({id:"gate",name:"Reversible DATA–ATAD gate",layer:"micro"}),
 Object.freeze({id:"workflow",name:"Six Dogs state machine",layer:"micro"}),
 Object.freeze({id:"device",name:"Opt-in serial device",layer:"edge"})
]);
const LINKS=Object.freeze([
 ["user","registry"],["user","store"],["registry","events"],["store","runtime"],
 ["events","runtime"],["runtime","gate"],["gate","workflow"],["workflow","device"]
].map(x=>Object.freeze({from:x[0],to:x[1]})));
const MAX_TEXT=10000, MAX_EVENTS=128;
function requireText(x,key){if(typeof x!=="string")throw new TypeError(key+" must be a string");if(x.length>MAX_TEXT)throw new RangeError(key+" exceeds "+MAX_TEXT+" characters");return x;}
function graphemes(s){if(typeof Intl!=="undefined"&&Intl.Segmenter)return Array.from(new Intl.Segmenter(undefined,{granularity:"grapheme"}).segment(s),x=>x.segment);return Array.from(s);}
function reverse(s){return graphemes(requireText(s,"packet")).reverse().join("");}
function inspect(packet,review){const forward=requireText(packet,"packet"),backward=reverse(forward),roundTrip=reverse(backward);
 const evidence=review&&typeof review==="object"?review:{};
 const reference=typeof evidence.reference==="string"?evidence.reference.trim():"";
 const reviewed=evidence.status==="supported"&&reference.length>0;
 return Object.freeze({
  forward,backward,roundTrip,roundTripMatches:roundTrip===forward,
  palindrome:backward===forward,
  structuralGate:roundTrip===forward?GATE.RETAIN:GATE.HOLD,
  evidenceGate:reviewed?GATE.RETAIN:GATE.HOLD,
  sentinel:reviewed?SENTINEL.CHECKED:SENTINEL.PENDING,
  reference,reviewStatus:typeof evidence.status==="string"?evidence.status:"unreviewed",
  limits:"Structure checks are not truth, consent, innocence, deception, clinical or psychological tests."
 });
}
function whole(value,name){if(!Number.isSafeInteger(value))throw new TypeError(name+" must be a safe integer");return value;}
function build(a,b){return whole(a,"a")+whole(b,"b");}
function clear(a,b){return whole(a,"a")-whole(b,"b");}
function emptyGraph(){return {schema:"nathan-six-dogs.topology",version:1,sequence:0,activeStep:0,events:[],assets:[]};}
function cloneGraph(graph){if(!graph||graph.schema!=="nathan-six-dogs.topology"||graph.version!==1)throw new TypeError("Topology schema mismatch");if(!Array.isArray(graph.events)||!Array.isArray(graph.assets)||!Number.isSafeInteger(graph.sequence))throw new TypeError("Malformed topology");
 return {schema:graph.schema,version:1,sequence:graph.sequence,activeStep:graph.activeStep,events:graph.events.map(x=>({...x})),assets:graph.assets.map(x=>({...x}))};
}
function applyEvent(graph,event){const next=cloneGraph(graph);
 if(!event||typeof event!=="object")throw new TypeError("Event required");
 if(event.type==="STAGE_SELECTED"){if(!Number.isInteger(event.step)||event.step<0||event.step>5)throw new RangeError("Stage outside 1–6");next.activeStep=event.step;}
 else if(event.type==="ASSET_REGISTERED"){const id=requireText(event.id,"asset id");const kind=requireText(event.kind,"asset kind");
  if(!/^[a-z0-9][a-z0-9:_-]{0,63}$/.test(id))throw new RangeError("Invalid asset ID");
  if(!["text","document","device","story","interface"].includes(kind))throw new RangeError("Unsupported asset kind");
  if(next.assets.length>=64&&!next.assets.some(x=>x.id===id))throw new RangeError("Asset capacity reached");
  next.assets=next.assets.filter(x=>x.id!==id);next.assets.push({id,kind});
 }else if(event.type==="LOCAL_DRAFT_CLEARED"){if(event.confirmation!=="CLEAR_LOCAL_DRAFT")throw new Error("Explicit local clear confirmation required");}
 else throw new RangeError("Unsupported event type");
 next.sequence++;
 next.events.push({sequence:next.sequence,type:event.type,step:event.type==="STAGE_SELECTED"?event.step:null,asset:event.type==="ASSET_REGISTERED"?event.id:null});
 next.events=next.events.slice(-MAX_EVENTS);
 return next;
}
function macroView(graph){const g=cloneGraph(graph);return {nodes:NODES,links:LINKS,revision:g.sequence,stage:g.activeStep+1,eventCount:g.events.length,assets:g.assets.length,latestEvent:g.events.at(-1)||null,networkCalls:0};}
function createEventBus(){const subscribers=new Map();return Object.freeze({
 subscribe(channel,fn){if(typeof channel!=="string"||typeof fn!=="function")throw new TypeError("Subscription requires channel/function");
 const listeners=subscribers.get(channel)||new Set();if(listeners.size>=32)throw new RangeError("Subscriber limit");listeners.add(fn);subscribers.set(channel,listeners);
 return ()=>{listeners.delete(fn);if(!listeners.size)subscribers.delete(channel);};},
 publish(channel,payload){if(typeof channel!=="string")throw new TypeError("Channel required");let called=0;for(const fn of [...(subscribers.get(channel)||[])]){fn(payload);called++;}return called;},
 clear(){subscribers.clear();}
 });}
function createMemoryPort(){const data=new Map();return Object.freeze({
 read(key){return data.has(key)?data.get(key):null;},
 write(key,value){if(typeof key!=="string"||!key||key.length>80)throw new RangeError("Invalid key");data.set(key,value);return true;},
 remove(key){return data.delete(key);},keys(){return [...data.keys()];}
 });}
function clearDraft(draft,confirmation){if(confirmation!=="CLEAR_LOCAL_DRAFT")throw new Error("Explicit local clear confirmation required");if(!draft||typeof draft!=="object")throw new TypeError("Draft object required");return {...draft,text:"",cleared:true};}
const api=Object.freeze({GATE,SENTINEL,NODES,LINKS,build,clear,reverse,inspect,emptyGraph,applyEvent,macroView,createEventBus,createMemoryPort,clearDraft});
if(typeof module!=="undefined"&&module.exports)module.exports=api;root.NathanMicroMacro=api;
})(typeof globalThis!=="undefined"?globalThis:this);
