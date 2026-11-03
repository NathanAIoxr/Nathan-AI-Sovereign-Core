(function(root){
'use strict';
const MAX=2000000, FILE_MAX=2000000;
function words(text){return String(text).toLocaleLowerCase().match(/[\p{L}\p{N}]+/gu)||[]}
function sentences(text){return (String(text).match(/[^.!?\n]+[.!?]?/g)||[]).map(s=>s.trim()).filter(s=>s.length>=18)}
const STOP=new Set('the a an and or is are to it of in on with as at for that this those these from by be been was were have has had its their they them you your not but so into over than there which what when where how who about will can do all'.split(' '));
function highlights(text,limit=5){
 const ss=sentences(text).slice(0,20000);if(!ss.length)return [];
 const freq=new Map();for(const word of words(text).slice(0,100000)){if(word.length<3||STOP.has(word))continue;freq.set(word,(freq.get(word)||0)+1)}
 return ss.map((s,i)=>{const w=words(s).filter(x=>!STOP.has(x));const score=w.reduce((n,x)=>n+(freq.get(x)||0),0)/Math.max(6,w.length);return {i,s,score}}).sort((a,b)=>b.score-a.score||a.i-b.i).slice(0,Math.max(0,Math.min(10,limit))).sort((a,b)=>a.i-b.i).map(x=>x.s)
}
function search(text,query,max=12){
 const q=String(query).trim().toLocaleLowerCase();if(!q)return [];
 const lower=String(text).toLocaleLowerCase(),matches=[];let pos=0;
 while((pos=lower.indexOf(q,pos))!==-1&&matches.length<max){const start=Math.max(0,pos-110),end=Math.min(text.length,pos+q.length+160);matches.push((start?'…':'')+text.slice(start,end)+(end<text.length?'…':''));pos+=Math.max(1,q.length)}
 return matches;
}
function compare(a,b){
 const aw=words(a),bw=words(b),as=new Set(aw),bs=new Set(bw);
 return {aWords:aw.length,bWords:bw.length,shared:[...as].filter(w=>bs.has(w)).length,onlyA:[...as].filter(w=>!bs.has(w)).slice(0,25),onlyB:[...bs].filter(w=>!as.has(w)).slice(0,25),identical:String(a)===String(b)};
}
const api={words,sentences,highlights,search,compare};
if(typeof module!=='undefined'&&module.exports)module.exports=api;
if(typeof document==='undefined')return;
const $=id=>document.getElementById(id),read=()=>$('source').value,put=(id,text)=>{$(id).textContent=text};
let lastHighlights='',lastCompare='';
function exportText(name,text){const blob=new Blob([text],{type:'text/plain;charset=utf-8'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),2000)}
$('file').addEventListener('change',async()=>{
 const f=$('file').files?.[0];if(!f)return;
 if(f.size>FILE_MAX){put('source-status','File too large for this local preview (2 MB maximum).');return}
 try{const text=await f.text();if(text.includes('\0'))throw Error('Binary file not supported');$('source').value=text.slice(0,MAX);put('source-status','Loaded '+f.name+' locally. No upload was performed.')}catch(e){put('source-status','Cannot read this as plain text: '+e.message)}
});
$('inspect').addEventListener('click',()=>{
 const t=read();const w=words(t);const lines=t.split(/\r?\n/);
 put('stats',w.length+' words · '+t.length+' characters · '+lines.length+' lines · '+sentences(t).length+' sentence candidates');
 put('source-status',t?'Inspected locally. Original remains editable.':'No source text loaded.');
});
$('highlights').addEventListener('click',()=>{
 const h=highlights(read());lastHighlights=h.map((v,i)=>(i+1)+'. '+v).join('\n\n');
 put('highlight-result',lastHighlights||'No complete sentences found.');});
$('find').addEventListener('click',()=>{
 const m=search(read(),$('query').value);put('search-result',m.length?m.map((x,i)=>(i+1)+'. '+x).join('\n\n'):'No matching passages found.');
});
$('download-source').addEventListener('click',()=>exportText('nathan-source-original.txt',read()));
$('clear-source').addEventListener('click',()=>{if(!confirm('Clear the source text currently in this page?'))return;$('source').value='';$('file').value='';lastHighlights='';put('stats','');put('source-status','Source cleared.');put('highlight-result','Choose “Extract key sentences.”')});
$('copy-highlights').addEventListener('click',async()=>{if(!lastHighlights)return;try{await navigator.clipboard.writeText(lastHighlights);put('source-status','Copied extracted passages.')}catch{put('source-status','Copy unavailable; select the passages manually.')}});
$('save-highlights').addEventListener('click',()=>exportText('nathan-extracted-passages.txt',lastHighlights));
$('compare').addEventListener('click',()=>{
 const a=$('answer-a').value,b=$('answer-b').value,c=compare(a,b);
 lastCompare='Response A: '+c.aWords+' words\nResponse B: '+c.bWords+' words\nIdentical text: '+(c.identical?'Yes':'No')+'\nShared distinct words: '+c.shared+'\nOnly in A (sample): '+c.onlyA.join(', ')+'\nOnly in B (sample): '+c.onlyB.join(', ')+'\n\n--- RESPONSE A ---\n'+a+'\n\n--- RESPONSE B ---\n'+b;
 put('compare-result',lastCompare);
});
$('export-compare').addEventListener('click',()=>exportText('nathan-model-comparison.txt',lastCompare));
})(typeof globalThis!=='undefined'?globalThis:this);