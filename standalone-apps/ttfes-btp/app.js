/* TTFES&BTP — standalone browser controller. No remote calls, no localStorage,
 * no account tokens, no external libraries. Creator Nathan Tabor.
 */
(function(){
 'use strict';
 const C=()=>window.TTFESCatalog,E=()=>window.TTFESCore;
 const el=id=>document.getElementById(id);
 const state={
   selected:[],fields:Object.create(null),active:null,
   originalFile:null,originalDecoded:null,originalBytes:null,assets:[],ledger:[]
 };
 const MAX_VIEW=150;
 function say(id,message){el(id).textContent=String(message);}
 function log(message) {
   const entry={utc:new Date().toISOString(),event:String(message)};
   state.ledger.unshift(entry);
   if(state.ledger.length>250)state.ledger.length=250;
   const list=el('action-log');list.replaceChildren();
   for(const item of state.ledger.slice(0,45)){
     const line=document.createElement('li');line.textContent=item.utc+' | '+item.event;list.append(line);
   }
 }
 function append(parent,tag,value,cls){
   const x=document.createElement(tag);if(value!==undefined)x.textContent=value;
   if(cls)x.className=cls;parent.append(x);return x;
 }
 function download(contents,name,type){
   const b=new Blob([contents],{type:type||'application/octet-stream'});
   const url=URL.createObjectURL(b),link=document.createElement('a');
   link.href=url;link.download=name;document.body.append(link);link.click();link.remove();
   setTimeout(()=>URL.revokeObjectURL(url),20000);
 }
 function sourceValue(){
   return state.originalDecoded!==null?state.originalDecoded:el('original-source').value;
 }
 function metadata(){
   return {projectTitle:el('project-title').value,
     creator:el('creator').value,reference:el('source-reference').value,source:sourceValue()};
 }
 function inputTargets(){
   return state.selected.map(id=>({id,fields:state.fields[id]||{}}));
 }
 function getTarget(id){
   const t=C().lookup(id);
   if(!t)throw Error('Destination no longer exists in catalog: '+id);
   return t;
 }
 function clearRawImport(){
   state.originalDecoded=null;state.originalBytes=null;state.originalFile=null;
 }
 function getRawValid(){
   return E().confirmOriginal(sourceValue());
 }
 function safeRun(status,fn){
   return async()=>{try{await fn();}catch(error){say(status,'NOT COMPLETED: '+error.message);log('Blocked: '+error.message);}};
 }
 function fillStats(){
   const report=C().validate();
   if(!report.ok)throw Error('Catalog invalid: '+report.errors.join(','));
   el('stat-targets').textContent=report.count;
   el('stat-sectors').textContent=report.sectors;
   for(const sector of C().SECTORS)el('sector-filter').add(new Option(sector,sector));
 }
 function filteredTargets(){
   const query=el('search').value.trim().toLocaleLowerCase();
   const sector=el('sector-filter').value,mode=el('workflow-filter').value;
   return C().TARGETS.filter(t=>(!sector||t.sector===sector)&&(!mode||mode===t.workflow)&&
     (!query||[t.name,t.sector,t.workflow,...t.fields.map(f=>f.label)].join(' ').toLocaleLowerCase().includes(query)));
 }
 function renderList(){
   const all=filteredTargets(),root=el('target-list');root.replaceChildren();
   for(const t of all.slice(0,MAX_VIEW)){
     const card=append(root,'article','', 'target'+(state.selected.includes(t.id)?' selected':''));
     append(card,'div',t.sector,'sector');append(card,'h3',t.name);
     append(card,'div',t.workflow==='restricted'?'Human-only official submission':t.workflow==='manual'?'Manual research/review':'Local package + manual handoff','mode');
     append(card,'small',t.fields.length+' typed logical fields','mode');
     const btn=append(card,'button',state.selected.includes(t.id)?'REMOVE':'ADD TO BATCH');
     btn.type='button';
     btn.setAttribute('aria-label',(state.selected.includes(t.id)?'Remove ':'Add ')+t.name);
     btn.addEventListener('click',()=>toggle(t.id));
   }
   say('target-summary',all.length+' matches of '+C().TARGETS.length+
     ' destinations across '+C().SECTORS.length+' sectors · '+state.selected.length+' selected'+
     (all.length>MAX_VIEW?' · showing first '+MAX_VIEW:'')+'.');
 }
 function toggle(id){
   const existing=state.selected.indexOf(id);
   if(existing>=0){
     state.selected.splice(existing,1);
     if(state.active===id)state.active=state.selected[0]||null;
     log('Removed local destination '+id);
   } else {
     if(state.selected.length>=E().MAX_TARGETS){
       say('target-summary','Selection limit '+E().MAX_TARGETS+' destinations. Export current batch first.');return;
     }
     state.selected.push(id);
     state.fields[id]??=Object.create(null);
     state.active=id;log('Added local destination '+id);
   }
   renderAll();
 }
 function renderSelections(){
   const region=el('selected-tags');region.replaceChildren();
   const select=el('active-target');select.replaceChildren();
   if(!state.selected.length){select.add(new Option('Choose destinations above',''));state.active=null;}
   for(const id of state.selected){
     const t=getTarget(id);
     select.add(new Option(t.name,id));
     const tag=append(region,'span','', 'tag');
     append(tag,'span',t.name);
     const b=append(tag,'button','×');b.type='button';b.setAttribute('aria-label','Remove '+t.name);
     b.addEventListener('click',()=>toggle(id));
   }
   if(state.active&&state.selected.includes(state.active))select.value=state.active;
   else if(state.selected.length){state.active=state.selected[0];select.value=state.active;}
   const batch=el('batch-list');batch.replaceChildren();
   for(const id of state.selected){append(batch,'span',getTarget(id).name,'tag');}
   if(!state.selected.length)append(batch,'span','No targets selected.','muted');
 }
 function renderEditor(){
   const root=el('form-fields');root.replaceChildren();
   const select=el('field-copy');select.replaceChildren();
   if(!state.active){select.add(new Option('Choose a destination',''));return;}
   const t=getTarget(state.active),map=state.fields[t.id]??=Object.create(null);
   for(const spec of t.fields){
     const label=append(root,'label','',spec.ownerReview?'sensitive':'');
     append(label,'span',spec.label+(spec.ownerReview?' · REVIEW':''));
     if(['tax_info','account_info','residency','certification'].includes(spec.key)){
       const small=append(label,'small','ENTER ONLY ON THE OFFICIAL PORTAL. Never enter a personal ID, tax, bank or legally binding attestation here.');
       small.style.display='block';
       const box=append(label,'textarea','');
       box.value='OFFICIAL SITE ONLY — DO NOT ENTER SENSITIVE VALUES';box.disabled=true;box.rows=2;
       continue;
     }
     const box=append(label,'textarea','');
     box.dataset.fieldKey=spec.key;
     box.rows=['body','proposal','syllabus','description','modules','budget_justification'].includes(spec.key)?5:2;
     box.placeholder='Prepared '+spec.label.toLowerCase()+' — verify accuracy on the destination site';
     box.value=map[spec.key]||'';
     box.addEventListener('input',()=>{map[spec.key]=box.value;});
     select.add(new Option(spec.label,spec.key));
   }
   say('field-status','Editing '+t.name+' · '+t.fields.length+
     ' logical field coordinates. These are not verified provider selectors. Review the target’s actual form before pasting.');
 }
 function renderAll(){renderList();renderSelections();renderEditor();}
 function buildCurrent(){
   const meta=metadata();
   if(!state.active)throw Error('Select a destination.');
   return E().createDraft({...meta,reference:meta.reference,destinationId:state.active,
     fields:state.fields[state.active]||{}});
 }
 async function copy(text,status,message){
   if(!navigator.clipboard||!navigator.clipboard.writeText)throw Error('Clipboard unavailable. Use HTTPS or export a file instead.');
   await navigator.clipboard.writeText(text);say(status,message);
 }
 async function loadSourceFile(file){
   if(!file)throw Error('No file selected.');
   if(file.size>E().MAX_SOURCE)throw Error('Source file exceeds 10 MiB. Split without altering its bytes.');
   if(!/\.(txt|md)$/i.test(file.name))throw Error('Choose a UTF-8 TXT or MD file.');
   const bytes=new Uint8Array(await file.arrayBuffer()),decoded=new TextDecoder('utf-8',{fatal:true}).decode(bytes);
   // Preserve independent raw-byte source even if the textarea presents normalized CRLF.
   state.originalBytes=bytes;state.originalDecoded=decoded;state.originalFile=file.name;
   el('original-source').value=decoded;
   el('source-reference').value=file.name.slice(0,140);
   say('source-status','Original source imported locally: '+file.name+' · '+bytes.byteLength+
     ' exact bytes retained in memory for package export. An edit in the textarea switches to the edited version.');
   log('Imported source '+file.name+' ('+bytes.byteLength+' bytes; no upload)');
 }
 async function loadAssets(list){
   const files=Array.from(list||[]);
   const all=[...state.assets],known=new Set(all.map(x=>x.name+':'+x.bytes.length));
   for(const f of files){
     if(all.length>=30)throw Error('At most 30 assets per package.');
     const bytes=new Uint8Array(await f.arrayBuffer());
     if(all.reduce((a,b)=>a+b.bytes.length,0)+bytes.length>32*1024*1024)throw Error('Media over 32 MiB.');
     const key=f.name+':'+bytes.length;if(known.has(key))continue;
     known.add(key);all.push({name:f.name,bytes});
   }
   state.assets=all;
   const root=el('asset-list');root.replaceChildren();
   all.forEach((a,i)=>{
     const li=append(root,'li',a.name+' · '+Math.round(a.bytes.length/1024)+' KiB · ');
     const b=append(li,'button','Remove');b.type='button';b.style.minHeight='25px';b.style.padding='0 6px';
     b.addEventListener('click',()=>{
       state.assets.splice(i,1);loadAssets([]);});
   });
   log('Local media asset inventory: '+all.length+' files');
 }
 function workspace(){
   const meta=metadata();
   return {schema:E().VERSION,source:meta.source,projectTitle:meta.projectTitle,
     creator:meta.creator,reference:meta.reference,targets:inputTargets(),
     caveat:'Private draft only. Local source included; no media binaries in this editable JSON. All actual submissions are owner-driven.'};
 }
 function reviewFlags(){
   return {rightsReviewed:el('review-rights').checked,
     claimsReviewed:el('review-claims').checked,
     governmentAware:el('review-government').checked};
 }
 function makePreviewContent(asPrompt){
   if(!state.active)throw Error('Select a destination.');
   const d=buildCurrent();
   const txt=asPrompt?E().makePrompt(state.active,sourceValue()):E().markdown(d);
   el('preview').value=txt;el('preview-wrap').open=true;
   say('field-status',(asPrompt?'Creative prompt':'Readable preview')+' created locally. No external service contacted.');
   log((asPrompt?'Prompt':'Preview')+' for '+state.active);
 }
 function boot(){
   if(!C()||!E()){say('source-status','Core scripts unavailable. Open this application from a complete checkout.');return;}
   try{fillStats();}catch(error){say('source-status','Catalog failed: '+error.message);return;}
   renderAll();
   ['search','sector-filter','workflow-filter'].forEach(name=>
     el(name).addEventListener(name==='search'?'input':'change',renderList));
   el('add-visible').addEventListener('click',()=>{
     const list=filteredTargets();const added=[];
     for(const t of list){
       if(state.selected.length>=E().MAX_TARGETS)break;
       if(!state.selected.includes(t.id)){state.selected.push(t.id);state.fields[t.id]??=Object.create(null);added.push(t.id);}
     }
     if(added.length)state.active=added[0];
     renderAll();log('Added '+added.length+' filtered destination templates');
   });
   el('remove-all').addEventListener('click',()=>{
     state.selected=[];state.active=null;renderAll();log('Cleared selected targets (original source remains)');
   });
   el('active-target').addEventListener('change',function(){state.active=this.value;renderEditor();});
   el('original-source').addEventListener('input',()=>{
     if(state.originalBytes)log('Source text edited: raw imported file remains separate only in your independent backup');
     clearRawImport();
     say('source-status','Original editor changed. Text will be preserved as now supplied; no previous input was overwritten on disk.');
   });
   el('source-file').addEventListener('change',safeRun('source-status',async function(){
     if(this.files&&this.files.length)await loadSourceFile(this.files[0]);this.value='';
   }).bind(el('source-file')));
   el('source-hash').addEventListener('click',safeRun('source-status',async()=>{
     const value=getRawValid();
     const hash=await E().sha256(state.originalBytes||new TextEncoder().encode(value));
     say('source-status','SHA-256: '+hash+'\n'+(state.originalBytes?'Exact imported original file bytes.':'UTF-8 representation of current source text.')+
       '\nThis is a fingerprint, not encryption or independent proof of authorship.');
     log('SHA-256 computed for local source');
   }));
   el('save-original').addEventListener('click',safeRun('source-status',async()=>{
     const value=getRawValid();
     download(state.originalBytes||new TextEncoder().encode(value),
       E().filename(el('source-reference').value||'original')+'.txt','text/plain;charset=utf-8');
     say('source-status','Prepared original source for download. Browser save must complete; no external transfer.');
   }));
   el('restore-source').addEventListener('click',safeRun('source-status',async()=>{
     if(!state.originalFile||!state.originalBytes)throw Error('No currently loaded file to restore. Reload it from disk.');
     const val=new TextDecoder('utf-8',{fatal:true}).decode(state.originalBytes);
     state.originalDecoded=val;el('original-source').value=val;say('source-status','Re-displayed '+state.originalFile+' exact source bytes.');
   }));
   el('make-prompt').addEventListener('click',safeRun('field-status',()=>makePreviewContent(true)));
   el('make-preview').addEventListener('click',safeRun('field-status',()=>makePreviewContent(false)));
   el('copy-preview').addEventListener('click',safeRun('field-status',async()=>copy(el('preview').value,'field-status','Preview copied, not submitted.')));
   el('save-preview').addEventListener('click',safeRun('field-status',async()=>{
     download(el('preview').value,'ttfes-btp-preview.txt','text/plain');log('Saved preview text');
   }));
   el('copy-field').addEventListener('click',safeRun('field-status',async()=>{
     if(!state.active)throw Error('Select a destination.');
     const k=el('field-copy').value;
     if(!k)throw Error('Choose a permitted field.');
     const value=(state.fields[state.active]||{})[k]||'';
     await copy(value,'field-status','Copied '+getTarget(state.active).name+' / '+k+
       '. Focus the appropriate target form field and paste manually.');
     log('Copied logical field '+state.active+'.'+k);
   }));
   el('asset-files').addEventListener('change',safeRun('batch-status',async function(){
     await loadAssets(this.files);this.value='';
   }).bind(el('asset-files')));
   el('export-batch').addEventListener('click',safeRun('batch-status',async()=>{
     const meta=metadata();if(!state.selected.length)throw Error('Select at least one destination.');
     const flags=reviewFlags();
     const result=await E().buildPackage({...meta,targets:inputTargets(),
       originalBytes:state.originalBytes,assets:state.assets,review:flags});
     download(result.bytes,'ttfes-btp-'+E().filename(meta.projectTitle)+'.zip','application/zip');
     const advisory=flags.rightsReviewed&&flags.claimsReviewed&&flags.governmentAware?
       'All three creator acknowledgment boxes were checked (self-reported; not verified).':
       'Creator review boxes incomplete. Package remains a draft.';
     say('batch-status','ZIP prepared for browser download: '+(result.bytes.length/1024).toFixed(1)+
       ' KiB, '+result.drafts.length+' destinations, '+state.assets.length+' media assets.\n'+
       'SOURCE SHA-256: '+result.manifest.sourceTextSha256+'\n'+advisory+
       '\nNothing uploaded, officially certified, paid, signed, approved or published.');
     log('Generated '+result.drafts.length+'-destination ZIP (local only)');
   }));
   el('export-project').addEventListener('click',safeRun('batch-status',async()=>{
     if(!state.selected.length)throw Error('Add at least one destination before saving the workspace.');
     const raw=E().validateWorkspace(workspace());
     download(JSON.stringify(raw,null,2)+'\n',E().filename(raw.projectTitle)+'-workspace.json','application/json');
     say('batch-status','Editable workspace JSON prepared for download. This includes the source TEXT and draft fields but not attachment bytes.');
     log('Workspace exported locally');
   }));
   el('import-project').addEventListener('change',safeRun('batch-status',async function(){
     const f=this.files?.[0];if(!f)return;
     if(f.size>12*1024*1024)throw Error('Workspace JSON file too large.');
     const restored=E().validateWorkspace(JSON.parse(await f.text()));
     el('project-title').value=restored.projectTitle;
     el('creator').value=restored.creator;
     el('source-reference').value=restored.reference;
     clearRawImport();el('original-source').value=restored.source;
     state.selected=restored.targets.map(t=>t.id);
     state.fields=Object.create(null);for(const t of restored.targets)state.fields[t.id]={...t.fields};
     state.active=state.selected[0]||null;renderAll();
     say('batch-status','Workspace restored from local JSON. Review its source, fields and rights before export.');
     log('Workspace imported locally: '+restored.targets.length+' targets');
     this.value='';
   }).bind(el('import-project')));
   el('export-csv').addEventListener('click',safeRun('batch-status',async()=>{
     const meta=metadata();
     if(!state.selected.length)throw Error('Select at least one destination.');
     const drafts=E().batchDrafts(meta.source,inputTargets(),meta);
     download(E().csvList(drafts),'ttfes-btp-all-logical-fields.csv','text/csv;charset=utf-8');
     say('batch-status','Generic CSV mapping prepared for download. It is NOT a provider-certified import format.');
     log('Reference CSV for '+drafts.length+' destinations');
   }));
   el('export-json').addEventListener('click',safeRun('batch-status',async()=>{
     const draft=buildCurrent();
     download(JSON.stringify(draft,null,2)+'\n','ttfes-btp-'+draft.destination.id+'.json','application/json');
     say('batch-status','Active destination JSON prepared. Source included; store privately. Nothing submitted.');
     log('Active destination JSON '+draft.destination.id);
   }));
   el('download-log').addEventListener('click',safeRun('batch-status',async()=>{
     download(JSON.stringify({schema:E().VERSION,events:state.ledger},null,2)+'\n',
       'ttfes-btp-local-ledger.json','application/json');
     say('batch-status','A local action ledger was prepared for download. Not a remote audit receipt.');
   }));
   if('serviceWorker' in navigator && location.protocol==='https:'){
     navigator.serviceWorker.register('./sw.js',{scope:'./'}).catch(()=>{
       log('Offline shell registration unavailable; app remains usable while page is open.');
     });
   }
   log('TTFES&BTP standalone application initialized without external connections');
 }
 document.addEventListener('DOMContentLoaded',boot);
})();