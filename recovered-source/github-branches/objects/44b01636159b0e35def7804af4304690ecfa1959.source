(function(){
'use strict';
const C=window.NathanSourceStudioCore;
const panel=document.getElementById('studio-panel');
if(!C||!panel)return;
const output=document.getElementById('studio-output');
const status=document.getElementById('studio-status');
const state={view:'app',messages:null,baseMessages:null,archiveGranted:false,gameSelections:new Map(),notes:Object.create(null),stepDone:new Set()};
function el(tag,text,className){
 const node=document.createElement(tag);
 if(text!==undefined)node.textContent=String(text);
 if(className)node.className=className;
 return node;
}
function link(label,href){const a=el('a',label);a.href=href;return a;}
function clear(){output.replaceChildren();}
function message(text){status.textContent=text;}
function p(text,cls){output.append(el('p',text,cls));}
function heading(text){output.append(el('h3',text));}
function button(label,onClick,className){
 const b=el('button',label,className||'');b.type='button';b.addEventListener('click',onClick);return b;
}
function setView(view){
 if(!['app','game','book','learn','archive'].includes(view))return;
 state.view=view;
 for(const b of panel.querySelectorAll('[data-studio-view]'))b.setAttribute('aria-pressed',String(b.dataset.studioView===view));
 render();
}
function sendToChat(question){
 const textarea=document.getElementById('message');
 const form=document.getElementById('chat-form');
 if(!textarea||!form)return message('The main chatbox is not ready.');
 if(String(question).length>4000)return message('The full prompt exceeds the chat input limit. It was NOT shortened or submitted; export the full draft instead.');
 textarea.value=String(question);
 textarea.dispatchEvent(new Event('input',{bubbles:true}));
 form.requestSubmit();
 message('Prompt routed to the local Nathan AI chatbox. This is not a remote research request.');
}
function renderApp(){
 heading('APP · Source → Index → Relate → Derive');
 p('One creator workspace connects the verified-source archive to a playable research game, a seven-book outline builder, and five lessons. These are current local browser prototypes, not a finished publishing platform.','studio-note');
 const steps=[
  ['source','Preserve the author statements','Keep original_text and sequence unchanged.'],
  ['index','Build a separate index','Categorize themes without rewriting source wording.'],
  ['game','Play evidence choices','Distinguish reported speech, source text and findings.'],
  ['book','Draft a series','Write seven theme-led volumes as original adaptations.'],
  ['learn','Teach the method','Practice source integrity, accountability and privacy.']
 ];
 const list=el('div',undefined,'studio-steps');
 for(const [key,title,detail] of steps){
  const box=el('div',undefined,'studio-step');
  const check=el('input');check.type='checkbox';check.checked=state.stepDone.has(key);
  check.setAttribute('aria-label','Mark step complete: '+title);
  check.addEventListener('change',()=>{if(check.checked)state.stepDone.add(key);else state.stepDone.delete(key);message(state.stepDone.size+' of '+steps.length+' design checklist steps marked locally.');});
  const label=el('label');label.append(check,el('span',title));
  box.append(label,el('p',detail));
  list.append(box);
 }
 output.append(list);
 const actions=el('div',undefined,'studio-actions');
 actions.append(button('Play the game',()=>setView('game')),button('Build the book series',()=>setView('book')),button('Open lessons',()=>setView('learn')),button('View adult sources',()=>setView('archive')));
 output.append(actions);
 const src=el('p',undefined,'studio-note');
 src.append('Source ledger: ',link('Originals',C.ARCHIVE_PATH+'messages.json'),' · ',link('Index',C.ARCHIVE_PATH+'index.json'),' · ',link('Archive rules',C.ARCHIVE_PATH+'README.md'));
 output.append(src);
 message('App design checklist is local to this tab. Source text remains unchanged.');
}
function renderGame(){
 heading('GAME · Full Evidence Quest');
 p('All six evidence challenges are visible together. Each decision earns one point when correct. There are no combat or retaliation mechanics.','studio-note');
 const answered=state.gameSelections.size;
 const score=[...state.gameSelections.values()].filter(x=>x.correct).length;
 p('Answered '+answered+' of '+C.GAME_ROUNDS.length+' · Score '+score,'studio-score');
 const board=el('div',undefined,'studio-steps');
 for(const [i,round] of C.GAME_ROUNDS.entries()){
  const box=el('section',undefined,'studio-step');
  box.append(el('h4','Round '+(i+1)+' · '+round.question));
  const response=state.gameSelections.get(round.id);
  const options=el('div',undefined,'studio-choices');
  round.options.forEach((option,index)=>{
   const b=button(option,()=>{
    if(state.gameSelections.has(round.id))return;
    state.gameSelections.set(round.id,C.scoreAnswer(round.id,index));
    render();
   });
   b.disabled=Boolean(response);options.append(b);
  });
  box.append(options);
  if(response)box.append(el('p',(response.correct?'Correct. ':'Not quite. Correct choice: '+response.correctOption+'. ')+response.explanation,'studio-result'));
  board.append(box);
 }
 output.append(board);
 output.append(button('Reset all six game responses',()=>{
  state.gameSelections.clear();render();
 }));
 message('All six questions are displayed; '+answered+' decisions recorded in this tab.');
}
function saveDownload(text,filename,type){
 const href=URL.createObjectURL(new Blob([text],{type:type||'text/plain;charset=utf-8'}));
 const a=el('a');a.href=href;a.download=filename;document.body.append(a);a.click();a.remove();
 setTimeout(()=>URL.revokeObjectURL(href),1500);
}
function renderBook(){
 heading('BOOK SERIES · All Seven Volumes');
 p('All seven source-linked editorial volume plans are shown in full. None of these chapters is asserted to be a completed manuscript, verbatim source, or verified historical biography.','studio-note');
 const actions=el('div',undefined,'studio-actions');
 actions.append(button('Export all seven volumes (.md)',()=>{
  try{saveDownload(C.seriesMarkdown(state.notes),'nathan-ai-all-seven-book-plans.md','text/markdown;charset=utf-8');message('All seven complete plans exported, including every saved note.');}
  catch(err){message(err.message);}
 }));
 actions.append(button('Export all draft notes (.json)',()=>{
  saveDownload(JSON.stringify({schema:'nathan.words-worlds.book-notes.v1',volume_notes:C.VOLUMES.map(v=>({id:v.id,notes:state.notes[v.id]||''}))},null,2)+'\n','nathan-ai-book-notes.json','application/json');
  message('All current in-tab draft notes exported. No notes were abbreviated.');
 }));
 output.append(actions);
 for(const [i,v] of C.VOLUMES.entries()){
  const box=el('section',undefined,'studio-volume');
  box.append(el('h4',(i+1)+'. '+v.title));
  box.append(el('p','Theme: '+v.theme,'studio-note'));
  const list=el('ol');v.chapters.forEach(ch=>list.append(el('li',ch)));box.append(list);
  box.append(el('p','Source IDs: '+v.sourceIds.join(' · '),'studio-note'));
  const id='studio-draft-'+v.id;
  const label=el('label','Author draft notes for '+v.title+':');label.setAttribute('for',id);box.append(label);
  const ta=el('textarea');ta.id=id;ta.rows=5;ta.value=state.notes[v.id]||'';
  ta.placeholder='Write your own draft here; no original quote is edited.';
  ta.addEventListener('input',()=>{state.notes[v.id]=ta.value;});
  box.append(ta);
  box.append(button('Export this complete volume (.md)',()=>{
   try{saveDownload(C.bookMarkdown(v.id,ta.value),'nathan-ai-'+v.id+'-book-plan.md','text/markdown;charset=utf-8');message('Exported '+v.title+' without abbreviating draft notes.');}
   catch(err){message(err.message);}
  }));
  box.append(button('Discuss this volume in chat',()=>sendToChat('Words → Worlds: Develop the original educational chapter plan for '+v.title+'. Theme: '+v.theme+'. Proposed chapters: '+v.chapters.join(' / ')+'. Attribute sources; do not fabricate historical statements.')));
  output.append(box);
 }
 message('All seven volume outlines and all seven note editors are visible. Draft notes stay in-tab until exported.');
}
function renderLearn(){
 heading('EDUCATIONAL TOOL · All Five Lessons');
 p('Every lesson, prompt, explanation, answer and source link is visible together. This is editorial education, separate from adult original quotes.','studio-note');
 C.LESSONS.forEach((lesson,i)=>{
  const box=el('section',undefined,'studio-volume');
  box.append(el('h4',(i+1)+'. '+lesson.title));
  box.append(el('p',lesson.prompt,'studio-question'));
  box.append(el('p',lesson.body));
  box.append(el('p','Practice: '+lesson.exercise));
  box.append(el('p','Suggested answer: '+lesson.answer,'studio-result'));
  box.append(el('p','Source IDs: '+lesson.sourceIds.join(' · '),'studio-note'));
  box.append(button('Explore this lesson in chat',()=>sendToChat('Source Academy: Explain '+lesson.title+' using a short exercise. Distinguish original records from editor conclusions and never invent facts.')));
  output.append(box);
 });
 message('All five lessons are visible without hidden answers or collapsed panels.');
}
async function loadArchive(){
 if(!state.archiveGranted){
  if(!confirm('This source archive contains adult language, a slur and violent threats as attributed evidence. Display ALL original text in this tab?'))return message('Adult-source access cancelled.');
  state.archiveGranted=true;
 }
 try{
  message('Reading full original sources...');
  const response=await fetch(C.ARCHIVE_PATH+'messages.json',{cache:'no-store'});
  if(!response.ok)throw Error('HTTP '+response.status);
  const payload=await response.json();
  C.assertArchive(payload.messages);
  state.baseMessages=C.appendSourcesWithoutCollapse([],payload.messages);
  state.messages=C.appendSourcesWithoutCollapse([],state.baseMessages);
  render();
 }catch(err){state.messages=null;message('Source unavailable: '+err.message);}
}
async function importMoreSources(event){
 const file=event.target.files&&event.target.files[0];event.target.value='';
 if(!file)return;
 try{
  if(file.size>8000000)throw Error('File is over 8MB. It was not partially imported; split and retry.');
  const data=JSON.parse(await file.text());
  const rows=Array.isArray(data)?data:data.messages;
  if(!Array.isArray(rows))throw Error('Import requires a JSON array or a JSON object with messages array.');
  if(!state.messages)throw Error('First load the original archive.');
  const next=C.appendSourcesWithoutCollapse(state.messages,rows);
  state.messages=next;
  render();
  message('Imported ALL '+rows.length+' additional source records locally. No repeated text collapsed or records overwritten.');
 }catch(err){message('Import rejected without changing records: '+err.message);}
}
function renderArchive(){
 heading('FULL ORIGINALS · Unboxed Source Ledger');
 p('Every source record is displayed in source order with full wording and separate IDs. Identical messages stay separate. Adult content requires an explicit review step.','studio-note');
 const row=el('p');row.append(link('Open full archive',C.ARCHIVE_PATH+'index.html'),' · ',link('Preservation rules',C.ARCHIVE_PATH+'README.md'));
 output.append(row);
 if(!state.messages){
  output.append(button('Show every original record (adult source)',loadArchive));
  message('Full originals are not loaded in the chatbox.');
  return;
 }
 const census=C.sourceCensus(state.messages);
 p(census.records+' records · '+census.characters+' source characters · '+census.uniqueIds+' unique IDs · '+census.repeatedWordings+' repeated wordings. None merged.','studio-score');
 const actions=el('div',undefined,'studio-actions');
 const label=el('label','Add more source records from a local JSON file (no upload to a server):');
 const file=el('input');file.type='file';file.accept='.json,application/json';
 file.setAttribute('aria-label','Import additional verbatim source records');
 file.addEventListener('change',importMoreSources);
 actions.append(button('Export ALL original source records (.json)',()=>{
  try{saveDownload(C.originalsExport(state.messages),'nathan-ai-full-local-source-ledger.json','application/json');message('Exported all '+state.messages.length+' records. No source text dropped.');}
  catch(err){message(err.message);}
 }));
 actions.append(button('Show ALL records',()=>{const search=document.getElementById('studio-source-search');if(search){search.value='';search.dispatchEvent(new Event('input'));}}));
 output.append(actions,label,file);
 const input=el('input');input.id='studio-source-search';input.type='search';input.placeholder='Optional filter; all records shown initially';input.setAttribute('aria-label','Filter full original records');
 const summary=el('p',undefined,'studio-note'),results=el('div',undefined,'studio-full-sources');
 const draw=()=>{
  results.replaceChildren();
  const query=input.value.normalize('NFKC').toLowerCase().trim();
  const rows=state.messages.filter(m=>(m.original_text+' '+m.id).normalize('NFKC').toLowerCase().includes(query));
  summary.textContent=(query?'Filtered view: ':'All records: ')+rows.length+' of '+state.messages.length+' visible. Filtering does not delete or rewrite originals.';
  rows.forEach((m,i)=>{
   const article=el('article',undefined,'studio-source-record');
   article.append(el('h4','Source '+m.sequence+' · '+m.id));
   article.append(el('p',String(m.source||'Locally imported owner record')+' · Display order '+(state.messages.indexOf(m)+1),'studio-note'));
   article.append(el('pre',m.original_text,'studio-original'));
   article.append(button('Copy complete rendered record',()=>{
    if(!navigator.clipboard?.writeText)return message('Browser clipboard unavailable.');
    navigator.clipboard.writeText(m.original_text).then(()=>message('Copied complete source text.')).catch(()=>message('Clipboard denied.'));
   }));
   results.append(article);
  });
  if(!rows.length)results.append(el('p','No matching records; use Show ALL records to clear the filter.'));
 };
 input.addEventListener('input',draw);output.append(input,summary,results);draw();
 output.append(button('Hide adult records from this tab',()=>{state.archiveGranted=false;state.messages=null;state.baseMessages=null;render();}));
 message('Original records displayed in full. Import/export do not change stored primary sources.');
}
function render(){
 clear();
 if(state.view==='app')renderApp();
 else if(state.view==='game')renderGame();
 else if(state.view==='book')renderBook();
 else if(state.view==='learn')renderLearn();
 else renderArchive();
}
panel.querySelectorAll('[data-studio-view]').forEach(b=>b.addEventListener('click',()=>setView(b.dataset.studioView)));
function hashOpen(){
 if(location.hash!=='#studio-panel')return;
 const tool=document.querySelector('[data-tool="studio"]');
 if(tool)tool.click();
 panel.scrollIntoView({block:'nearest'});
}
window.addEventListener('hashchange',hashOpen);
render();
hashOpen();
})();
