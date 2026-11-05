/* Nathan AI Snow Family Field · browser view; text-only rendering */
(function(){
  'use strict';
  const api=window.NathanSnowField,d=api.data;
  const $=id=>document.getElementById(id);
  const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n};
  function showTab(name){
    document.querySelectorAll('[data-tab]').forEach(b=>{const yes=b.dataset.tab===name;b.setAttribute('aria-selected',String(yes));b.tabIndex=yes?0:-1});
    document.querySelectorAll('[role=tabpanel]').forEach(p=>p.hidden=p.id!=='view-'+name);
  }
  document.querySelectorAll('[data-tab]').forEach(b=>b.addEventListener('click',()=>showTab(b.dataset.tab)));
  function anchor(item,label){
    const a=el('a',label||'Open original / source');a.href=item.href;a.rel='noopener noreferrer';if(/^https:\/\//.test(item.href))a.target='_blank';return a;
  }
  function sourceCard(s){
    const article=el('article',undefined,'card');
    article.append(el('span',s.type+' · '+s.id,'pill'),el('h3',s.title),el('p',s.body,'content'),el('p',s.detail,'muted'),anchor(s));
    return article;
  }
  const chat=$('chatlog');
  function bubble(text,who){
    const p=el('div',text,'bubble '+who);chat.append(p);chat.scrollTop=chat.scrollHeight;
  }
  function respond(question){
    const r=api.answer(question);bubble(question,'user');bubble(r.text+'\n\n['+r.kind+']','bot');
    if(r.sources.length){const aside=el('div',undefined,'card');aside.append(el('strong','Source receipts: '));r.sources.forEach((s,i)=>{if(i)aside.append(document.createTextNode(' · '));aside.append(anchor(s,s.id+' ('+s.type+')'))});chat.append(aside)}
    chat.scrollTop=chat.scrollHeight;
  }
  $('chat-form').addEventListener('submit',e=>{e.preventDefault();const q=$('chat-input').value.trim();if(!q)return;respond(q);$('chat-input').value=''});
  $('clear-chat').addEventListener('click',()=>{chat.replaceChildren();bubble('Conversation view cleared. The original sources remain unchanged.','bot')});
  const prompts=['Why does the story use 1380 when the manuscript is circa 1390?','How does the KJV describe Babel and circular boundaries?','Show the 19-level Snow Family order.','Compare Dante’s nine circles and the creator’s inverted world.','How does the 4×6 matrix use operators 1–8?','What does the Jewish hat interpretation tell us about prejudice?'];
  for(const p of prompts){const b=el('button',p,'secondary');b.type='button';b.addEventListener('click',()=>respond(p));$('prompts').append(b)}
  bubble('Welcome to the Snow Family Book of Lights. Ask about a verse, an artifact, a level, a story or the matrix. I will name the source and its evidence category.','bot');
  let questIndex=0,score=0,answered=false;
  function renderQuest(){
    const q=d.quests[questIndex];answered=false;$('quest-title').textContent=q.title;$('quest-prompt').textContent=q.prompt;
    $('quest-progress').textContent='Quest '+(questIndex+1)+' of '+d.quests.length;$('quest-result').replaceChildren();$('quest-source').replaceChildren();$('quest-options').replaceChildren();
    q.options.forEach((o,i)=>{const label=el('label',undefined,'choice'),input=document.createElement('input');input.type='radio';input.name='choice';input.value=String(i);label.append(input,document.createTextNode(o));$('quest-options').append(label)});
    $('quest-score').textContent='Score: '+score+' / '+d.quests.length;
  }
  $('quest-form').addEventListener('submit',e=>{
    e.preventDefault();
    if(answered)return;
    const pick=$('quest-options').querySelector('input:checked');
    if(!pick){$('quest-result').textContent='Select an option before checking.';return}
    const result=api.quest(d.quests[questIndex].id,Number(pick.value));
    answered=true;if(result.correct)score++;
    $('quest-result').replaceChildren(el('p',(result.correct?'Correct. ':'Review this answer. ')+result.explain,result.correct?'good':'muted'));
    $('quest-source').append(el('h3','Evidence note'),sourceCard(result.source));
    $('quest-score').textContent='Score: '+score+' / '+d.quests.length;
  });
  $('next-quest').addEventListener('click',()=>{questIndex=(questIndex+1)%d.quests.length;renderQuest()});
  $('reset-quest').addEventListener('click',()=>{questIndex=0;score=0;renderQuest()});
  renderQuest();
  function download(name,content,type){
    const url=URL.createObjectURL(new Blob([content],{type})),a=el('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);
  }
  d.volumes.forEach(v=>{const op=document.createElement('option');op.value=v.id;op.textContent=v.title;$('volume').append(op)});
  function fillChapters(){
    const v=d.volumes.find(x=>x.id===$('volume').value);$('chapter').replaceChildren();
    v.chapters.forEach((t,i)=>{const op=document.createElement('option');op.value=String(i);op.textContent=(i+1)+'. '+t;$('chapter').append(op)});renderChapter();
  }
  function renderChapter(){
    const ch=api.chapter($('volume').value,Number($('chapter').value)),box=$('chapter-display');box.replaceChildren();
    box.append(el('span',ch.status,'pill'),el('h3',ch.volume.title+' · Chapter '+ch.number),el('h2',ch.title),el('p',ch.excerpt,'chapter-text'));
    const tip=el('p','Continue writing this chapter in the source-preserving book studio. This preview is an original seed, not recovered manuscript text.','muted');box.append(tip);
  }
  $('volume').addEventListener('change',fillChapters);$('chapter').addEventListener('change',renderChapter);fillChapters();
  $('download-books').addEventListener('click',()=>download('snow-family-book-of-lights-39-chapter-outline.md',api.exportBooks(),'text/markdown'));
  function renderSources(){
    const q=$('study-query').value.trim();const list=q?api.search(q,12):d.sources;
    $('source-list').replaceChildren();list.forEach(s=>$('source-list').append(sourceCard(s)));
    $('study-count').textContent=list.length+' source records shown / '+d.sources.length+' bundled records';
  }
  $('study-query').addEventListener('input',renderSources);$('download-ledger').addEventListener('click',()=>download('nathan-snow-family-source-ledger.json',api.exportLedger(),'application/json'));renderSources();
  function setLevel(id){
    document.querySelectorAll('[data-level]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.level===id)));
    const x=api.level(id),node=$('level-detail');node.replaceChildren(el('span',x.status,'pill'),el('h3','LEVEL '+x.id+' · '+x.category),el('p',x.description));
  }
  for(const [id,list]of [['north-levels',d.north],['middle-level',[d.center]],['south-levels',d.south]]){
    for(const v of list){const b=el('button',v,v==='0'?'zero':'');b.type='button';b.dataset.level=v;b.setAttribute('aria-pressed','false');b.addEventListener('click',()=>setLevel(v));$(id).append(b)}
  }
  setLevel('0');
  const ops=$('operator-list');for(const o of d.operators){const item=el('p',o.n+'. '+o.name+' — '+o.role,'foot');ops.append(item)}
  function runMatrix(){
    try{
      const r=api.simulate($('binary-input').value.trim()),box=$('matrix-output');box.replaceChildren();
      const scroll=el('div',undefined,'scroll'),table=el('table',undefined,'matrix-table'),thead=el('thead'),hdr=el('tr');
      hdr.append(el('th','Row'));for(const c of d.channels)hdr.append(el('th',c));thead.append(hdr);table.append(thead);
      const tbody=el('tbody');
      for(const step of r.steps){
        const tr=el('tr');tr.append(el('th',step.row+' ('+step.operators.join('+')+')'));
        for(const ch of step.channels){const td=el('td',String(ch.value));td.dataset.bit=String(ch.value);tr.append(td)}
        tbody.append(tr);
      }
      table.append(tbody);scroll.append(table);box.append(scroll,el('p','Original 0: '+r.input+' → after 1–8: '+r.loopState+' → repeated: '+r.returnState+'. Cycle length: '+r.cycleLength+'.','content'));
      box.append(el('p','Matrix 9 / ONE releases '+r.release+'. The original is not overwritten.','good'));
    }catch(e){$('matrix-output').textContent=e.message}
  }
  $('matrix-form').addEventListener('submit',e=>{e.preventDefault();runMatrix()});
  $('release').addEventListener('click',()=>{$('binary-input').value='101100';runMatrix()});
  runMatrix();
})();