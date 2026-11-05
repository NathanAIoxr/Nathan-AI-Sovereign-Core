/* No analytics, remote requests, third-party dependencies, or transmission of the private ledger. */
(function(){
 'use strict';
 const C=window.ChronicleCore,KEY='nathan-101-chronicle-v1',NOTES='nathan-101-notes-v1';
 const $=s=>document.querySelector(s);
 const el=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;};
 const safeLoad=(key,fallback)=>{try{const v=localStorage.getItem(key);return v?JSON.parse(v):fallback;}catch{return fallback;}};
 let stored=safeLoad(KEY,null);
 let entries;
 try{entries=C.validateEntries(stored);}catch{entries=C.placeholderLedger();}
 let notes=safeLoad(NOTES,{});if(!notes||typeof notes!=='object'||Array.isArray(notes))notes={};
 let originalSource=null; // Session-only original text, not silently uploaded or copied into a second storage key.
 let question=null, game={index:0,score:0,streak:0,answered:0,locked:false,seen:new Set()};
 function hasSource(){return entries.length===101&&entries.every(e=>e.text&&e.text.trim());}
 function persist(){try{localStorage.setItem(KEY,JSON.stringify(entries));return true;}catch{return false;}}
 function persistNotes(){try{localStorage.setItem(NOTES,JSON.stringify(notes));return true;}catch{return false;}}
 function toast(message){$('#importStatus').textContent=message;}
 function updateStatus(){const yes=hasSource();$('#sourceStatus').textContent=yes?'Source loaded locally · 101 / 101':'Public shell · no private source loaded';$('#sourceStatus').style.color=yes?'var(--teal)':'var(--muted)';}
 function selectTab(name){
   document.querySelectorAll('[data-tab]').forEach(b=>{const active=b.dataset.tab===name;b.classList.toggle('selected',active);if(active)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');});
   document.querySelectorAll('.view').forEach(v=>v.hidden=v.id!=='view-'+name);
   if(name==='books')renderBooks();if(name==='ledger')renderLedger();if(name==='game'&&!question)nextQuestion();
 }
 function noteFor(n){return notes[n]||{reviewed:false,note:''};}
 function renderLedger(){
   const search=$('#search').value.trim().toLocaleLowerCase(),filter=$('#sectionFilter').value,reviewedOnly=$('#onlyReviewed').checked;
   const results=entries.filter(e=>(filter==='all'||e.section===filter)&&(!reviewedOnly||noteFor(e.number).reviewed)&&(!search||String(e.number).includes(search)||e.text.toLocaleLowerCase().includes(search)||C.sectionOf(e.number).title.toLocaleLowerCase().includes(search)));
   $('#ledgerCount').textContent=results.length+' / 101 entries';const cards=$('#cards');cards.replaceChildren();
   if(!hasSource()){
     const intro=el('div','panel');intro.append(el('h3',null,'Original text is stored outside the public repository'),el('p',null,'The 101 numbered positions are ready. Import the original .txt file in Source & Methods to populate every entry without altering its language.'));
     const btn=el('button','primary','Import source');btn.addEventListener('click',()=>selectTab('source'));intro.append(btn);cards.append(intro);
   }
   if(!results.length){cards.append(el('p','muted','No matches. Clear filters to see more entries.'));return;}
   const fragment=document.createDocumentFragment();
   results.forEach(entry=>{
     const section=C.sectionOf(entry.number),note=noteFor(entry.number);
     const card=el('article','action-card');card.append(el('div','number',String(entry.number).padStart(3,'0')));
     const body=el('div');body.append(el('div','mini','VOLUME '+section.id+' · ACTION '+entry.number),el('h3',null,entry.text||'Original action text not loaded on this device.'));
     const actions=el('div','actions-row'),reviewBtn=el('button','review'+(note.reviewed?' on':''),note.reviewed?'✓ Reviewed':'○ Mark reviewed');reviewBtn.type='button';reviewBtn.addEventListener('click',()=>{const current=noteFor(entry.number);notes[entry.number]={...current,reviewed:!current.reviewed};persistNotes();renderLedger();});
     const showNote=el('button','note-button',note.note?'Edit private note':'Add private note');showNote.type='button';
     const edit=el('div','note-area'),input=el('textarea');input.setAttribute('aria-label','Private note for action '+entry.number);input.placeholder='Evidence links, dates, interpretation, or questions (stored separately)…';input.value=note.note||'';input.addEventListener('input',()=>{const current=noteFor(entry.number);notes[entry.number]={...current,note:input.value};persistNotes();showNote.textContent=input.value?'Edit private note':'Add private note';});edit.append(input,el('small',null,'Note is distinct from the original action text.'));
     showNote.addEventListener('click',()=>{const open=edit.classList.toggle('open');showNote.setAttribute('aria-expanded',String(open));if(open)input.focus();});showNote.setAttribute('aria-expanded','false');
     actions.append(reviewBtn,showNote);body.append(actions,edit);card.append(body);fragment.append(card);
   });cards.append(fragment);
 }
 function gamePick(){
   const unseen=entries.filter(e=>!game.seen.has(e.number));if(!unseen.length)return null;
   const pick=unseen[Math.floor(Math.random()*unseen.length)];game.seen.add(pick.number);
   return {number:pick.number,clue:pick.text||'Gate '+String(pick.number).padStart(3,'0')+' — choose its original volume.',correct:C.sectionOf(pick.number).id,sectionTitle:C.sectionOf(pick.number).title};
 }
 function nextQuestion(){
   game.locked=false;question=gamePick();$('#answers').replaceChildren();$('#gameFeedback').textContent='';$('#nextGate').disabled=true;
   if(!question){$('#gateNumber').textContent='COMPLETE — 101 GATES';$('#gameClue').textContent='All 101 gates completed. Final score: '+game.score+' / 101. Restart for another run.';$('#nextGate').disabled=true;updateGameStats();return;}
   $('#gateNumber').textContent='GATE '+String(game.seen.size).padStart(3,'0')+' / 101';$('#gameClue').textContent=question.clue;
   C.SECTIONS.forEach(s=>{
     const button=el('button',null,'Volume '+s.id+' · '+s.title);button.type='button';button.dataset.answer=s.id;button.addEventListener('click',()=>answer(s.id));$('#answers').append(button);
   });updateGameStats();
 }
 function updateGameStats(){$('#gameScore').textContent=game.score;$('#gameStreak').textContent=game.streak;$('#gameAnswered').textContent=game.answered;$('#gameProgress').style.width=((game.answered/101)*100)+'%';}
 function answer(id){
   if(game.locked||!question)return;game.locked=true;game.answered++;
   const correct=id===question.correct;if(correct){game.score++;game.streak++;}else game.streak=0;
   document.querySelectorAll('#answers button').forEach(b=>{b.disabled=true;b.classList.toggle('correct',b.dataset.answer===question.correct);b.classList.toggle('wrong',b.dataset.answer===id&&!correct);});
   $('#gameFeedback').textContent=correct?'BUILD · Correct. This action belongs to Volume '+question.correct+'.':'CLEAR · This entry belongs to Volume '+question.correct+': '+question.sectionTitle+'.';
   $('#nextGate').disabled=game.answered>=101;updateGameStats();
 }
 function resetGame(){game={index:0,score:0,streak:0,answered:0,locked:false,seen:new Set()};question=null;nextQuestion();}
 function renderBooks(){
   const grid=$('#bookGrid');grid.replaceChildren();C.SECTIONS.forEach(s=>{
     const card=el('article','book'),cover=el('div','book-cover');cover.append(el('div','eyebrow','THE 101-ACTION CHRONICLE'),el('div','roman',s.id),el('h3',null,s.title));
     const content=el('div','book-content');content.append(el('p',null,'Source chapters '+s.from+'–'+s.to+' · '+(s.to-s.from+1)+' original actions.'),el('p',null,s.subtitle+'.'));
     const button=el('button','primary',hasSource()?'Export full volume (.md)':'Import source to export');button.type='button';button.addEventListener('click',()=>{if(!hasSource()){selectTab('source');return;}const md=C.bookText(s,entries);download('volume-'+s.id.toLowerCase()+'-'+C.cleanFilename(s.title)+'.md',md,'text/markdown');});content.append(button);
     card.append(cover,content);grid.append(card);
   });
 }
 function download(filename,text,type){const blob=new Blob([text],{type:type+';charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=filename;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),3000);}
 function importText(text){
   const parsed=C.parseLedger(text);entries=parsed;originalSource=text;
   $('#exportOriginal').disabled=false;
   const saved=persist();updateStatus();renderLedger();renderBooks();resetGame();
   toast(saved?'Imported all 101 entries locally. No server received the source.':'Imported in memory, but local storage was unavailable. Export a copy before closing the page.');
 }
 document.querySelectorAll('[data-tab]').forEach(b=>b.addEventListener('click',()=>selectTab(b.dataset.tab)));
 $('#search').addEventListener('input',renderLedger);$('#sectionFilter').addEventListener('change',renderLedger);$('#onlyReviewed').addEventListener('change',renderLedger);
 $('#sourceFile').addEventListener('change',async event=>{const file=event.target.files?.[0];if(!file)return;try{importText(await file.text());}catch(err){toast('Import not completed: '+err.message);}event.target.value='';});
 $('#exportJSON').addEventListener('click',()=>download('nathan-101-ledger-local.json',JSON.stringify({notice:'Author-supplied source, not independently verified.',entries},null,2),'application/json'));
 $('#exportNotes').addEventListener('click',()=>download('nathan-101-research-notes-local.json',JSON.stringify({notice:'Separate notes; original source text unchanged.',notes},null,2),'application/json'));
 $('#clearLocal').addEventListener('click',()=>{if(!window.confirm('Remove imported source text and private research notes from this browser?'))return;localStorage.removeItem(KEY);localStorage.removeItem(NOTES);entries=C.placeholderLedger();notes={};updateStatus();renderLedger();renderBooks();resetGame();toast('Local source and notes cleared from this browser.');});
 $('#nextGate').addEventListener('click',nextQuestion);$('#resetGame').addEventListener('click',resetGame);
 updateStatus();renderLedger();renderBooks();resetGame();
})();
