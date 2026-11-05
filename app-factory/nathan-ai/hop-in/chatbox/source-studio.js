(function(){
'use strict';
const C=window.NathanSourceStudioCore;
const panel=document.getElementById('studio-panel');
if(!C||!panel)return;
const output=document.getElementById('studio-output');
const status=document.getElementById('studio-status');
const state={view:'app',messages:null,archiveGranted:false,gameIndex:0,gameScore:0,gameResponse:null,volume:C.VOLUMES[0].id,lesson:C.LESSONS[0].id,notes:Object.create(null),lessonRevealed:false,stepDone:new Set()};
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
 textarea.value=String(question).slice(0,4000);
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
 const total=C.GAME_ROUNDS.length,r=C.GAME_ROUNDS[state.gameIndex];
 heading('GAME · Evidence Quest');
 p('Choose your answer. Gain one point for each correct source-integrity decision. This game has no combat, retaliation mechanics or real-world targets.','studio-note');
 if(!r){
  p('Completed: '+state.gameScore+' / '+total+' evidence choices.','studio-result');
  output.append(button('Restart game',()=>{state.gameIndex=0;state.gameScore=0;state.gameResponse=null;render();}));
  message('Finished the evidence quest.');
  return;
 }
 p('Round '+(state.gameIndex+1)+' of '+total+' · Score '+state.gameScore,'studio-score');
 p(r.question,'studio-question');
 const choices=el('div',undefined,'studio-choices');
 r.options.forEach((option,index)=>{
  const b=button(option,()=>{
   if(state.gameResponse!==null)return;
   state.gameResponse=C.scoreAnswer(r.id,index);
   if(state.gameResponse.correct)state.gameScore++;
   render();
  });
  b.disabled=state.gameResponse!==null;
  choices.append(b);
 });
 output.append(choices);
 if(state.gameResponse!==null){
  p(state.gameResponse.correct?'Correct.':'The supported answer is: '+state.gameResponse.correctOption+'.','studio-result');
  p(state.gameResponse.explanation,'studio-note');
  output.append(button(state.gameIndex===total-1?'Finish quest':'Next evidence gate',()=>{
   state.gameIndex++;state.gameResponse=null;render();
  }));
 }
 message('Evidence Quest works locally and does not submit scores to a server.');
}
function renderBook(){
 heading('BOOK SERIES · Seven-volume editor');
 p('Editorial book plans based on preserved themes. They are not original quotations, completed manuscripts, biographies of David, or verified reports of historical events.','studio-note');
 const picker=el('select');picker.setAttribute('aria-label','Choose book volume');
 for(const v of C.VOLUMES){const o=el('option',v.title);o.value=v.id;o.selected=v.id===state.volume;picker.append(o);}
 picker.addEventListener('change',()=>{state.volume=picker.value;render();});
 output.append(picker);
 const v=C.bookById(state.volume);
 p('Theme: '+v.theme);
 const list=el('ol');
 v.chapters.forEach(ch=>list.append(el('li',ch)));
 output.append(list);
 p('Linked primary-source record IDs: '+v.sourceIds.join(' · '),'studio-note');
 const label=el('label','Write new material for this book (stored in this tab only):');
 label.setAttribute('for','studio-draft');output.append(label);
 const ta=el('textarea');ta.id='studio-draft';ta.rows=6;ta.maxLength=10000;ta.value=state.notes[v.id]||'';ta.placeholder='Your own chapter notes or ideas. Original source records are separate.';
 ta.addEventListener('input',()=>{state.notes[v.id]=ta.value;});
 output.append(ta);
 const actions=el('div',undefined,'studio-actions');
 actions.append(button('Export this book plan (.md)',()=>{
  try{
   const text=C.bookMarkdown(v.id,ta.value);
   const href=URL.createObjectURL(new Blob([text],{type:'text/markdown;charset=utf-8'}));
   const a=el('a');a.href=href;a.download='nathan-ai-'+v.id+'-book-plan.md';document.body.append(a);a.click();a.remove();
   setTimeout(()=>URL.revokeObjectURL(href),1500);
   message('This editorial volume plan was exported to your device. No source messages were modified.');
  }catch(err){message(err.message);}
 }));
 actions.append(button('Discuss this chapter in chat',()=>sendToChat('Words → Worlds BOOK SERIES: Help develop an original educational chapter plan for '+v.title+'. Theme: '+v.theme+'. Chapter ideas: '+v.chapters.join(' / ')+'. These are creative adaptations, not verbatim source or verified biography.')));
 output.append(actions);
 message('Seven volumes available. Notes remain in this tab unless you export.');
}
function renderLearn(){
 heading('EDUCATIONAL TOOL · Source Academy');
 const picker=el('select');picker.setAttribute('aria-label','Choose lesson');
 C.LESSONS.forEach(x=>{const option=el('option',x.title);option.value=x.id;option.selected=x.id===state.lesson;picker.append(option);});
 picker.addEventListener('change',()=>{state.lesson=picker.value;state.lessonRevealed=false;render();});
 output.append(picker);
 const lesson=C.LESSONS.find(x=>x.id===state.lesson);
 p(lesson.prompt,'studio-question');p(lesson.body);
 p('Practice: '+lesson.exercise);
 if(state.lessonRevealed)p('Suggested answer: '+lesson.answer,'studio-result');
 else output.append(button('Reveal learning answer',()=>{state.lessonRevealed=true;render();}));
 p('Links to source IDs: '+lesson.sourceIds.join(', '),'studio-note');
 output.append(button('Ask the local chatbox about this lesson',()=>sendToChat('Source Academy: Explain '+lesson.title+' with a short activity. Keep original records distinct from interpretations; do not fabricate quotes or historical evidence.')));
 message('Lesson content is an editorial educational adaptation. Adult original excerpts are hidden here.');
}
async function loadArchive(){
 if(!state.archiveGranted){
  if(!confirm('This archive contains adult language, a slur and violent threats quoted as source evidence. Show the original wording in this tab?'))return message('Adult source access cancelled.');
  state.archiveGranted=true;
 }
 try{
  message('Loading original source records from this repository...');
  const response=await fetch(C.ARCHIVE_PATH+'messages.json',{cache:'no-store'});
  if(!response.ok)throw Error('HTTP '+response.status);
  const payload=await response.json();
  C.assertArchive(payload.messages);
  state.messages=payload.messages;
  render();
 }catch(err){state.messages=null;message('Source unavailable: '+err.message);}
}
function renderArchive(){
 heading('SOURCE READER · Adult originals');
 p('Only deliberate source review displays the full original text. This viewer reads the existing unchanged author records; all game/book/lesson prose is separately authored.','studio-note');
 const row=el('p');
 row.append(link('Original archive in new page',C.ARCHIVE_PATH+'index.html'),' · ',link('Preservation README',C.ARCHIVE_PATH+'README.md'));
 output.append(row);
 if(!state.messages){
  output.append(button('Review full original source (adult)',loadArchive));
  message('Adult originals not loaded in this chatbox.');
  return;
 }
 const input=el('input');input.type='search';input.placeholder='Search original wording';input.setAttribute('aria-label','Search original words');
 const results=el('div');
 function draw(){
  results.replaceChildren();const query=input.value.normalize('NFKC').toLowerCase().trim();
  const subset=state.messages.filter(x=>x.original_text.normalize('NFKC').toLowerCase().includes(query));
  for(const m of subset){
   const details=el('details');
   const summary=el('summary','Source '+m.sequence+' · '+m.id);
   const raw=el('pre',m.original_text,'studio-original');
   details.append(summary,raw);
   details.append(button('Copy this exact rendered source text',()=>{
    if(!navigator.clipboard?.writeText)return message('Browser clipboard API not available.');
    navigator.clipboard.writeText(m.original_text).then(()=>message('Copied original displayed words.')).catch(()=>message('Clipboard access denied.'));
   }));
   results.append(details);
  }
  if(!subset.length)results.append(el('p','No matching original records.'));
 }
 input.addEventListener('input',draw);
 output.append(input,results);draw();
 output.append(button('Hide adult source text',()=>{state.archiveGranted=false;state.messages=null;render();}));
 message('Four original author records loaded from the source file; no editorial rewrite performed.');
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
