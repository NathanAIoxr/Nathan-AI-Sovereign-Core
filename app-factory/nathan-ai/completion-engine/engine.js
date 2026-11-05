/* NATHAN AI — SOURCE-LOCKED COMPLETION ENGINE
 * Local deterministic review and evidence tracking. No autonomous manuscript rewrites.
 * All "pass" flags reflect documented review; none certify legal compliance.
 */
(function(root){"use strict";
const SCHEMA="nathan-ai.completion.v1",MAX_PROJECTS=4000,MAX_AUDIT=10000;
const GATES=Object.freeze([
 Object.freeze({id:"source",title:"Original source recovered",help:"Link a readable original, not an index title alone."}),
 Object.freeze({id:"words",title:"100% original wording preserved",help:"Verify source versus proposed output without silent normalization."}),
 Object.freeze({id:"tone",title:"Author tone approved",help:"Only the author can approve changed wording and voice."}),
 Object.freeze({id:"function",title:"Functional requirements demonstrated",help:"Provide reproducible test or inspection evidence."}),
 Object.freeze({id:"quality",title:"Regression and accessibility checks",help:"Attach actual results and outstanding issues."}),
 Object.freeze({id:"security",title:"Privacy and security review",help:"Specify handling of personal and sensitive data."}),
 Object.freeze({id:"compliance",title:"Applicable legal/policy review",help:"State applicable jurisdictions, licenses, and reviewer; do not imply blanket certification."}),
 Object.freeze({id:"owner",title:"Final owner acceptance",help:"Confirm the particular deliverable is approved by its owner."})
]);
const STAGES=Object.freeze(["inventory","recovery","requirements","build","validation","review","released"]);
function str(v,label,max=300){if(typeof v!=="string"||v.length>max)throw new TypeError(label+" must be a string no longer than "+max);return v;}
function stamp(v){const d=v?new Date(v):new Date();if(Number.isNaN(d.getTime()))throw new RangeError("Invalid timestamp");return d.toISOString();}
function identifier(v){const s=str(v,"id",120).trim();if(!/^[A-Za-z0-9][A-Za-z0-9:_.-]{0,119}$/.test(s))throw new RangeError("Invalid source identifier");return s;}
function privacy(v){if(!["public","owner-only","review-required"].includes(v))throw new RangeError("Invalid privacy");return v;}
function newProject(raw){raw=raw||{};const id=identifier(raw.id);
 const title=str(raw.title||"","title",250);if(!title.trim())throw new RangeError("Title required");
 return {id,title,track:str(raw.track||"uncategorized","track",80),
 sourceRef:str(raw.sourceRef||"","sourceRef",600),privacy:privacy(raw.privacy||"review-required"),
 creatorWords:str(raw.creatorWords||"","creatorWords",20000),
 stage:"inventory",gates:Object.fromEntries(GATES.map(x=>[x.id,{state:"unreviewed",evidence:"",reviewer:"",reviewedAt:null}])),
 notes:[],audit:[],version:1};
}
function validProject(project){if(!project||typeof project!=="object")throw new TypeError("Project required");
 identifier(project.id);str(project.title,"title",250);privacy(project.privacy);
 if(!STAGES.includes(project.stage))throw new RangeError("Invalid workflow stage");
 if(!project.gates||typeof project.gates!=="object")throw new TypeError("Gate map missing");
 for(const gate of GATES){const g=project.gates[gate.id];if(!g||!["unreviewed","blocked","reviewed-pass"].includes(g.state))throw new TypeError("Invalid gate state "+gate.id);
 str(g.evidence,"evidence",1600);str(g.reviewer,"reviewer",160);if(g.reviewedAt!==null)stamp(g.reviewedAt);}
 if(!Array.isArray(project.audit)||project.audit.length>MAX_AUDIT||!Array.isArray(project.notes))throw new TypeError("Invalid record");
 return project;}
function addAudit(project,event,now){const a={at:stamp(now),kind:event.kind,detail:event.detail};return {...project,audit:[...project.audit,a].slice(-MAX_AUDIT),version:project.version+1};}
function reviewGate(project,gateId,assessment,now){validProject(project);
 if(!GATES.some(g=>g.id===gateId))throw new RangeError("Unknown completion gate");
 assessment=assessment||{};
 const state=assessment.state;if(!["unreviewed","blocked","reviewed-pass"].includes(state))throw new RangeError("Invalid assessment");
 const evidence=str(assessment.evidence||"","evidence",1600).trim(),reviewer=str(assessment.reviewer||"","reviewer",160).trim();
 if(state==="reviewed-pass"&&(!evidence||!reviewer))throw new Error("Passing a gate requires a real evidence reference and named reviewer");
 if(state==="reviewed-pass"&&gateId==="source"&&!project.sourceRef.trim()&&!evidence)throw new Error("Original source must be identified");
 const next={...project,gates:{...project.gates,[gateId]:{state,evidence,reviewer,reviewedAt:state==="unreviewed"?null:stamp(now)}}};
 return addAudit(next,{kind:"gate-review",detail:gateId+" → "+state},now);}
function setStage(project,stage,now){validProject(project);if(!STAGES.includes(stage))throw new RangeError("Unknown stage");
 return addAudit({...project,stage},{kind:"stage",detail:stage},now);}
function setSource(project,sourceRef,now){validProject(project);
 const next={...project,sourceRef:str(sourceRef,"sourceRef",600),gates:{...project.gates,source:{state:"unreviewed",evidence:"",reviewer:"",reviewedAt:null},words:{state:"unreviewed",evidence:"",reviewer:"",reviewedAt:null},owner:{state:"unreviewed",evidence:"",reviewer:"",reviewedAt:null}}};
 return addAudit(next,{kind:"source-change",detail:"Source reference updated; original wording and acceptance gates reset."},now);
}
function summary(project){validProject(project);
 const checks=GATES.map(g=>({id:g.id,title:g.title,state:project.gates[g.id].state,evidence:project.gates[g.id].evidence}));
 const passed=checks.filter(g=>g.state==="reviewed-pass").length;
 const blocked=checks.filter(g=>g.state==="blocked").length;
 const eligible=passed===GATES.length&&project.stage==="released";
 return {id:project.id,title:project.title,stage:project.stage,passed,total:GATES.length,blocked,
 percent:Math.round(100*passed/GATES.length),reviewReady:eligible,
 label:eligible?"ALL TRACKED GATES REVIEWED":"NOT 100% VERIFIED",
 warning:"Evidence review is not proof of perfection, legal certification, professional endorsement or complete retrieval."};
}
function newLedger(items=[]){if(!Array.isArray(items)||items.length>MAX_PROJECTS)throw new RangeError("Too many projects");
 const ids=new Set();const projects=items.map(x=>{const p=newProject(x);if(ids.has(p.id))throw new Error("Duplicate project ID");ids.add(p.id);return p;});
 return {schema:SCHEMA,version:1,projects};}
function validLedger(v){if(!v||v.schema!==SCHEMA||v.version!==1||!Array.isArray(v.projects)||v.projects.length>MAX_PROJECTS)throw new Error("Unsupported ledger schema");
 const ids=new Set();v.projects.forEach(p=>{validProject(p);if(ids.has(p.id))throw new Error("Duplicate ID");ids.add(p.id);});return v;}
function updateProject(ledger,updated){validLedger(ledger);validProject(updated);
 let found=false;const projects=ledger.projects.map(p=>{if(p.id!==updated.id)return p;found=true;return updated;});
 if(!found)throw new Error("Project not found");
 return {...ledger,projects};
}
function addProject(ledger,raw){validLedger(ledger);if(ledger.projects.length>=MAX_PROJECTS)throw new RangeError("Too many projects");const p=newProject(raw);
 if(ledger.projects.some(x=>x.id===p.id))throw new Error("Duplicate project ID");return {...ledger,projects:[...ledger.projects,p]};}
function redactPublic(ledger){validLedger(ledger);return {schema:"nathan-ai.completion-public-summary.v1",
 projects:ledger.projects.filter(x=>x.privacy==="public").map(x=>({id:x.id,title:x.title,track:x.track,summary:summary(x)}))};}
const api=Object.freeze({SCHEMA,GATES,STAGES,newProject,validProject,reviewGate,setStage,setSource,summary,newLedger,validLedger,updateProject,addProject,redactPublic});
if(typeof module!=="undefined"&&module.exports)module.exports=api;root.NathanCompletion=api;
})(typeof globalThis!=="undefined"?globalThis:this);
