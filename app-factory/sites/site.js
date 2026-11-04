
(function(){
'use strict';
var tag=document.getElementById('site-data');
if(!tag)return;
var cfg;
try{cfg=JSON.parse(tag.textContent);}catch(e){return;}
var form=document.getElementById('site-form'),out=document.getElementById('preview'),status=document.getElementById('status'),title=document.getElementById('project-title'),focus=document.getElementById('project-track'),notes=document.getElementById('project-notes'),original=document.getElementById('source-value');
var latest=null, MAX=16000;
function printable(v){return String(v||'').replace(/\r\n/g,'\n').slice(0,MAX);}
function create(){
 var name=printable(title.value).trim().slice(0,160)||'Untitled working draft';
 var track=focus.value;
 var note=printable(notes.value).trim();
 var source=original?printable(original.value):'';
 return {schema:'nathan-ai.local-studio.v1',site:cfg.title,project:name,focus:track,notes:note,original_text:source,steps:cfg.steps.slice(),created_at:new Date().toISOString(),note:'Owner-controlled local draft; no server submission or project publication.'};
}
function format(record){
 var lines=[record.site,record.project,'FOCUS: '+record.focus,'','ORIGINAL TEXT / SOURCE:'];
 lines.push(record.original_text||'(not entered)');
 if(cfg.textTool){lines.push('','LITERAL MIRROR (CODEPOINT REVERSE):',Array.from(record.original_text).reverse().join(''),'This is a literal reverse, not a translation or evidence of etymology.');}
 lines.push('','WORKING NOTES:',record.notes||'(none)','', 'WORK PLAN:');
 record.steps.forEach(function(step,i){lines.push(String(i+1)+'. '+step);});
 lines.push('','SOURCE BOUNDARY: '+cfg.notice);
 return lines.join('\n');
}
function show(record){latest=record;out.textContent=format(record);status.textContent='A working plan is ready. No information has been sent anywhere.';}
form.addEventListener('submit',function(event){event.preventDefault();show(create());});
document.getElementById('export-plan').addEventListener('click',function(){
 var record=latest||create();show(record);
 var blob=new Blob([JSON.stringify(record,null,2)],{type:'application/json;charset=utf-8'});
 var href=URL.createObjectURL(blob);
 var a=document.createElement('a');a.href=href;a.download=cfg.slug.replace(/[^a-z0-9-]/g,'')+'-working-plan.json';
 document.body.append(a);a.click();a.remove();setTimeout(function(){URL.revokeObjectURL(href);},1500);
 status.textContent='The browser downloaded a JSON working plan.';
});
document.getElementById('copy-plan').addEventListener('click',function(){
 var record=latest||create();show(record);var value=format(record);
 if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(value).then(function(){status.textContent='Copied the plan.';}).catch(function(){status.textContent='Clipboard unavailable. Select the plan text and copy it manually.';});}
 else status.textContent='Clipboard unavailable. Select the plan text and copy it manually.';
});
document.getElementById('reset-plan').addEventListener('click',function(){form.reset();out.textContent='Build an outline using the form to see it here.';status.textContent='Working fields cleared in this tab.';latest=null;});
document.getElementById('print-plan').addEventListener('click',function(){show(latest||create());window.print();});
document.getElementById('restore-plan').addEventListener('change',function(event){
 var file=event.target.files&&event.target.files[0];if(!file)return;
 if(file.size>MAX*4){status.textContent='File too large. Use a working-plan JSON under 64 KB.';event.target.value='';return;}
 file.text().then(function(text){
 var r=JSON.parse(text);if(!r||r.schema!=='nathan-ai.local-studio.v1'||r.site!==cfg.title||typeof r.project!=='string'||typeof r.notes!=='string'||typeof r.original_text!=='string'||!Array.isArray(r.steps))throw Error('Not a matching local plan');
 title.value=r.project.slice(0,160);if(Array.from(focus.options).some(function(o){return o.value===r.focus;}))focus.value=r.focus;notes.value=r.notes.slice(0,MAX);if(original)original.value=r.original_text.slice(0,MAX);show(create());
 }).catch(function(){status.textContent='This file is not a valid working-plan backup for this site.';}).finally(function(){event.target.value='';});
});
out.textContent='Build an outline using the form to see it here.';
})();
