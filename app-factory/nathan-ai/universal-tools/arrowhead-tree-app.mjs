import {PAIRS,PAIR_SCHEMA,MATRIX_NOTE,SOURCE_REFERENCES,findPairs,matchAnswer} from './arrowhead-tree-matrix.mjs';
const $=id=>document.getElementById(id);
const state={direction:'point',query:'',selected:1,score:0,turns:0,quiz:null};
function node(tag,txt,className){const e=document.createElement(tag);if(txt!==undefined)e.textContent=txt;if(className)e.className=className;return e;}
function current(){return PAIRS[state.selected-1];}
function setDirection(value){state.direction=value;$('point-first').setAttribute('aria-pressed',String(value==='point'));$('tree-first').setAttribute('aria-pressed',String(value==='tree'));renderList();renderSelected();newQuiz();}
function select(number){state.selected=Number(number);renderList();renderSelected();}
function art(type,p){
 const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
 svg.setAttribute('viewBox','0 0 180 170');svg.setAttribute('role','img');
 const label=type==='point'?'Generic point silhouette — NOT a copy of a museum artifact':'Diagrammatic tree silhouette — NOT a botanical specimen';
 svg.setAttribute('aria-label',label);
 const NS='http://www.w3.org/2000/svg';
 function el(name,attrs){const x=document.createElementNS(NS,name);for(const [k,v] of Object.entries(attrs))x.setAttribute(k,String(v));svg.append(x);return x;}
 if(type==='point'){
   const tri={base:'95,20 137,103 107,106 107,150 74,150 74,106 45,103',stem:'90,14 135,92 107,94 107,149 73,149 73,94 45,92',
      notch:'90,16 136,110 111,110 111,150 69,150 69,110 44,110',lance:'90,12 128,78 112,112 90,145 68,112 52,78'};
   const k=p.shape.includes('stem')?'stem':p.shape.includes('lance')?'lance':p.shape.includes('notch')?'notch':'base';
   el('polygon',{points:tri[k],fill:'#c2c2b4',stroke:'#e9e6c6','stroke-width':2});
   el('path',{d:'M90 22 L90 130',stroke:'#7a8584','stroke-width':2,'stroke-dasharray':'3 5'});
 }else{
   el('rect',{x:85,y:105,width:10,height:57,rx:2,fill:'#8a6140'});
   [0,1,2,3].forEach(i=>{
     const y=19+i*30,spread=18+i*18;
     el('polygon',{points:'90,'+y+' '+(90+spread)+','+(y+56)+' '+(90-spread)+','+(y+56),fill:i%2?'#4a866d':'#67a78a',stroke:'#a8cbb6','stroke-width':1});
   });
 }
 return svg;
}
function renderSelected(){
 const p=current();if(!p)return;
 $('pair-title').textContent=String(p.number).padStart(2,'0')+' · '+(state.direction==='tree'?p.treeName:p.pointName);
 $('pair-subtitle').textContent=(state.direction==='tree'?p.pointName:p.treeName)+' · '+p.region;
 const left=$('primary-graphic'),right=$('secondary-graphic');left.replaceChildren(art(state.direction==='tree'?'tree':'point',p));right.replaceChildren(art(state.direction==='tree'?'point':'tree',p));
 $('primary-name').textContent=state.direction==='tree'?p.treeName:p.pointName;
 $('secondary-name').textContent=state.direction==='tree'?p.pointName:p.treeName;
 $('original-description').textContent=p.originalConnection;
 $('accuracy-note').textContent=p.accuracyNote;
 $('tree-scientific').textContent=p.acceptedLatin+(p.originalLatin!==p.acceptedLatin?' · originally supplied as '+p.originalLatin:'');
 $('evidence-status').textContent=p.typeEvidence;
 $('source-standard').textContent=p.linkStatus==='creative-shape-analogy'?'Creative geometry correspondence only — not a historically documented design relationship.':'';
}
function renderList(){
 const rows=findPairs(state.query,state.direction);$('count').textContent=rows.length+' / 13 pairs';
 const list=$('pairs');list.replaceChildren();
 for(const p of rows){
  const b=node('button',undefined,'pair-row');b.type='button';b.setAttribute('aria-pressed',String(p.number===state.selected));
  b.append(node('span',String(p.number).padStart(2,'0'),'number'),node('span',(state.direction==='tree'?p.treeName:p.pointName)+' ↔ '+(state.direction==='tree'?p.pointName:p.treeName),'pair-name'));
  b.addEventListener('click',()=>select(p.number));list.append(b);
 }
 if(!rows.length)list.append(node('p','No pairs found. Try another term.','muted'));
}
function shuffle(x){for(let i=x.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[x[j],x[i]]=[x[i],x[j]];}return x;}
function newQuiz(){
 const p=PAIRS[Math.floor(Math.random()*PAIRS.length)];
 const options=shuffle([matchAnswer(p.number,state.direction),...shuffle(PAIRS.filter(x=>x.number!==p.number)).slice(0,3).map(x=>matchAnswer(x.number,state.direction))]);
 state.quiz={p,answer:matchAnswer(p.number,state.direction),done:false};
 $('quiz-question').textContent=state.direction==='tree'?'Which archaeological point is paired with '+p.treeName+'?':'Which tree is paired with '+p.pointName+'?';
 const out=$('quiz-options');out.replaceChildren();
 for(const opt of options){
  const b=node('button',opt,'answer');b.type='button';b.addEventListener('click',()=>{
    if(state.quiz.done)return;state.quiz.done=true;state.turns++;
    if(opt===state.quiz.answer){state.score++;b.classList.add('correct');}
    else b.classList.add('incorrect');
    out.querySelectorAll('button').forEach(x=>{x.disabled=true;if(x.textContent===state.quiz.answer)x.classList.add('correct');});
    $('score').textContent=state.score+' / '+state.turns;
    $('quiz-message').textContent=opt===state.quiz.answer?'Matched.':'Pair in the author’s matrix: '+state.quiz.answer+'.';
    select(p.number);
  });out.append(b);
 }
 $('quiz-message').textContent='Choose the matching partner from the author’s 13 pairs.';
}
function renderSources(){
 const list=$('sources');for(const s of SOURCE_REFERENCES){const li=node('li'),a=node('a',s.label);a.href=s.url;a.target='_blank';a.rel='noopener noreferrer';li.append(a);list.append(li);}
}
function init(){
 $('point-first').addEventListener('click',()=>setDirection('point'));$('tree-first').addEventListener('click',()=>setDirection('tree'));
 $('query').addEventListener('input',e=>{state.query=e.target.value;renderList();});
 $('clear-search').addEventListener('click',()=>{$('query').value='';state.query='';renderList();});
 $('next-quiz').addEventListener('click',newQuiz);
 $('schema').textContent=PAIR_SCHEMA;$('matrix-note').textContent=MATRIX_NOTE;
 renderSources();renderList();renderSelected();newQuiz();
}
if(typeof document!=='undefined')init();
