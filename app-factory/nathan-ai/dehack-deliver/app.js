/* NATHAN AI DEHACK/DELIVER consumer app.
 * Source and user review content stay in memory until explicit download.
 * Nothing in the page can access remote accounts, secretly upload, erase a
 * document, label a human a liar, or alter physical resources.
 */
(function(){'use strict';
const C=window.NathanDehackCatalog,T=window.NathanDehackTools,$=id=>document.getElementById(id);
let items=C.records,sourceFile=null,sourceDigest=null,selection={mode:'evidence',title:'MIDA / REALITIST Evidence Review'},lastResult=null;
function element(host,tag,value,cls){const el=document.createElement(tag);if(value!==undefined)el.textContent=String(value);if(cls)el.className=cls;host.appendChild(el);return el}
function setStatus(id,value){$(id).textContent=value}
function download(data,name,type='application/json'){
 const obj=data instanceof Blob?data:new Blob([data],{type});
 const url=URL.createObjectURL(obj),a=document.createElement('a');
 a.href=url;a.download=name;document.body.append(a);a.click();a.remove();
 setTimeout(()=>URL.revokeObjectURL(url),1200);
}
function select(mode,title,description){
 selection={mode,title};
 setStatus('modeStatus',title+' · '+(mode==='worksheet'?'Source-linked worksheet; specialized implementation still required':'Local processing utility')+(description?' · '+description:''));
 $('labelA').textContent=mode==='share'?'Total resource pool (integer cents)':'Original passage, claim or data';
 $('labelB').textContent=mode==='share'?'Percent to share (0–100)':mode==='compare'?'Alternate text or translation':'Source citation or interpretation';
 $('inputA').placeholder=mode==='share'?'e.g. 10000':'Paste original source text';
 $('inputB').placeholder=mode==='share'?'e.g. 20':mode==='compare'?'Paste alternative text':'Enter a citation or source reference';
 setStatus('workStatus','Selected '+title+'. No processing performed until you press Run.');
}
function renderFilters(){
 const box=$('filterControls');box.replaceChildren();
 for(const filter of C.FILTERS){
  const b=element(box,'button',filter.title);b.type='button';
  b.addEventListener('click',()=>{
   select(filter.mode,filter.title,filter.notice);
   setStatus('filterExplanation',filter.notice);
   $('workbench').scrollIntoView({block:'start',behavior:'auto'});
  });
 }
}
function renderDirectory(){
 const list=$('tools');list.replaceChildren();
 const filtered=C.search(items,$('find').value,$('letter').value);
 setStatus('count',filtered.length+' of '+items.length+' original named entries · author heading says 101, source contains 104');
 for(const r of filtered){
  const card=element(list,'article',undefined,'tool');
  element(card,'span',r.letter+' · #'+r.ordinal+' · '+(r.workingMode==='worksheet'?'source registered':'shared processing action'),'badge');
  element(card,'h3',r.title);
  element(card,'p',r.description);
  const b=element(card,'button','Open '+(r.workingMode==='worksheet'?'source worksheet':'working action'));b.type='button';
  b.addEventListener('click',()=>{
   select(r.workingMode,r.title,r.workingMode==='worksheet'?
    'Original program name preserved; this creates a reviewable, exportable evidence worksheet, not an invented specialized product.':
    'Shared reusable engine, not a full implementation of every feature described in the source.');
   if(!r.description.startsWith('Source description available')){
    $('inputA').value=r.verbatimLine||r.description;
   }else $('inputA').value='';
   $('inputB').value='';$('workbench').scrollIntoView({behavior:'auto',block:'start'});
  });
 }
}
async function sha(buffer){
 const d=await crypto.subtle.digest('SHA-256',buffer);
 return Array.from(new Uint8Array(d)).map(x=>x.toString(16).padStart(2,'0')).join('');
}
async function importSource(){
 const file=$('originalFile').files?.[0];if(!file)return;
 if(file.size>200000){setStatus('sourceStatus','File exceeds 200 kB. The original is unchanged.');return}
 try{
  const bytes=await file.arrayBuffer(),txt=new TextDecoder('utf-8',{fatal:true}).decode(bytes),parsed=C.parseOriginal(txt);
  const digest=await sha(bytes);
  items=parsed;sourceFile=file;sourceDigest=digest;
  $('exportSource').disabled=false;
  setStatus('sourceStatus','All 104 exact titles and descriptions loaded. SHA-256 '+digest+
   (digest===C.SOURCE_SHA256?' — matches the supplied original bytes.':' — differs from the supplied source receipt; preserve both versions.'));
  renderDirectory();
 }catch(e){setStatus('sourceStatus','Import not applied: '+e.message+'. Existing source and workspace remain unchanged.')}
}
function doTool(){
 const a=$('inputA').value,b=$('inputB').value,m=selection.mode;
 try{
  let result;
  if(m==='evidence'||m==='worksheet'){
   result=T.evidenceReview(a,b,selection.title);
   if(m==='worksheet')result={...result,task:selection.title,implementationStatus:'review-worksheet-only',specializedToolBuilt:false};
  }else if(m==='plain')result=T.plainPreview(a);
  else if(m==='compare')result=T.compareSources(a,b);
  else if(m==='share')result=T.share(a,b||'20');
  else if(m==='clear'){clearLocal();return}
  else throw Error('Unsupported operation');
  lastResult={sourceTitle:selection.title,operation:m,output:result,sourceLocked:!!sourceFile};
  $('toolOutput').textContent=JSON.stringify(lastResult,null,2);
  $('exportResult').disabled=false;setStatus('workStatus','Review complete in page memory. Original input remains unchanged.');
 }catch(e){setStatus('workStatus','Review not completed: '+e.message)}
}
function clearLocal(){
 $('inputA').value='';$('inputB').value='';lastResult=null;
 $('toolOutput').textContent=JSON.stringify(T.clearWorkspace(),null,2);
 $('exportResult').disabled=true;setStatus('workStatus','CLEAR: only in-page draft inputs and review results cleared. Original catalog, uploads and remote records were not deleted.');
}
function wire(){
 C.validateRecords();
 for(const letter of C.LETTERS){const option=document.createElement('option');option.value=letter;option.textContent=letter;$('letter').append(option)}
 $('find').addEventListener('input',renderDirectory);
 $('letter').addEventListener('change',renderDirectory);
 $('originalFile').addEventListener('change',importSource);
 $('runRadix').addEventListener('click',()=>{
  try{const r=T.radixReview($('leftValue').value,$('rightValue').value);
   $('radixResult').textContent=r.decimal+'\n'+r.binary+'\n'+r.note;}
  catch(e){$('radixResult').textContent='Calculation not completed: '+e.message}
 });
 $('runTool').addEventListener('click',doTool);
 $('clearTool').addEventListener('click',clearLocal);
 $('exportResult').addEventListener('click',()=>{if(lastResult)download(JSON.stringify(lastResult,null,2),'nathan-dehack-source-review.json')});
 $('exportCatalog').addEventListener('click',()=>download(JSON.stringify({
  schema:'nathan-ai.dehack-deliver.export.v1',originalSourceSha256:sourceDigest,authorHeadingToolCount:101,
  countFromOriginalAZ:104,items},null,2),'nathan-dehack-104-tools.json'));
 $('exportSource').addEventListener('click',()=>{if(sourceFile)download(sourceFile,'Nathan-AI-Original-Pasted-text.txt','text/plain')});
 renderFilters();renderDirectory();select('evidence','MIDA / REALITIST Evidence Review',
  'Keep a claim, source reference and interpretation distinct until checked.');
}
try{wire()}catch(e){setStatus('sourceStatus','Could not initialize source directory: '+e.message)}
})();
