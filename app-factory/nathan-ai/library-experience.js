/* Nathan AI book and source directory. Additive, read-only public data.
   Private originals are imported only inside the existing ONE Master Library. */
(function(){
  'use strict';
  const root='../one/library-mind/';
  const $=id=>document.getElementById(id);
  const state={scope:'all',query:'',limit:18,rows:[]};
  const entry=(tag,value)=>{const e=document.createElement(tag);e.textContent=String(value??'');return e;};
  const label=r=>[r.language,r.stage,r.record_stage,r.review_status].filter(Boolean).join(' · ');
  function openRecord(r){
    $('books-reader-title').textContent=r.title||r.id||'Untitled source record';
    $('books-reader-meta').textContent=[r.category,label(r),r.id].filter(Boolean).join(' · ');
    $('books-reader-body').textContent=r.content||r.description||'No readable body is supplied in this public index. Open Library Mind for related files.';
    $('books-reader').hidden=false;
    $('books-reader').focus();
  }
  function render(){
    const query=state.query.toLocaleLowerCase();
    const rows=state.rows.filter(r=>(state.scope==='all'||r.category===state.scope) &&
      (!query||[r.title,r.id,r.language,r.stage,r.record_stage,r.review_status,r.source].filter(Boolean).join(' ').toLocaleLowerCase().includes(query)));
    const grid=$('books-grid');grid.replaceChildren();
    for(const r of rows.slice(0,state.limit)){
      const card=entry('article');card.className='books-entry';
      const badge=entry('span',r.category==='plan'?'SERIES PLAN':'READING RECORD');
      const title=entry('h3',r.title||r.id||'Untitled');
      const meta=entry('small',label(r)||'Stage not specified');
      const desc=entry('p',r.category==='plan'?(r.stage||'Original plan entry'):(r.description||'Read the source record and its stage information.'));
      const b=entry('button','Read record →');b.type='button';b.addEventListener('click',()=>openRecord(r));
      card.append(badge,title,meta,desc,b);grid.append(card);
    }
    $('books-more').hidden=rows.length<=state.limit;
    $('books-status').textContent=rows.length.toLocaleString()+' matching public record'+(rows.length===1?'':'s')+
      ' · '+state.rows.filter(x=>x.category==='reading').length+' readings · '+
      state.rows.filter(x=>x.category==='plan').length+' series-plan entries';
    if(!rows.length)grid.append(entry('p','No matching records. Search another title, or open the private ONE Master Library for owner-selected files.'));
  }
  for(const button of document.querySelectorAll('[data-book-scope]')){
    button.addEventListener('click',()=>{
      state.scope=button.dataset.bookScope;state.limit=18;
      document.querySelectorAll('[data-book-scope]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
      render();
    });
  }
  $('books-query').addEventListener('input',e=>{state.query=e.target.value.trim();state.limit=18;render();});
  $('books-more').addEventListener('click',()=>{state.limit+=18;render();});
  $('books-close').addEventListener('click',()=>{$('books-reader').hidden=true;$('books-query').focus();});
  Promise.all(['documents','plan'].map(async name=>{
    const response=await fetch(root+name+'.json');
    if(!response.ok)throw new Error('HTTP '+response.status);
    const value=await response.json();
    if(!Array.isArray(value))throw new Error('Archive format not supported');
    return value;
  })).then(([docs,plan])=>{
    state.rows=[
      ...docs.map(x=>({...x,category:'reading'})),
      ...plan.map(x=>({...x,category:'plan'}))
    ];render();
  }).catch(()=>{
    $('books-status').textContent='Public book records could not load. Use the existing Library Mind or ONE Master Library links above.';
  });
})();