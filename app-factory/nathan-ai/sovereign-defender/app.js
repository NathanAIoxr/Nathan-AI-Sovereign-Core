/* SOVEREIGN DEFENDER — browser-local, owner-selected read-only analysis.
   No uploads, no automatic security scans and no file/OS modifications.
   The original Hall of Mirrors classifier is referenced without alteration.
*/
(function(){'use strict';
const $=id=>document.getElementById(id),D=window.NathanSovereignDefender,H=window.TaborHallOfMirrors;
let report=null,baseline=null;
const textExtensions=new Set(['txt','md','js','cjs','mjs','ts','tsx','py','sh','bash','ps1','bat','cmd','html','json','yaml','yml','xml','sql','conf','ini','log']);
function add(root,tag,text,cls){const e=document.createElement(tag);if(text!==undefined)e.textContent=String(text);if(cls)e.className=cls;root.appendChild(e);return e}
function alertAt(id,message){$(id).textContent=message}
function download(text,name){const link=document.createElement('a');const url=URL.createObjectURL(new Blob([text],{type:'application/json'}));
 link.href=url;link.download=name;document.body.appendChild(link);link.click();link.remove();
 setTimeout(()=>URL.revokeObjectURL(url),1000)}
async function sha256(buffer){const digest=await crypto.subtle.digest('SHA-256',buffer);
 return Array.from(new Uint8Array(digest)).map(x=>x.toString(16).padStart(2,'0')).join('')}
async function inspect(){
 const files=Array.from($('localFiles').files||[]);
 if(!files.length){alertAt('inspectStatus','Select files you own before inspecting.');return}
 if(files.length>24){alertAt('inspectStatus','Maximum 24 files per browser inspection.');return}
 const entries=[],seen=new Set();let loaded=0;
 for(const file of files){
  if(!D.validPath(file.name)||seen.has(file.name)){alertAt('inspectStatus','Invalid or duplicate filename; choose uniquely named files.');return}
  seen.add(file.name);
  const ext=file.name.split('.').pop().toLowerCase();
  if(file.size>1024*1024){entries.push({path:file.name,status:'skipped-size-limit',bytes:file.size});continue}
  if(!textExtensions.has(ext)){entries.push({path:file.name,status:'skipped-file-type',bytes:file.size});continue}
  if(loaded+file.size>8*1024*1024){entries.push({path:file.name,status:'skipped-total-byte-limit',bytes:file.size});continue}
  const bytes=await file.arrayBuffer(),sha=await sha256(bytes);
  loaded+=file.size;
  const buffer=new Uint8Array(bytes);
  if(buffer.includes(0)){entries.push({path:file.name,status:'not-text',sha256:sha,bytes:file.size});continue}
  const contents=new TextDecoder('utf-8',{fatal:false}).decode(buffer);
  const verdict=H.classify(contents);
  entries.push({path:file.name,status:verdict.detected?'review-pattern':'browser-file',sha256:sha,bytes:file.size,reasons:verdict.reasons});
 }
 report=D.audit(entries);baseline=D.baselineFromReport(report);
 renderReport();$('exportReport').disabled=false;$('exportBaseline').disabled=false;
 alertAt('inspectStatus','Inspected selected files locally. No files were changed or uploaded by this page.');
}
function renderReport(){
 $('metrics').replaceChildren();$('results').replaceChildren();
 for(const [value,label]of [[report.summary.entries,'File records'],[report.summary.withIndicators,'Review indicators'],[report.summary.uninspected,'Not inspected']]){
  const box=add($('metrics'),'div',undefined,'counter');add(box,'strong',value);add(box,'span',label,'small')}
 for(const file of report.files){
  const box=add($('results'),'div',undefined,'result');add(box,'div',file.path,'name');
  add(box,'div','Status: '+file.status+' · '+(file.sha256?'SHA-256 '+file.sha256:'No file hash available'),'small');
  if(file.indicators.length){const list=add(box,'ul',undefined,'list');file.indicators.forEach(v=>add(list,'li',v))}
  else add(box,'div','No indicator observed in the limited data checked — not a safety clearance.','small');
 }
 add($('results'),'p',report.warning,'small');
}
async function compare(){
 if(!report){alertAt('compareStatus','Inspect the current files first.');return}
 const f=$('baselineFile').files?.[0];
 if(!f){alertAt('compareStatus','Choose a previously exported baseline JSON file.');return}
 if(f.size>2*1024*1024){alertAt('compareStatus','Baseline file exceeds the 2 MiB safety limit.');return}
 try{
  const doc=JSON.parse(await f.text());
  const b=doc.schema==='nathan-ai.sovereign-defender.cli.v1'?doc.baseline:doc;
  const result=D.compareBaseline(b,report);
  alertAt('compareStatus',result.status==='comparison-complete'?'Comparison complete.':'Comparison is incomplete; do not infer missing files were deleted.');
  $('compareResults').replaceChildren();
  for(const [key,label] of [['changed','Changed fingerprints'],['missing','Missing from selected files'],['added','New files'],['notVerified','Unverified files']]){
   const title=add($('compareResults'),'h3',label+' ('+result[key].length+')');
   if(result[key].length){const ul=add($('compareResults'),'ul',undefined,'list');result[key].forEach(p=>add(ul,'li',p))}
  }
  add($('compareResults'),'p',result.warning,'small');
 }catch(e){alertAt('compareStatus','Baseline not accepted: '+e.message)}
}
function simulate(){
 const events=[1,2,3,4].map(i=>({type:'rename',path:'fictional/original-'+i+'.txt',to:'fictional/original-'+i+'.txt.locked'}));
 events.push({type:'backup-unavailable',path:'fictional/offline-backup'});
 const r=D.syntheticRansomware(events);
 alertAt('simulationStatus',r.alert==='mock-alert'?'MOCK ALERT: fictional ransomware-like activity detected.':'No mock alert.');
 $('simulationResults').replaceChildren();
 const p=add($('simulationResults'),'p','Fictional events '+r.activity.total+' · real files changed '+r.filesChanged+' · real files encrypted '+r.filesEncrypted+' · network calls '+r.networkCalls);
 add($('simulationResults'),'p',r.note,'small');
}
function init(){
 if(!D||!H)throw Error('Original Hall classification and Defender engine are required');
 $('inspect').addEventListener('click',()=>inspect().catch(e=>alertAt('inspectStatus','Read-only inspection failed: '+e.message)));
 $('compare').addEventListener('click',()=>compare());
 $('simulate').addEventListener('click',simulate);
 $('exportReport').addEventListener('click',()=>{if(report)download(JSON.stringify(report,null,2),'nathan-defender-private-triage.json')});
 $('exportBaseline').addEventListener('click',()=>{if(baseline)download(JSON.stringify(baseline,null,2),'nathan-defender-private-baseline.json')});
 const ol=$('responseSteps');D.responseSteps().forEach(x=>add(ol,'li',x));
}
try{init()}catch(e){alertAt('inspectStatus','Original source modules unavailable: '+e.message)}
})();
