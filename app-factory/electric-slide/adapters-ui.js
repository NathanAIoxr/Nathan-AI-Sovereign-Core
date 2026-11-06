/* The Tabor Finger Electric Slide — all-target LOCAL template console.
 * Keyboard friendly, privacy preserving; does not contact providers.
 */
(function(){
 'use strict';
 const A=()=>window.TaborDestinationAdapters;
 const M=()=>window.TaborUniversalMatrix;
 const id=x=>document.getElementById(x);
 const memory=Object.create(null);
 const text=(tag,label,parent,cls)=>{
   const el=document.createElement(tag);
   if(label!==undefined)el.textContent=label;
   if(cls)el.className=cls;
   parent.appendChild(el);return el;
 };
 const setStatus=s=>{id('adapter-status').textContent=s;};
 function slug(s){return String(s).toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,55)||'draft';}
 function download(bytes,name,type){
   const url=URL.createObjectURL(new Blob([bytes],{type}));
   const link=document.createElement('a');link.href=url;link.download=name;
   document.body.appendChild(link);link.click();link.remove();
   window.setTimeout(()=>URL.revokeObjectURL(url),15000);
 }
 function formValues(){
   const fields=Object.create(null);
   id('logical-fields').querySelectorAll('[data-logical-field]').forEach(el=>fields[el.dataset.logicalField]=el.value);
   return fields;
 }
 function collect(){
   return {destinationId:id('destination').value,creator:id('owner').value,
     sourceLabel:id('source-label').value,originalSource:id('source').value,
     fields:formValues()};
 }
 function render(){
   const key=id('destination').value,api=A();
   if(!api)return;
   const t=api.template(key),region=id('logical-fields');
   region.replaceChildren();
   const values=memory[key]||Object.create(null);
   for(const f of t.fields){
     const wrapper=text('label','',region);
     const name=text('span',f.label,wrapper);
     name.style.display='block';
     const field=text('textarea','',wrapper);
     field.rows=2;field.placeholder=f.id+' — review required';
     field.dataset.logicalField=f.id;field.value=values[f.id]||'';
     field.setAttribute('aria-label',f.label);
     field.addEventListener('input',()=>{(memory[key]??=Object.create(null))[f.id]=field.value;});
   }
   const select=id('copy-field');select.replaceChildren();
   for(const f of t.fields)select.add(new Option(f.label,f.id));
   id('provider-template-note').textContent='Selected: '+t.destination.name+' · '+t.destination.sector+
     ' · '+t.fields.length+' logical fields. Provider-specific import, selectors and permissions are NOT verified; this is a local draft template.';
   setStatus('Template prepared for editing. Nothing uploaded, submitted or published.');
 }
 async function sha(source){
   if(!crypto?.subtle)throw Error('SHA-256 unavailable; open this site over HTTPS.');
   const data=new TextEncoder().encode(source),bytes=await crypto.subtle.digest('SHA-256',data);
   return Array.from(new Uint8Array(bytes)).map(x=>x.toString(16).padStart(2,'0')).join('');
 }
 async function withProvenance(){
   const input=collect();
   input.sourceSha256=await sha(input.originalSource);
   input.createdAtUtc=new Date().toISOString();
   return input;
 }
 function displayResult(packet,action){
   setStatus(action+' · Target: '+packet.destination.name+
     ' · '+packet.fields.length+' mapped logical fields.\nOriginal text preserved in full. No external upload or publication.\nSHA-256 (source UTF-8): '+packet.provenance.sha256+
     '\nUTC: '+packet.provenance.createdAtUtc+
     '\nWARNING: The exported package contains the original source. Keep it private.');
 }
 function bind(button,handler){
   id(button).addEventListener('click',async()=>{try{await handler();}catch(e){setStatus('NOT COMPLETED: '+e.message);}});
 }
 function boot(){
   if(!A()||!M())return;
   const audit=A().audit();
   if(!audit.ok){setStatus('Adapter registry is invalid: '+audit.errors.join('; '));return;}
   id('destination').addEventListener('change',render);
   render();
   bind('adapter-export-zip',async()=>{
     const input=await withProvenance(),packet=A().build(input);
     const zip=A().makeZip(input);
     download(zip,slug(input.destinationId)+'-ttfes-btp.zip','application/zip');
     displayResult(packet,'ZIP prepared for local download');
   });
   bind('adapter-export-json',async()=>{
     const input=await withProvenance(),packet=A().build(input);
     download(JSON.stringify(packet,null,2)+'\n',slug(input.destinationId)+'-ttfes-btp.json','application/json');
     displayResult(packet,'JSON prepared for local download');
   });
   bind('adapter-export-csv',async()=>{
     const input=await withProvenance(),packet=A().build(input);
     download(A().mappingCsv(packet),slug(input.destinationId)+'-mapping.csv','text/csv');
     displayResult(packet,'Generic reference CSV prepared for local download (NOT a provider-certified CSV import)');
   });
   bind('adapter-copy-field',async()=>{
     const key=id('copy-field').value,values=formValues();
     if(!Object.prototype.hasOwnProperty.call(values,key))throw Error('Choose a logical field.');
     if(!navigator.clipboard?.writeText)throw Error('Clipboard unavailable in this browser context.');
     await navigator.clipboard.writeText(values[key]);
     setStatus('Copied the '+key+' field to clipboard; paste it manually into the correct provider field. No remote update.');
   });
 }
 document.addEventListener('DOMContentLoaded',boot);
})();