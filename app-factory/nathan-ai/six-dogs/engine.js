/* Nathan AI / Six Dogs Resolution Engine — additive, offline, source-preserving.
 * This is a self-guided decision aid, not a clinical grief scale or treatment.
 * The six DOG names and order are immutable; Soul/Spirit slots are optional.
 */
(function(root){"use strict";
const VERSION=1;
const STEPS=Object.freeze([
 {index:0,name:"KNICK",dog:1,emotion:"Denial / Shock",operation:"Acknowledge",mind:"Dalet",mindMeaning:"Door / Mind Gate",shadow:"Bet",shadowMeaning:"Vessel",prompt:"What is actually happening? Name the facts without guessing.",action:"Identify the situation and what is within your control.",hardwarePin:3},
 {index:1,name:"KNACK",dog:2,emotion:"Pain / Guilt",operation:"Adapt",mind:"Pe",mindMeaning:"Mouth / Expression",shadow:"Nun",shadowMeaning:"Seed / Ignition",prompt:"Which options exist, and which assumptions need checking?",action:"Generate at least one workable alternative.",hardwarePin:4},
 {index:2,name:"PADDY",dog:3,emotion:"Anger / Frustration",operation:"Regulate",mind:"Kaph",mindMeaning:"Palm / Handling",shadow:"Waw",shadowMeaning:"Hook / Link",prompt:"What pace or routine helps you respond deliberately?",action:"Choose a calming rhythm or a brief grounding activity.",hardwarePin:5},
 {index:3,name:"WHACK",dog:4,emotion:"Bargaining / Rumination",operation:"Decide",mind:"Waw",mindMeaning:"Hook / Connection",shadow:"Kaph",shadowMeaning:"Palm / Catch",prompt:"What decision can move this forward without harming anyone?",action:"Make one constructive, nonviolent decision.",hardwarePin:6},
 {index:4,name:"DOG",dog:5,emotion:"Sadness / Isolation",operation:"Follow through",mind:"Nun",mindMeaning:"Seed / Emerging",shadow:"Pe",shadowMeaning:"Mouth / Expression",prompt:"What manageable action or supportive connection comes next?",action:"Take one small step or reach out for support.",hardwarePin:7},
 {index:5,name:"BONE",dog:6,emotion:"Resolution / Connection",operation:"Reflect",mind:"Bet",mindMeaning:"House / Integration",shadow:"Dalet",shadowMeaning:"Door / Exit",prompt:"What changed, what remains, and what would restore some ease?",action:"Review the result, acknowledge uncertainty, and choose an ongoing support or care practice.",hardwarePin:8}
].map(Object.freeze));
const MIND=Object.freeze(STEPS.map(x=>x.mind));
const BODY=Object.freeze(STEPS.map(x=>x.name));
const SHADOW=Object.freeze(STEPS.map(x=>x.shadow));
const PLANES=Object.freeze({mind:MIND,body:BODY,shadow:SHADOW,soul:Object.freeze([null,null,null,null,null,null]),spirit:Object.freeze([null,null,null,null,null,null])});
const DESIGN=Object.freeze([
 {area:"Application",implementation:"Offline browser workbench: guided six-stage reflection, review, revisit, export and erase.",status:"working"},
 {area:"Computing",implementation:"Pure deterministic state machine and JSON session format; Node regression tests.",status:"working"},
 {area:"Human interface",implementation:"Keyboard/touch accessibility, clear steps, opt-in browser persistence.",status:"working"},
 {area:"AI integration",implementation:"Optional future local model for suggestions; no model or emotion detector is connected.",status:"specified"},
 {area:"Microcontroller",implementation:"Arduino Uno button + six LED indicators; provided sketch and serial protocol.",status:"firmware provided; board untested"},
 {area:"Physical connectivity",implementation:"Serial message contract for a future permissioned browser/native adapter.",status:"protocol specified"},
 {area:"Privacy and sovereignty",implementation:"No remote requests; browser memory by default; explicit localStorage opt-in, JSON export and wipe.",status:"working prototype"},
 {area:"Scientific boundary",implementation:"Rhyme-to-emotion mapping is a creative prompt system; does not predict or erase grief, depression or stress.",status:"documented"}
].map(Object.freeze));
function textValue(value,key,max){if(typeof value!=="string")throw new TypeError(key+" must be text");if(value.length>max)throw new RangeError(key+" too long");return value;}
function iso(now){const d=now?new Date(now):new Date();if(Number.isNaN(d.getTime()))throw new RangeError("Invalid timestamp");return d.toISOString();}
function stage(index){if(!Number.isInteger(index)||index<0||index>=STEPS.length)throw new RangeError("Step must be 0–5");return STEPS[index];}
function createSession(input){input=input||{};const id=textValue(input.id||"local-session","id",120);return {schema:"nathan-six-dogs.session",version:VERSION,id:id,title:textValue(input.title||"Six Dogs reflection","title",160),createdAt:iso(input.now),updatedAt:iso(input.now),step:0,status:"active",history:[],customPlanes:{soul:[null,null,null,null,null,null],spirit:[null,null,null,null,null,null]}};}
function validateSession(data){if(!data||typeof data!=="object"||Array.isArray(data)||data.schema!=="nathan-six-dogs.session"||data.version!==VERSION)throw new TypeError("Unsupported session schema");let id=textValue(data.id,"id",120),title=textValue(data.title,"title",160);
 if(!Number.isInteger(data.step)||data.step<0||data.step>5)throw new RangeError("Invalid current step");if(!["active","completed"].includes(data.status))throw new RangeError("Invalid session status");
 if(!Array.isArray(data.history)||data.history.length>120)throw new RangeError("Invalid session history");
 const history=data.history.map((x)=>{if(!x||!Number.isInteger(x.step)||x.step<0||x.step>5||x.name!==STEPS[x.step].name)throw new TypeError("Invalid stage record");return {step:x.step,name:x.name,recordedAt:iso(x.recordedAt),note:textValue(x.note||"","note",3000),outcome:textValue(x.outcome||"","outcome",1000)};});
 const cp={};for(const p of ["soul","spirit"]){const a=data.customPlanes&&data.customPlanes[p];if(!Array.isArray(a)||a.length!==6)throw new TypeError("Expected six custom plane slots");cp[p]=a.map(v=>v===null?null:textValue(v,"plane label",100));}
 const createdAt=iso(data.createdAt),updatedAt=iso(data.updatedAt);
 return {schema:"nathan-six-dogs.session",version:VERSION,id,title,createdAt,updatedAt,step:data.step,status:data.status,history,customPlanes:cp};
}
function advance(input,entry){const session=validateSession(input);if(session.status==="completed")throw new Error("Completed session: explicitly revisit a step to continue");entry=entry||{};const now=iso(entry.now);const record={step:session.step,name:STEPS[session.step].name,recordedAt:now,note:textValue(entry.note||"","note",3000).trim(),outcome:textValue(entry.outcome||"","outcome",1000).trim()};
 const atEnd=session.step===5;return Object.assign({},session,{updatedAt:now,step:atEnd?5:session.step+1,status:atEnd?"completed":"active",history:[...session.history,record].slice(-120)});}
function revisit(input,target,now){const session=validateSession(input);stage(target);return Object.assign({},session,{step:target,status:"active",updatedAt:iso(now)});}
function setPlane(input,plane,index,value,now){const session=validateSession(input);if(!["soul","spirit"].includes(plane))throw new RangeError("Only Soul and Spirit are user-configurable");stage(index);const label=value===null||String(value).trim()===""?null:textValue(String(value).trim(),"plane label",100);
 const customPlanes={soul:session.customPlanes.soul.slice(),spirit:session.customPlanes.spirit.slice()};customPlanes[plane][index]=label;return Object.assign({},session,{customPlanes,updatedAt:iso(now)});}
function parallelAt(input,index){const current=stage(index);const c=input?validateSession(input).customPlanes:{soul:PLANES.soul,spirit:PLANES.spirit};return {step:index+1,mind:current.mind,body:current.name,shadow:current.shadow,soul:c.soul[index],spirit:c.spirit[index],source:"Mind, Body, Shadow are from the corrected manuscript; Soul and Spirit are user-defined placeholders."};}
function serialCommand(index){return "SD1 STEP "+(stage(index).index+1)+"\n";}
function serialReset(){return "SD1 RESET\n";}
function sessionSummary(input){const s=validateSession(input);return {status:s.status,activeStage:STEPS[s.step].name,completedEntries:s.history.length,completedDistinctStages:new Set(s.history.map(x=>x.step)).size,createdAt:s.createdAt,updatedAt:s.updatedAt,disclaimer:"Self-reported progress is not a diagnosis or proof of a stress-free state."};}
function exportPackage(input){const s=validateSession(input);return {format:"nathan-six-dogs.export",version:1,session:s,guide:STEPS.map(s=>({step:s.index+1,name:s.name,operation:s.operation,emotion:s.emotion,mind:s.mind,shadow:s.shadow}))};}
function importPackage(value){if(!value||value.format!=="nathan-six-dogs.export"||value.version!==1)throw new TypeError("Unsupported Six Dogs export");return validateSession(value.session);}
const api=Object.freeze({VERSION,STEPS,PLANES,DESIGN,stage,createSession,validateSession,advance,revisit,setPlane,parallelAt,serialCommand,serialReset,sessionSummary,exportPackage,importPackage});
if(typeof module!=="undefined"&&module.exports)module.exports=api;
root.NathanSixDogs=api;
})(typeof globalThis!=="undefined"?globalThis:this);
