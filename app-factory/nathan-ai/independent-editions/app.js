/* Nathan AI — independent original editions, browser-local user work.
 * This page does not send notes or original files to any model or server.
 */
(function(){'use strict';
const R=window.NathanIndependentRegistry,E=window.NathanIndependentEngine;
const $=id=>document.getElementById(id),item=(tag,value,cls)=>{
 const e=document.createElement(tag);if(value!==undefined)e.textContent=String(value);if(cls)e.className=cls;return e;
};
if(!R||!E){$('stage').textContent='Independent edition modules did not load.';return}
const script=new URL(document.currentScript.src),NATHAN_ROOT=new URL('../',script),EDITION_ROOT=new URL('./',script);
const id=document.body.dataset.editionId||'catalog',program=R.find(id),form=new URLSearchParams(location.search).get('form')||'app';
let session=program&&E.FORMS.includes(form)?E.newSession(program,form):null;
let bytes=null,originalName=null;
const main=$('stage');
function link(name,url,cls){const a=item('a',name,cls);a.href=url;return a}
function button(label,action,cls){const b=item('button',label,cls);b.type='button';b.addEventListener('click',action);return b}
function paragraph(root,content,cls){const p=item('p',content,cls);root.append(p);return p}
function part(title){const section=item('section',undefined,'panel');section.append(item('h2',title));main.append(section);return section}
function division(root){const d=item('div',undefined,'nav');root.append(d);return d}
function actionLink(root,label,url){root.append(link(label,url))}
function safeName(s){return String(s).replace(/[^A-Za-z0-9._-]/g,'-').slice(0,80)}
function hrefFor(p,f){return new URL(p.id+'/index.html?form='+encodeURIComponent(f),EDITION_ROOT).href}
function home(){location.assign(EDITION_ROOT.href)}
function download(name,data,type){const url=URL.createObjectURL(new Blob([data],{type})),a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000)}
function report(msg){$('notice').textContent=msg}
function downloadSession(){try{E.validateSession(session,program);download('nathan-ai-'+program.id+'-'+form+'-working-copy.json',JSON.stringify(session,null,2),'application/json');report('Private working copy exported by your action. Original source files were not changed.')}catch(e){report(e.message)}}
function openChat(){
 try{
  const packet=E.handoff(program,form);
  sessionStorage.setItem(E.BRIDGE,JSON.stringify(packet));
  location.assign(new URL('hop-in/chatbox/',NATHAN_ROOT).href);
 }catch(e){report('Browser storage unavailable; open the Chatbox using the link and enter the original program title. '+e.message)}
}
function header(){
 const hero=$('hero');hero.replaceChildren();
 hero.append(item('p','NATHAN AI 🚀 · CREATE ONCE. TRANSFORM INTO EVERYTHING. PRESERVE THE ORIGINAL.','eyebrow'));
 hero.append(item('h1',program?program.title:'ORIGINALS · INDEPENDENT EDITIONS'));
 paragraph(hero,program?program.scope:'Each original program keeps its own identity. Launch its separate app, game, book/reading workbook, and academy. Shared code is optional; your original source is never overwritten.','muted');
 const nav=division(hero);nav.append(link('All independent programs',EDITION_ROOT.href));
 nav.append(link('HOP IN · Interactive Chatbox',new URL('hop-in/chatbox/',NATHAN_ROOT).href));
 if(program){nav.append(link('Open the original working source',new URL(program.source,NATHAN_ROOT).href));}
}
function catalog(){
 $('edition').textContent='Stand-alone program library · 11 documented identities · 44 distinct edition views';
 const count=R.validate();const top=part('Keep every original separate');
 paragraph(top,'This index contains '+count.independentProgramIdentities+' independently named source families. The '+count.individualEditionRoutes+' App/Game/Book/Academy URLs are individual views; they are not '+count.individualEditionRoutes+' completed original executable programs.');
 paragraph(top,'Original source remains at its existing address. New educational material and imported owner files are never silently promoted to original manuscripts or published to GitHub.','muted');
 const grid=item('div',undefined,'grid');main.append(grid);
 for(const p of R.PROGRAMS){
  const tile=item('article',undefined,'tile');tile.append(item('p',p.kind.replace(/-/g,' ').toUpperCase(),'eyebrow'));
  tile.append(item('h2',p.title));tile.append(item('span',p.stage,'tag'));paragraph(tile,p.scope,'small muted');
  const nav=division(tile);nav.append(link('Open original',new URL(p.source,NATHAN_ROOT).href));
  for(const f of E.FORMS)nav.append(link(f==='academy'?'Academy':f[0].toUpperCase()+f.slice(1),hrefFor(p,f)));
  grid.append(tile);
 }
 const end=part('Preservation rule');
 paragraph(end,'Each original keeps its title and source route. Adaptations have explicit edition labels. Import your own original files locally; export their exact bytes separately from editorial notes, games and derived books.');
 paragraph(end,'No automatic restoration of historical executable code, private archives or unfinished book series is claimed. Source names are not proof of software completion.','muted');
}
function originalPane(root){
 const box=item('section',undefined,'panel');box.append(item('h2','Original words · source-preserving local import'));
 paragraph(box,'Existing recorded heading: '+program.sourceTitle);
 if(program.authorQuote){const quote=item('blockquote',program.authorQuote,'quote');box.append(quote)}
 paragraph(box,'Source path: '+program.source+' · Status: '+program.stage,'small muted');
 paragraph(box,'Import a UTF-8 text file you own, up to 1 MiB. Imported bytes remain in browser memory and may be exported unchanged. Nothing uploads automatically.','muted');
 const picker=item('input');picker.type='file';picker.accept='.txt,.md,.json,.js,.py,.html,.xml,.csv,text/plain,application/json';
 picker.setAttribute('aria-label','Choose the original text file to preserve locally');
 picker.addEventListener('change',async()=>{
  const f=picker.files&&picker.files[0];if(!f)return;
  if(f.size>1048576){report('The owner source exceeds the 1 MiB import limit.');return}
  try{
   const data=new Uint8Array(await f.arrayBuffer());
   const decoded=new TextDecoder('utf-8',{fatal:true}).decode(data);
   const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',data))).map(x=>x.toString(16).padStart(2,'0')).join('');
   session=E.attachOriginal(session,program,{name:f.name,text:decoded,sha256:hash,bytes:data.byteLength});
   bytes=data;originalName=f.name;render();
   report('Source imported in browser memory; SHA-256 recorded. No public upload, rewrite or model request.');
  }catch(e){report('Original not imported: '+e.message)}
 });
 box.append(picker);
 const summary=paragraph(box,session.original.fileName?
  'Owner original: '+session.original.fileName+' · '+session.original.bytes+' bytes · SHA-256 '+session.original.sha256:
  'No private original imported; the registered heading and source route remain available.','small');
 if(session.original.text!==null){
  const preview=item('pre',session.original.text.slice(0,16000),'reading');preview.setAttribute('aria-label','Unchanged imported original text preview');box.append(preview);
  if(session.original.text.length>16000)paragraph(box,'Preview truncated; exported original bytes remain complete.','small muted');
  box.append(button('Export unchanged imported bytes',()=>{
   if(!bytes)return report('The original byte copy is no longer in memory. Reimport before exporting exact bytes.');
   download(originalName||session.original.fileName,bytes,'application/octet-stream');
  },'primary'));
 }
 root.append(box);
}
function process(root,educational){
 const section=item('section',undefined,'panel');
 section.append(item('h2',educational?'Independent academy · 3 lessons':'Original program process · review checklist'));
 paragraph(section,program.originalSteps?'Creator-preserved three-step sequence:':'Edition study steps: derived process summary, not an unverified verbatim author quote.','small muted');
 const steps=item('div',undefined,'steps');
 for(let i=0;i<program.work.length;i++){
  const wrap=item('div',undefined,'step'),label=item('label'),check=item('input');check.type='checkbox';check.checked=session.checked.includes(i);
  check.setAttribute('aria-label','Complete step '+(i+1));
  check.addEventListener('change',()=>{try{session=E.checkStep(session,program,i,check.checked);report('Only this local edition checklist changed.')}catch(e){report(e.message)}});
  label.append(check,item('span',(i+1)+'. '+program.work[i]));wrap.append(label);
  if(educational)paragraph(wrap,['Inspect the existing original source before moving forward.','Explain what is documented and what still requires independent testing.','Record your own learning and keep the original files untouched.'][i],'small muted');
  steps.append(wrap);
 }
 section.append(steps);root.append(section);
}
function notes(root){
 const section=item('section',undefined,'panel');section.append(item('h2','Derived notes · never overwrite the author original'));
 const field=item('textarea');field.value=session.derivedNotes;field.maxLength=30000;field.placeholder='Your independent notes, chapter ideas, source comparisons, activity plans or derived drafts…';
 field.setAttribute('aria-label','Derived notes, separate from original source');
 field.addEventListener('input',()=>{try{session=E.withNotes(session,program,field.value)}catch(e){report(e.message)}});
 section.append(field);
 const buttons=division(section);
 buttons.append(button('Export private edition JSON',downloadSession,'primary'));
 buttons.append(button('CLEAR only this edition draft',()=>{if(!confirm('Clear the current imported source, checklist and notes from this browser tab? Original files on your device are unaffected.'))return;session=E.newSession(program,form);bytes=null;originalName=null;render();report('Current local draft cleared. No original device files were deleted.')}));
 root.append(section);
}
function workbench(){
 const intro=part('Freestanding App · independent original source');
 paragraph(intro,'This local source and process workbench stands separately from the original application. Open the original executable at the recorded source link for its specialized capabilities.');
 const area=part('Original program functionality and boundary');
 paragraph(area,program.activity);
 paragraph(area,'Not established: '+program.overclaim,'small muted');
 originalPane(main);process(main,false);notes(main);
}
function gameplay(){
 const wrap=part('Free-standing educational game · 3 playable rounds');
 paragraph(wrap,'A newly authored educational adaptation about this exact original program. Game text is separate from Nathan Tabor’s source material.');
 const quiz=E.questions(program),g=E.grade(session,program),i=g.completed;
 paragraph(wrap,'Score: '+g.correct+' of '+g.completed+' · '+(i===3?'Completed':'Round '+(i+1)+' of 3'),'score');
 if(i<quiz.length){
  const q=quiz[i];wrap.append(item('h3',q.question));
  q.options.forEach((choice,index)=>{
   wrap.append(button(choice,()=>{try{session=E.answer(session,program,index);render();report('Answer recorded only in this game session.')}catch(e){report(e.message)}},'choice'));
  });
 }else{
  paragraph(wrap,'Final score: '+g.correct+' / '+g.total,'score');
  wrap.append(button('Play again',()=>{session=E.newSession(program,form);render();report('Game state cleared; the original app is unchanged.')} ,'primary'));
 }
 if(i>0){const previous=quiz[i-1],answer=session.answers[i-1],note=item('div',undefined,'answer');
  note.append(item('strong',answer===previous.answer?'Correct response':'Research this distinction'));
  paragraph(note,previous.explanation);
  wrap.append(note);
 }
 const source=part('Source and game are different records');paragraph(source,'The game is an educational derivative. It cannot certify antivirus quality, historical claims, file safety, authorship or finished programs.');
 const side=division(source);actionLink(side,'Open unchanged original',new URL(program.source,NATHAN_ROOT).href);
}
function book(){
 const top=part('Free-standing reading workbook · original + derived kept distinct');
 paragraph(top,'This is an independent reading/workbook edition linked to the original. It is not being represented as a previously finished author manuscript.');
 originalPane(main);
 const reading=part('Reading and book-series foundation');
 const md=E.bookMarkdown(program,session);
 reading.append(item('pre',md,'reading'));
 reading.append(button('Export book / workbook Markdown',()=>{
  download('nathan-ai-'+program.id+'-reading-workbook.md',E.bookMarkdown(program,session),'text/markdown;charset=utf-8');
  report('Derived Markdown exported. For byte-exact original preservation, export the original file separately.');
 },'primary'));
 process(main,true);notes(main);
}
function academy(){
 const top=part('Independent academy · source-led learning');
 paragraph(top,'Lesson 1: Identify the exact original. Lesson 2: Distinguish source evidence from claims. Lesson 3: Test a separate adaptation without replacing the original.');
 originalPane(main);process(main,true);
 const quiz=part('Knowledge check');
 const q=E.questions(program)[0];quiz.append(item('h3',q.question));
 const feedback=item('p','Choose one answer to inspect the explanation.','response');quiz.append(feedback);
 q.options.forEach((v,i)=>quiz.append(button(v,()=>{feedback.textContent=(i===q.answer?'Correct. ':'Review this further. ')+q.explanation},'choice')));
 notes(main);
}
function render(){
 header();main.replaceChildren();
 if(!program){catalog();return}
 if(!E.FORMS.includes(form)){paragraph(main,'Unknown edition form. Return to the index.');return}
 $('edition').textContent=form.toUpperCase()+' · Independent original identity · '+program.stage;
 const modeBar=division(main);
 for(const f of E.FORMS){const a=link(f==='academy'?'ACADEMY':f.toUpperCase(),hrefFor(program,f));if(f===form)a.setAttribute('aria-current','page');modeBar.append(a)}
 const safety=paragraph(main,'PRESERVE original. BUILD a separate edition. CLEAR only the local working copy. No source is silently overwritten, no private manuscript is published and no outside system is accessed.','warn');
 if(form==='app')workbench();
 if(form==='game')gameplay();
 if(form==='book')book();
 if(form==='academy')academy();
 const chat=part('Nathan AI Interactive Chatbox · contextual handoff');
 paragraph(chat,'Send only this original program’s public title, identity and edition mode into the HOP IN message draft. Your imported files and private notes are NOT sent. Review and press Send yourself.');
 chat.append(button('Continue this program in Nathan AI Interactive Chatbox',openChat,'primary'));
 const links=division(chat);links.append(link('Open original app',new URL(program.source,NATHAN_ROOT).href));links.append(link('Source-preservation rules',new URL('README.md',EDITION_ROOT).href));
}
render();
})();