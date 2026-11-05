/* Nathan AI Program Jobs Atlas — deterministic, read-only catalog + owner-local review.
   No network scanning, malware execution, remote actions or claims of verified deployment.
   Preserve original source references and independent record types. */
(function(root,factory){'use strict';const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.NathanProgramJobs=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){'use strict';
const SCHEMA='nathan-ai.program-jobs-atlas.v1';
const REVIEW_SCHEMA='nathan-ai.program-jobs.review.v1';
const GATES=Object.freeze([
 Object.freeze({id:'source',label:'Original source and provenance',help:'Locate the authored source, confirm authorship and distinguish copies/versions'}),
 Object.freeze({id:'build',label:'Reproducible build or execution',help:'Dependencies, build/install instructions and a working demonstration'}),
 Object.freeze({id:'tests',label:'Tests executed and passed',help:'Record the command, environment and actual results, not just a test filename'}),
 Object.freeze({id:'safety',label:'Security, privacy and consent review',help:'Verify scope, secrets, authorization, threat model and non-destructive recovery'}),
 Object.freeze({id:'release',label:'Installation, release and rollback',help:'Validate distribution location, release receipts and rollback before calling it complete'})
]);
const VALID=new Set(['pending','blocked','passed']);
const clean=s=>String(s==null?'':s).trim();
const normal=s=>clean(s).toLocaleLowerCase();
function validateCatalog(c){
 if(!c||c.schema!==SCHEMA||!Array.isArray(c.jobs)||!Array.isArray(c.records))throw Error('Invalid program catalog schema');
 const jobs=new Set(),ids=new Set();
 for(const j of c.jobs){if(!j||!clean(j.id)||!clean(j.title)||jobs.has(j.id)||!Array.isArray(j.tasks))throw Error('Invalid or duplicate job');jobs.add(j.id);}
 for(const r of c.records){if(!r||!clean(r.id)||!clean(r.name)||ids.has(r.id)||!jobs.has(r.job)||!clean(r.kind)||!clean(r.status))throw Error('Invalid catalog record');ids.add(r.id);}
 return {recordCount:ids.size,jobCount:jobs.size};
}
function filterRecords(records,filters){
 const f=filters||{},q=normal(f.q);
 return records.filter(r=>{
 if(f.job&&f.job!=='all'&&r.job!==f.job)return false;
 if(f.kind&&f.kind!=='all'&&r.kind!==f.kind)return false;
 if(f.status&&f.status!=='all'&&r.status!==f.status)return false;
 if(!q)return true;
 return [r.name,r.id,r.job,r.kind,r.status,r.evidence,r.sourcePath,r.nextTask,r.legacyCategory,(r.files||[]).join(' ')].some(v=>normal(v).includes(q));
 });
}
function summarize(c,items){
 const records=items||c.records;let kind={},job={},status={};
 for(const r of records){kind[r.kind]=(kind[r.kind]||0)+1;job[r.job]=(job[r.job]||0)+1;status[r.status]=(status[r.status]||0)+1;}
 return {total:records.length,kind,job,status};
}
function tasksFor(record,job){
 const out=[clean(record.nextTask)].concat((job&&Array.isArray(job.tasks))?job.tasks:[]);
 return [...new Set(out.filter(Boolean))];
}
function blankReview(id){return {id,notes:'',gates:Object.fromEntries(GATES.map(g=>[g.id,{status:'pending',evidence:''}]))};}
function validateReview(review){
 if(!review||!clean(review.id)||!review.gates||typeof review.gates!=='object')throw Error('Invalid review');
 const next=blankReview(review.id);next.notes=clean(review.notes).slice(0,2000);
 for(const gate of GATES){const v=review.gates[gate.id]||{status:'pending',evidence:''};
 if(!VALID.has(v.status))throw Error('Invalid gate status');
 const evidence=clean(v.evidence).slice(0,2000);
 if(v.status==='passed'&&evidence.length<8)throw Error('A passed gate requires an evidence note (8+ characters)');
 next.gates[gate.id]={status:v.status,evidence};
 }
 return next;
}
function gateProgress(review){
 const r=validateReview(review);
 const passed=GATES.filter(g=>r.gates[g.id].status==='passed').length;
 const blocked=GATES.filter(g=>r.gates[g.id].status==='blocked').length;
 return {passed,blocked,total:GATES.length,ownerReportedComplete:passed===GATES.length,percent:Math.round(100*passed/GATES.length)};
}
function reviewExport(c,reviews){
 validateCatalog(c);
 const accepted={};
 for(const r of c.records){if(reviews&&reviews[r.id])accepted[r.id]=validateReview(reviews[r.id]);}
 return {schema:REVIEW_SCHEMA,catalogSchema:SCHEMA,catalogSourceTree:c.sourceTree,sourceRepository:c.sourceRepository,reviewStatus:'owner-reported-not-independent-verification',reviews:accepted};
}
function reviewImport(c,payload){
 validateCatalog(c);
 if(!payload||payload.schema!==REVIEW_SCHEMA||typeof payload.reviews!=='object'||Array.isArray(payload.reviews))throw Error('Invalid review import');
 const ids=new Set(c.records.map(r=>r.id)),out={};
 for(const [id,value] of Object.entries(payload.reviews)){if(!ids.has(id))continue;if(value.id!==id)throw Error('Review identity mismatch');out[id]=validateReview(value);}
 return out;
}
function exportCsv(records){
 const col=['id','kind','name','job','status','evidence','sourcePath','sourceUrl','sourceCount','testCount','nextTask'];
 const esc=v=>{let s=String(v===undefined||v===null?'':v);if(/^[\t\r\n ]*[=+\-@]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"';};
 return [col.join(','),...records.map(r=>col.map(k=>esc(r[k])).join(','))].join('\r\n')+'\r\n';
}
return Object.freeze({SCHEMA,REVIEW_SCHEMA,GATES,validateCatalog,filterRecords,summarize,tasksFor,blankReview,validateReview,gateProgress,reviewExport,reviewImport,exportCsv});
});
