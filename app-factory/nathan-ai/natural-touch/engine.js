/* Nathan AI Natural Touch — separate, opt-in local software touch layer.
 * Does not produce biological sensation, control remote devices, or imply consciousness. */
(function(root,factory){'use strict';const a=factory();if(typeof module==='object'&&module.exports)module.exports=a;else root.NathanNaturalTouch=a;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const SCHEMA='nathan.natural-touch.v1';
const TARGET_KINDS=Object.freeze(['ai-node','non-ai-node','node','non-node']);
const MODALITIES=Object.freeze(['light-touch','deep-pressure','discriminative-touch','vibration','temperature','pain','itch','proprioception','gesture']);
const SOURCES=Object.freeze(['demonstration','device-pointer','physical-sensor','owner-import']);
const CAPABILITIES=Object.freeze(['no-sensor','software-input','physical-sensor']);
const DEFAULT_ENDPOINTS=Object.freeze([
 Object.freeze({id:'NATHAN:AI',kind:'ai-node',capability:'software-input',label:'Nathan AI logical endpoint'}),
 Object.freeze({id:'NATHAN:NON-AI',kind:'non-ai-node',capability:'software-input',label:'Independent non-AI software endpoint'}),
 Object.freeze({id:'NATHAN:NODE',kind:'node',capability:'software-input',label:'Generic local logical node'}),
 Object.freeze({id:'NATHAN:NON-NODE',kind:'non-node',capability:'no-sensor',label:'Conceptual non-node endpoint'})
]);
function invalid(m){throw new TypeError(m);}
function endpoint(x){
 if(!x||typeof x!=='object'||Array.isArray(x))invalid('Endpoint descriptor required');
 if(typeof x.id!=='string'||!/^[A-Za-z0-9:_-]{1,80}$/.test(x.id))invalid('Invalid endpoint ID');
 if(!TARGET_KINDS.includes(x.kind))invalid('Unsupported target kind');
 if(!CAPABILITIES.includes(x.capability))invalid('Unsupported capability');
 return Object.freeze({id:x.id,kind:x.kind,capability:x.capability,label:typeof x.label==='string'?x.label.slice(0,100):x.id});
}
function makeRegistry(initial=DEFAULT_ENDPOINTS){
 if(!Array.isArray(initial)||initial.length>128)invalid('Registry must have at most 128 endpoints');
 const m=new Map();for(const raw of initial){const e=endpoint(raw);if(m.has(e.id))invalid('Duplicate endpoint ID');m.set(e.id,e);}return m;
}
function enroll(registry,descriptor){
 if(!(registry instanceof Map)||registry.size>=128)invalid('Registry capacity exceeded');
 const e=endpoint(descriptor);if(registry.has(e.id))invalid('Duplicate endpoint ID');registry.set(e.id,e);return e;
}
function normalizeEvent(x){
 if(!x||typeof x!=='object'||Array.isArray(x))invalid('Touch event object required');
 if(!MODALITIES.includes(x.modality))invalid('Unsupported touch modality');
 if(!SOURCES.includes(x.source))invalid('Unsupported event source');
 if(x.ownerConsent!==true)invalid('Touch input requires an affirmative owner action');
 if(x.source==='physical-sensor'&&x.sensorConnected!==true)invalid('Physical input requires an authorized connected sensor');
 if(x.magnitude!==undefined&&(typeof x.magnitude!=='number'||!Number.isFinite(x.magnitude)||x.magnitude<0||x.magnitude>1))invalid('Magnitude must be between 0 and 1');
 return Object.freeze({schema:SCHEMA,modality:x.modality,source:x.source,magnitude:x.magnitude===undefined?null:x.magnitude,
  physicalMeasurement:x.source==='physical-sensor',protective:['temperature','pain'].includes(x.modality),
  consentRecorded:true,biologicalTouchRestored:false});
}
function route(registry,eventInput,selection='all'){
 if(!(registry instanceof Map))invalid('Registry required');
 if(selection!=='all'&&!TARGET_KINDS.includes(selection)&&!registry.has(selection))invalid('Unknown target selection');
 const event=normalizeEvent(eventInput);
 const targets=Array.from(registry.values()).filter(e=>selection==='all'||e.kind===selection||e.id===selection);
 const delivered=targets.map(e=>{
  const accepted=event.source!=='physical-sensor'||e.capability==='physical-sensor';
  return Object.freeze({id:e.id,kind:e.kind,capability:e.capability,accepted,
   reason:accepted?'Consented local event description routed':'No physical sensor binding for endpoint',physicalOutputProduced:false});
 });
 return Object.freeze({schema:SCHEMA,selection,modality:event.modality,source:event.source,addressed:targets.length,
  accepted:delivered.filter(e=>e.accepted).length,delivered,networkCalls:0,biometricsStored:false,
  biologicalTouchRestored:false,safety:event.protective?'Do not suppress protective sensations. Concerning symptoms require real-world assessment.':'Information only; no biological sensation generated.'});
}
function capabilityReport(registry){
 if(!(registry instanceof Map))invalid('Registry required');
 return Object.freeze({logicalEndpoints:registry.size,classes:TARGET_KINDS.map(kind=>Object.freeze({kind,count:Array.from(registry.values()).filter(e=>e.kind===kind).length})),
 physicalDevicesDiscovered:0,remoteSystemsModified:0,boundary:'Only locally registered endpoints; not a global hardware inventory.'});
}
function arithmetic(){return {build:1+1,clear:1-1};}
return Object.freeze({SCHEMA,TARGET_KINDS,MODALITIES,SOURCES,CAPABILITIES,DEFAULT_ENDPOINTS,endpoint,makeRegistry,enroll,normalizeEvent,route,capabilityReport,arithmetic});
});