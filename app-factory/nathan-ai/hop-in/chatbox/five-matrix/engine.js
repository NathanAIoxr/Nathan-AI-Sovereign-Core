(function(root){
'use strict';
const SCHEMA='nathan.hop-in.five-matrix-learning.v1';
const MATRIX_IDS=Object.freeze(['BODY','SOUL','SHADOW','MIND','SPIRIT']);
const TYPES=Object.freeze(['Middle-earth','The Hobbit','Narnia','KJV','Interpretive model']);
function normalized(value){return String(value??'').normalize('NFC').toLocaleLowerCase('en-US').trim()}
function validate(data){
 if(!data||data.schema!==SCHEMA||!Array.isArray(data.records)||!Array.isArray(data.questions)||!Array.isArray(data.books)||!Array.isArray(data.rings))throw Error('Invalid learning catalog schema.');
 const ids=new Set();
 for(const r of data.records){
  if(!r||typeof r.id!=='string'||ids.has(r.id)||typeof r.name!=='string'||typeof r.class!=='string'||typeof r.summary!=='string'||typeof r.source!=='string'||!Array.isArray(r.matrices)||r.matrices.some(x=>!MATRIX_IDS.includes(x)))throw Error('Invalid or duplicate source record.');
  ids.add(r.id);
 }
 if(data.rings.length!==12||new Set(data.rings.map(x=>x.id)).size!==12||data.rings.filter(x=>x.position.includes('arm')).length!==2)throw Error('Twelve-ring positions are incomplete.');
 for(const x of data.questions)if(!ids.has(x.record)||!Array.isArray(x.options)||!x.options.includes(x.answer))throw Error('Quiz reference or answer invalid.');
 for(const x of data.books)if(!x.id||!Array.isArray(x.outline)||x.outline.length<1)throw Error('Incomplete book outline.');
 return data;
}
function search(data,query='',universe='',matrix='',limit=100){
 const q=normalized(query),u=normalized(universe);return data.records.filter(r=>(!u||normalized(r.universe)===u)&&(!matrix||r.matrices.includes(matrix))&&(!q||normalized([r.id,r.name,r.class,r.summary,r.source,...r.matrices].join(' ')).includes(q))).slice(0,Math.max(1,Math.min(500,limit)));
}
function grade(question,option){if(!question?.options?.includes(option))throw Error('Choose a displayed answer.');return {correct:option===question.answer,correctAnswer:question.answer,recordId:question.record};}
function ringState(rings,ids){const selected=new Set(ids);const chosen=rings.filter(r=>selected.has(r.id));return {selected:chosen.length,total:rings.length,complete:chosen.length===12,hand:chosen.filter(r=>!r.position.includes('arm')).length,bracelets:chosen.filter(r=>r.position.includes('arm')).length};}
function bookDraft(volume,notes=''){
 if(!volume||typeof volume.title!=='string'||!Array.isArray(volume.outline))throw Error('Book selection required.');
 const safeNotes=String(notes).slice(0,10000);
 return ['# '+volume.title,'','**Series:** '+volume.series,'**Volume:** '+volume.volume,'**Stage:** Educational companion outline; draft chapter starter, not a completed novel.','**Scope:** Original study commentary and new creative exercises. No reproduction of Tolkien or Lewis novel passages.','','## Purpose',volume.description,'','## Five-part chapter structure',...volume.outline.flatMap((part,i)=>['','### '+(i+1)+'. '+part,'Research prompt: Identify one documented primary object or passage, then write an original interpretation and label its evidence status.']),'','## Reader workshop','Record the original object category; then write any metaphor, game rule, or inversion as a separately linked interpretation.','','## Working notes',safeNotes||'No notes entered.','','## Attribution','Literary universes credited to J. R. R. Tolkien and C. S. Lewis. Scripture references to the King James Version. Nathan AI educational interpretation is independent of those authors.',''].join('\n');
}
function lesson(matrix,data){
 const m=data.matrix.find(x=>x.id===matrix);if(!m)throw Error('Unknown matrix.');
 return {title:m.id,description:m.description,items:data.records.filter(x=>x.matrices.includes(matrix)).slice(0,12)};
}
const API={SCHEMA,MATRIX_IDS,TYPES,validate,normalized,search,grade,ringState,bookDraft,lesson};
if(typeof module==='object'&&module.exports)module.exports=API;else root.NathanFiveMatrix=API;
})(typeof window==='object'?window:globalThis);
