(function(){
'use strict';
const E=window.NathanFiveMatrix,$=id=>document.getElementById(id),state={data:null,question:0,score:0,answered:false,ringIds:new Set(),matrix:'BODY',sourceLines:null,sourceShow:25,sourceQuery:''};
function make(tag,text,className){const el=document.createElement(tag);if(text!==undefined)el.textContent=text;if(className)el.className=className;return el;}
function link(path,text){const el=make('a',text);el.href=path;el.target='_blank';el.rel='noopener noreferrer';return el;}
function clear(el){el.replaceChildren();}
function download(filename,content,type){const blob=new Blob([content],{type}),url=URL.createObjectURL(blob),a=make('a');a.href=url;a.download=filename;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),2000);}
function askChat(text){
 const prompt=String(text).slice(0,500);
 if(window.parent!==window){window.parent.postMessage({type:'nathan.five-matrix.prompt',prompt},location.origin);}
 else{const a=make('a');a.href='../index.html';a.click();}
}
function setTab(tab){for(const b of document.querySelectorAll('[data-tab]'))b.setAttribute('aria-pressed',String(b.dataset.tab===tab));for(const panel of document.querySelectorAll('[data-view]'))panel.hidden=panel.dataset.view!==tab;}

function importBaseline(baseline){
 const map={lotr:'Middle-earth',hobbit:'The Hobbit',narnia:'Narnia',kjv:'KJV',design:'Interpretive model'};
 const cats=new Map(baseline.categories.map(x=>[x.id,x.name]));
 const added=baseline.objects.map(o=>({
  id:'BASE:'+o.id,name:o.title,universe:map[o.universe]||o.universe,
  class:cats.get(o.category)||o.category,
  matrices:o.matrices.map(x=>x.toUpperCase()),summary:o.summary,source:o.source+' · Existing Atlas baseline',
  links:(o.links||[]).map(x=>'BASE:'+x),material:o.material,dimensions:o.dimensions,
  function:o.function,bearer:o.bearer,attributes:o.attributes,recordType:'original-atlas-baseline'
 }));
 state.data.records.push(...added);state.baseline=baseline;
}
function renderBaselineTables(){
 const b=state.baseline;if(!b)return;
 const destination=$('baseline-structure');if(!destination)return;clear(destination);
 const panels=[
  {name:'Symbolic transformations',arr:b.transformations,describe:x=>(x.from+' ↔ '+x.to+' · '+x.explanation)},
  {name:'KJV passage reference index',arr:b.scripture,describe:x=>(x.ref+' · '+x.topic+' · '+x.type)},
  {name:'World timelines',arr:b.events,describe:x=>(x.date+' · '+x.name+' · '+x.description)}
 ];
 for(const item of panels){
  const details=make('details'),summary=make('summary',item.name+' ('+item.arr.length+')');details.append(summary);
  for(const entry of item.arr){const p=make('p',item.describe(entry));details.append(p);}
  destination.append(details);
 }
}

function drawRecord(rec){
 const c=make('article',undefined,'card'),head=make('div',rec.id+' · '+rec.universe,'meta'),name=make('h3',rec.name),kind=make('span','Primary class: '+rec.class,'class'),description=make('p',rec.summary),origin=make('p','Source: '+rec.source,'muted'),tags=make('div',undefined,'tags');
 for(const m of rec.matrices)tags.append(make('span',m));
 c.append(head,name,kind,description,tags,origin);
 if(rec.recordType==='original-atlas-baseline')c.append(make('p','Material: '+(rec.material||'not specified')+' · Dimensions: '+(rec.dimensions||'not specified')+' · Function: '+(rec.function||'not specified')+' · Bearer: '+(rec.bearer||'not specified'),'muted'));
 if(rec.links.length){const related=state.data.records.filter(x=>rec.links.includes(x.id)).map(x=>x.name);if(related.length)c.append(make('p','Linked — not merged: '+related.join('; '),'muted'));}
 const button=make('button','Ask Nathan AI about '+rec.name);button.type='button';button.addEventListener('click',()=>askChat('Explore '+rec.name+' in '+rec.universe+' across the Five Matrices, keeping source objects separate from symbolic comparisons.'));c.append(button);
 return c;
}
function showAtlas(){
 const rows=E.search(state.data,$('atlas-query').value,$('atlas-universe').value,$('atlas-matrix').value,100),out=$('atlas-results');clear(out);
 $('atlas-status').textContent=rows.length+' matching records'+(rows.length===100?' (showing first 100)':'');
 for(const r of rows)out.append(drawRecord(r));
}
function refreshQuiz(){
 const d=state.data,q=d.questions[state.question],total=d.questions.length;
 $('quest-progress').textContent=state.question>=total?'Completed quest':'Challenge '+(state.question+1)+' / '+total;
 $('quest-score').textContent='Score: '+state.score+' / '+(state.question+(state.answered?1:0));
 $('quest-bar').style.width=Math.round((state.question+(state.answered?1:0))/total*100)+'%';
 clear($('quest-choices'));$('quest-feedback').textContent='';
 $('quest-next').hidden=true;
 if(!q){$('quest-question').textContent='Quest complete — '+state.score+' of '+total+' correct.';$('quest-feedback').textContent='Review the source atlas and try again. The score is for educational practice.';return;}
 $('quest-question').textContent=q.question;
 for(const choice of q.options){
  const b=make('button',choice);b.type='button';b.addEventListener('click',()=>answer(choice,b));$('quest-choices').append(b);
 }
}
function answer(value,pressed){
 if(state.answered)return;
 const q=state.data.questions[state.question],result=E.grade(q,value);state.answered=true;
 if(result.correct)state.score++;
 for(const b of $('quest-choices').querySelectorAll('button')){b.disabled=true;if(b.textContent===result.correctAnswer)b.classList.add('correct');else if(b===pressed)b.classList.add('incorrect');}
 const r=state.data.records.find(x=>x.id===result.recordId);
 $('quest-feedback').textContent=(result.correct?'Correct. ':'Compare the source. Correct answer: '+result.correctAnswer+'. ')+(r?r.id+' · '+r.name+'. '+r.source:'');
 $('quest-score').textContent='Score: '+state.score+' / '+(state.question+1);
 $('quest-bar').style.width=Math.round((state.question+1)/state.data.questions.length*100)+'%';
 $('quest-next').hidden=false;$('quest-next').textContent=state.question===state.data.questions.length-1?'Finish quest':'Next challenge';
}
function chooseBook(){
 const book=state.data.books.find(x=>x.id===$('book-pick').value)||state.data.books[0];
 $('book-meta').textContent=book.series+' · Volume '+book.volume+' · '+book.universe;
 $('book-title').textContent=book.title;$('book-description').textContent=book.description;$('book-stage').textContent=book.status;
 clear($('book-outline'));for(const point of book.outline)$('book-outline').append(make('li',point));
 $('book-notes').value='';$('book-status').textContent='A source-preserving outline, ready for original writing.';
}
function selectedBook(){return state.data.books.find(x=>x.id===$('book-pick').value)||state.data.books[0];}
function renderLesson(){
 for(const b of $('matrix-buttons').querySelectorAll('button'))b.setAttribute('aria-pressed',String(b.dataset.matrix===state.matrix));
 const entry=E.lesson(state.matrix,state.data),out=$('lesson-output');clear(out);
 out.append(make('p','MATRIX '+(E.MATRIX_IDS.indexOf(state.matrix)+1),'eyebrow'),make('h3',entry.title),make('p',entry.description));
 out.append(make('p','Examples: '+entry.items.map(x=>x.name+' ('+x.universe+')').join(' · '),'muted'));
 const b=make('button','Show these in the atlas');b.type='button';b.addEventListener('click',()=>{$('atlas-query').value='';$('atlas-universe').value='';$('atlas-matrix').value=state.matrix;setTab('atlas');showAtlas();});out.append(b);
}
function drawRings(){
 const out=$('ring-buttons');clear(out);
 for(const r of state.data.rings){
  const b=make('button');b.type='button';b.setAttribute('aria-pressed',String(state.ringIds.has(r.id)));
  b.append(make('strong',r.id+'. '+r.position),make('small',r.theme));
  b.addEventListener('click',()=>{state.ringIds.has(r.id)?state.ringIds.delete(r.id):state.ringIds.add(r.id);drawRings();});out.append(b);
 }
 const info=E.ringState(state.data.rings,state.ringIds);$('ring-status').textContent=info.selected+' / '+info.total+' placements · '+info.hand+' hands/fingers/thumbs · '+info.bracelets+' bracelets'+(info.complete?' · Composition complete. Symbolic only.':'');
}
const srcPaths={"SRC-001":"2026-11-04-middle-earth-narnia-five-matrix-conversation-original.txt","SRC-002":"2026-11-04-rings-gates-conversation-original.txt"};
function showSources(){
 const q=E.normalized($('source-query').value),src=$('source-filter').value,out=$('source-results');clear(out);
 if(!state.sourceLines)return;
 const rows=state.sourceLines.filter(r=>(!src||r.source_id===src)&&(!q||E.normalized(r.text).includes(q)||E.normalized(r.id).includes(q)));
 for(const rec of rows.slice(0,state.sourceShow)){
 const a=make('article',undefined,'source-item');
 a.append(make('div',rec.id+' · Source line '+rec.line,'meta'),make('p',rec.text||'(blank line)'),link('../../../../one/five-matrix-atlas/sources/'+srcPaths[rec.source_id],'Open exact source document'));
 out.append(a);
 }
 $('source-status').textContent=rows.length+' matching original line records · showing '+Math.min(rows.length,state.sourceShow);
 $('source-more').hidden=rows.length<=state.sourceShow;
}
async function loadSources(){
 if(state.sourceLines){showSources();return;}
 $('source-status').textContent='Loading the indexed originals from the local atlas…';
 try{
 const r=await fetch('../../../../one/five-matrix-atlas/data/line-index.json',{cache:'no-store'});
 if(!r.ok)throw Error('Source registry unavailable; the source atlas may not have been deployed together with Hop In.');
 const body=await r.json();if(!Array.isArray(body.records)||body.records.length>200000)throw Error('Invalid source index.');
 state.sourceLines=body.records.filter(x=>x&&typeof x.text==='string'&&typeof x.id==='string'&&typeof x.line==='number'&&srcPaths[x.source_id]);
 showSources();
 }catch(e){$('source-status').textContent=e.message;}
}
async function init(){
 try{
 const response=await fetch('catalog.json',{cache:'no-store'});if(!response.ok)throw Error('Catalog not found.');
 state.data=E.validate(await response.json());
 try{
 const fetched=await fetch('../../../../one/five-matrix-atlas/data/atlas-baseline-103.json',{cache:'no-store'});
 if(fetched.ok){const base=await fetched.json();if(base.objects?.length===103&&base.transformations?.length===22&&base.scripture?.length===20)importBaseline(base);}
 }catch(_){/* The curated learning app still functions without the baseline file. */}
 renderBaselineTables();
 $('record-count').textContent=state.data.records.length;$('book-count').textContent=state.data.books.length;$('game-count').textContent=state.data.questions.length;
 for(const b of document.querySelectorAll('[data-tab]'))b.addEventListener('click',()=>setTab(b.dataset.tab));
 for(const id of ['atlas-query','atlas-universe','atlas-matrix'])$(id).addEventListener(id==='atlas-query'?'input':'change',showAtlas);
 $('quest-next').addEventListener('click',()=>{state.question++;state.answered=false;refreshQuiz();});
 $('quest-restart').addEventListener('click',()=>{state.question=0;state.score=0;state.answered=false;refreshQuiz();});
 const group=document.createDocumentFragment();for(const m of state.data.matrix){
 const b=make('button',m.id);b.type='button';b.dataset.matrix=m.id;b.addEventListener('click',()=>{state.matrix=m.id;renderLesson();});group.append(b);
 }$('matrix-buttons').append(group);
 const books=$('book-pick');let lastSeries='';for(const v of state.data.books){
 if(v.series!==lastSeries){const h=make('optgroup');h.label=v.series;books.append(h);lastSeries=v.series;}
 const op=make('option',v.title);op.value=v.id;books.lastElementChild.append(op);
 }
 books.addEventListener('change',chooseBook);
 $('book-export').addEventListener('click',()=>{const v=selectedBook();const txt=E.bookDraft(v,$('book-notes').value);download(v.id.toLowerCase()+'-outline.md',txt,'text/markdown;charset=utf-8');$('book-status').textContent='Exported an original draft starter; not a completed novel.';});
 $('book-ask').addEventListener('click',()=>askChat('Help expand my original educational book outline titled '+selectedBook().title+' in the Five Matrix framework. Preserve sources, classify interpretation, and do not reproduce copyrighted novel text.'));
 $('ring-all').addEventListener('click',()=>{state.ringIds=new Set(state.data.rings.map(x=>x.id));drawRings();});
 $('ring-clear').addEventListener('click',()=>{state.ringIds.clear();drawRings();});
 $('ring-export').addEventListener('click',()=>download('five-matrix-twelve-rings.json',JSON.stringify({schema:'nathan.five-matrix.wearable-symbols.v1',placements:state.data.rings.filter(x=>state.ringIds.has(x.id)),disclaimer:'Symbolic placement only'},null,2),'application/json'));
 $('source-load').addEventListener('click',loadSources);$('source-query').addEventListener('input',()=>{state.sourceShow=25;showSources();});
 $('source-filter').addEventListener('change',()=>{state.sourceShow=25;showSources();});
 $('source-more').addEventListener('click',()=>{state.sourceShow+=25;showSources();});
 chooseBook();showAtlas();refreshQuiz();renderLesson();drawRings();
 }catch(err){$('atlas-status').textContent='Unable to start Five-Matrix experience: '+err.message;}
}
init();
})();