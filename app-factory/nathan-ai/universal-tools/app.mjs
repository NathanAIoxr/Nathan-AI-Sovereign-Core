import {COLLECTIONS,ARTIFACTS,STATUS,ORIGINAL_NOTE,searchArtifacts} from './registry.mjs';
const $=id=>document.getElementById(id);
const state={set:1,selected:'BX01-13',quiz:null,score:0,round:0,board:Array(9).fill(''),turn:'★',winner:''};
function tag(name,text,className=''){const e=document.createElement(name);if(className)e.className=className;if(text!==undefined)e.textContent=String(text);return e;}
function option(select,value,text){const o=tag('option',text);o.value=String(value);select.append(o);}
function getItem(id){return ARTIFACTS.find(a=>a.id===id);}
function activeSet(){return COLLECTIONS[state.set-1];}
function setSelected(id){const item=getItem(id);if(!item)return;state.set=item.set;state.selected=item.id;$('set-picker').value=String(item.set);renderCase();renderDetail();renderCards();}
function renderDetail(){
 const a=getItem(state.selected);if(!a)return;
 const c=COLLECTIONS[a.set-1];$('detail-title').textContent=a.id+' · '+a.name;
 $('detail-meta').textContent=a.region+' · '+a.shape+' · '+c.mechanic;
 $('detail-status').textContent=STATUS[a.status];
 $('detail-status').dataset.code=a.status;
 $('detail-role').textContent=a.role+(a.previousCenterpiece?' · Earlier centerpiece: '+a.previousCenterpiece:'');
 $('detail-guide').textContent=a.status==='O'?'Original display concept: not an attested historical artifact.':a.status==='P'?'Historical attribution remains unverified.':a.status==='R'?'A related object type, retained to compare shared geometry.':'Use the artifact family for geometry comparison; the individual name and claimed origin require source verification.';
}
const slots=[[1,1],[1,2],[1,3],[1,4],[2,4],[3,4],[4,4],[4,3],[4,2],[4,1],[3,1],[2,1]];
function renderCase(){
 const c=activeSet();$('set-title').textContent=c.title;$('set-description').textContent=c.subtitle+' · '+c.mechanic;
 $('case').replaceChildren();
 c.items.forEach((a,i)=>{
  const b=tag('button','','case-slot'+(i===12?' center-slot':''));b.type='button';
  b.style.gridRow=i===12?'2 / 4':String(slots[i][0]);
  b.style.gridColumn=i===12?'2 / 4':String(slots[i][1]);
  b.setAttribute('aria-label',a.id+' '+a.name);
  b.setAttribute('aria-pressed',String(state.selected===a.id));
  b.append(tag('span',String(a.number).padStart(2,'0'),'slot-number'),tag('span',a.name,'slot-name'),tag('span',a.shape,'slot-shape'));
  b.addEventListener('click',()=>setSelected(a.id));$('case').append(b);
 });
}
function renderCards(){
 const q=$('search').value,which=Number($('catalog-filter').value),status=$('status-filter').value;
 const results=searchArtifacts(q,which,status);$('result-count').textContent=results.length+' / 104 items';
 const out=$('cards');out.replaceChildren();
 for(const a of results){
  const b=tag('button','','artifact-card');b.type='button';b.setAttribute('aria-label','Open '+a.name);
  if(state.selected===a.id)b.classList.add('selected');
  b.append(tag('span',a.id+' · '+(a.number===13?'CENTREPIECE':'COLLECTION'),'micro'),
   tag('strong',a.name),tag('span',a.region+' • '+a.shape,'meta'),
   tag('span',STATUS[a.status],'evidence'));
  b.addEventListener('click',()=>{setSelected(a.id);$('case-heading').scrollIntoView({behavior:'smooth',block:'start'});});
  out.append(b);
 }
 if(!results.length)out.append(tag('p','No matches. Clear one filter to see more.','empty'));
}
function announce(text){$('game-feedback').textContent=text;}
function rand(max){return Math.floor(Math.random()*max);}
function shuffle(array){for(let i=array.length-1;i>0;i--){const j=rand(i+1);[array[i],array[j]]=[array[j],array[i]];}return array;}
function quizQuestion(){
 const a=ARTIFACTS[rand(ARTIFACTS.length)];const c=COLLECTIONS[a.set-1];
 const mode=$('quiz-mode').value;
 let prompt,answer,choices;
 if(mode==='geometry'){
  prompt=a.name+' · '+a.shape+' · '+a.region+'. Which geometry family holds it?';
  answer=c.title;choices=shuffle([answer,...shuffle(COLLECTIONS.filter(x=>x.id!==a.set)).slice(0,2).map(x=>x.title)]);
 }else if(mode==='evidence'){
  prompt=a.name+' · '+a.region+'. What is its evidence label in this atlas?';
  answer=STATUS[a.status];choices=shuffle([answer,...shuffle(Object.keys(STATUS).filter(x=>x!==a.status)).slice(0,2).map(x=>STATUS[x])]);
 }else{
  prompt=a.name+' belongs to which recorded geographical grouping?';
  answer=c.origin;choices=shuffle([answer,...shuffle([...new Set(COLLECTIONS.filter(x=>x.id!==a.set).map(x=>x.origin))].filter(x=>x!==answer)).slice(0,2)]);
 }
 state.quiz={a,prompt,answer,choices,answered:false};$('question').textContent=prompt;
 const out=$('answers');out.replaceChildren();
 for(const choice of choices){const b=tag('button',choice,'answer');b.type='button';b.addEventListener('click',()=>{
  if(state.quiz.answered)return;state.quiz.answered=true;
  if(choice===answer){state.score++;announce('Correct. '+a.name+' — '+a.id+'.');b.classList.add('right');}
  else {announce('The atlas classification is: '+answer+'.');b.classList.add('wrong');}
  out.querySelectorAll('button').forEach(x=>{x.disabled=true;if(x.textContent===answer)x.classList.add('right');});
  $('quiz-score').textContent=state.score+' / '+state.round;
 });out.append(b);}
}
function nextQuestion(){state.round++;$('quiz-score').textContent=state.score+' / '+state.round;announce('Choose one answer.');quizQuestion();}
const lines=[[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
function winner(board){for(const l of lines){if(board[l[0]]&&l.every(i=>board[i]===board[l[0]]))return board[l[0]];}return board.every(Boolean)?'draw':'';}
function renderBoard(){
 const e=$('strategy-board');e.replaceChildren();
 state.board.forEach((value,i)=>{const b=tag('button',value||'·','board-cell');b.type='button';b.disabled=!!value||!!state.winner;b.setAttribute('aria-label','Square '+(i+1)+(value?' '+value:' open'));b.addEventListener('click',()=>{
  if(state.board[i]||state.winner)return;state.board[i]=state.turn;state.winner=winner(state.board);
  if(!state.winner)state.turn=state.turn==='★'?'◆':'★';renderBoard();
 });e.append(b);});
 $('board-message').textContent=state.winner?(state.winner==='draw'?'Draw — reset for another game.':state.winner+' wins — three in a row.'):'Player '+state.turn+' to move. Select an empty square.';
}
function init(){
 for(const c of COLLECTIONS){option($('set-picker'),c.id,('0'+c.id).slice(-2)+' — '+c.title);option($('catalog-filter'),c.id,c.title);}
 for(const key of Object.keys(STATUS))option($('status-filter'),key,STATUS[key]);
 $('set-picker').value='1';$('set-picker').addEventListener('change',e=>{state.set=Number(e.target.value);state.selected=activeSet().items[12].id;renderCase();renderDetail();renderCards();});
 for(const id of ['search','catalog-filter','status-filter'])$(id).addEventListener(id==='search'?'input':'change',renderCards);
 $('search-reset').addEventListener('click',()=>{$('search').value='';$('catalog-filter').value='';$('status-filter').value='';renderCards();});
 $('next-question').addEventListener('click',nextQuestion);
 $('quiz-mode').addEventListener('change',()=>{state.round=0;state.score=0;nextQuestion();});
 $('reset-board').addEventListener('click',()=>{state.board=Array(9).fill('');state.turn='★';state.winner='';renderBoard();});
 $('source-note').textContent=ORIGINAL_NOTE;
 $('collection-count').textContent=String(COLLECTIONS.length);
 $('artifact-count').textContent=String(ARTIFACTS.length);
 renderCase();renderDetail();renderCards();renderBoard();nextQuestion();
}
if(typeof document!=='undefined')init();
