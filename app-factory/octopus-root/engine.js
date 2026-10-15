/* OCTOPUS ROOT: local-first receptor graph, not a live network crawler */
(function(root,make){const api=make();if(typeof module==='object'&&module.exports)module.exports=api;else root.OctopusRoot=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const SCHEMA='tabor.octopus.v1',LIMIT=600;
const TYPES=['exact','reversal','word-order','cipher','symbolic','documented'];
const SEEDS=[
 ['core:middle','THE MIDDLE C','root',''],['formula:arithmetic','Aₙ = a₁ + (n−1)d','formula','AAND'],
 ['word:aand','AAND','word',''],['word:aaron','AARON','word',''],['word:moses','MOSES','word',''],
 ['formula:geometric','Gₙ = a₁ r⁽ⁿ⁻¹⁾','formula','GAR'],['word:gar','GAR','word',''],
 ['formula:harmonic','H = 2xy/(x+y)','formula','HXYXY'],['symbol:heaven','HEAVEN BELOW / HELL ABOVE','symbol',''],
 ['word:dirty','DIRTY CLEAN','word',''],['word:clean','CLEAN DIRTY','word',''],
 ['symbol:square','FUCK + YOU = 🖕🖕 — SQUARED AND ROUND','symbol',''],
 ['formula:abba','a + b = b + a','formula','ABBA'],['word:abba','ABBA','word',''],
 ['filter:cookie','THE NO-LOSS GUT','filter','']
].map(([id,label,kind,glyphs])=>({id,label,kind,glyphs,origin:'Middle C starter archive'}));
const LINK=[
 ['core:middle','formula:arithmetic','symbolic','Index root'],
 ['core:middle','formula:geometric','symbolic','Index root'],
 ['core:middle','formula:harmonic','symbolic','Index root'],
 ['core:middle','word:dirty','symbolic','Index root'],
 ['core:middle','symbol:square','symbolic','Index root'],
 ['formula:arithmetic','word:aand','exact','Selected glyphs A A N D'],
 ['formula:arithmetic','word:aaron','cipher','AAND → AARON: transformation to be specified'],
 ['word:aand','word:moses','symbolic','Aaron and Moses connection'],
 ['formula:geometric','word:gar','exact','Selected glyphs G a r'],
 ['formula:harmonic','symbol:heaven','symbolic','Fraction as above/below spatial metaphor'],
 ['word:dirty','word:clean','word-order','Swap the two words'],
 ['formula:abba','word:abba','exact','Selected glyphs A B B A']
].map(([from,to,type,note])=>({from,to,type,note,review:'starter-example'}));
const clone=v=>JSON.parse(JSON.stringify(v)),idOK=s=>typeof s==='string'&&/^[a-z][a-z0-9-]*:[a-z0-9._-]+$/.test(s);
const clean=s=>String(s||'').toUpperCase().replace(/[^A-Z0-9]/g,'');
const back=s=>Array.from(s).reverse().join('');
const get=(s,id)=>s.nodes.find(n=>n.id===id);
const key=p=>[p.from,p.to,p.type].join('|');
function create(){return {schema:SCHEMA,nodes:clone(SEEDS),edges:clone(LINK),cookie:[],counter:0};}
function check(s,p){
 if(!s||s.schema!==SCHEMA)throw Error('Bad root');
 const a=get(s,p?.from),b=get(s,p?.to);
 if(!a||!b)return {ok:false,why:'Missing receptor'};
 if(a.id===b.id)return {ok:false,why:'Self-link does not stick'};
 if(!TYPES.includes(p.type))return {ok:false,why:'Unknown connection type'};
 if(s.edges.some(x=>key(x)===key(p)))return {ok:false,why:'Duplicate tentacle'};
 if(p.type==='exact'&&clean(a.glyphs)!==clean(b.label))return {ok:false,why:'Glyphs do not spell destination exactly'};
 if(p.type==='reversal'&&clean(back(a.label))!==clean(b.label))return {ok:false,why:'Exact letter reversal fails'};
 if(p.type==='word-order'&&a.label.trim().split(/\s+/).reverse().join(' ').toUpperCase()!==b.label.toUpperCase())return {ok:false,why:'Word order swap fails'};
 if(['cipher','symbolic'].includes(p.type)&&!(typeof p.note==='string'&&p.note.trim()))return {ok:false,why:'Explain the transformation or association'};
 if(p.type==='documented'&&!(typeof p.source==='string'&&/^https:\/\/\S+\.\S+/i.test(p.source)))return {ok:false,why:'Source URL required; not independently verified'};
 return {ok:true,why:p.type==='documented'?'Attached as source-supplied, pending review':'Attached'};
}
function attach(s,p){
 const out=clone(s),r=check(out,p);
 const proposal={from:String(p?.from||''),to:String(p?.to||''),type:String(p?.type||''),note:String(p?.note||'').slice(0,500),source:String(p?.source||'').slice(0,500)};
 out.counter++;
 if(r.ok)out.edges.push({...proposal,review:'local'});else out.cookie.push({id:'cookie:'+out.counter,proposal,why:r.why});
 return {...r,state:out};
}
function retry(s,id,p){
 const out=clone(s),i=out.cookie.findIndex(x=>x.id===id);
 if(i<0)return {ok:false,why:'Missing cookie',state:out};
 const next=p||out.cookie[i].proposal,r=check(out,next);
 if(r.ok){out.cookie.splice(i,1);out.edges.push({...next,review:'repaired'});}
 return {...r,state:out};
}
function addNode(s,n){
 const out=clone(s);
 if(out.nodes.length>=LIMIT||!idOK(n?.id)||!n.label||!n.origin||!['word','pattern','formula','symbol','project'].includes(n.kind)||out.nodes.some(x=>x.id===n.id))
   return {ok:false,why:'Invalid or duplicate root node / size cap',state:out};
 out.nodes.push({id:n.id,label:String(n.label).slice(0,100),kind:n.kind,origin:String(n.origin).slice(0,200),glyphs:String(n.glyphs||'').slice(0,100)});
 return {ok:true,state:out};
}
function grow(s,from='word:dirty',budget=3){
 const out=clone(s),start=get(out,from);
 if(!start||!['word','pattern'].includes(start.kind))return {state:out,added:0,why:'Start with a word or pattern'};
 let added=0;const words=start.label;
 const transformations=[
 ['reverse',back(words)],
 ['rotate-left',words.slice(1)+words[0]],
 ['rotate-right',words.slice(-1)+words.slice(0,-1)],
 ['word-order',words.trim().split(/\s+/).reverse().join(' ')]
 ];
 for(const [how,label] of transformations){
  if(added>=Math.min(12,Math.max(1,budget))||out.nodes.length>=LIMIT)break;
  if(!label||label===words)continue;
  const id='pattern:'+Array.from(from+'|'+how+'|'+label).map(c=>c.codePointAt(0).toString(16)).join('').slice(0,120);
  if(get(out,id))continue;
  out.nodes.push({id,label,kind:'pattern',origin:'Generated '+how+' from '+from,glyphs:'',depth:(start.depth||0)+1});
  out.edges.push({from,to:id,type:how==='word-order'?'word-order':how==='reverse'?'reversal':'symbolic',note:'Generated '+how,review:'generated'});
  added++;
 }
 return {state:out,added,why:added?'New sucker-cup branches':'No distinct new branches'};
}
function save(s){return JSON.stringify(s,null,2)}
function load(v){
 const s=typeof v==='string'?JSON.parse(v):clone(v);
 if(s?.schema!==SCHEMA||!Array.isArray(s.nodes)||!Array.isArray(s.edges)||!Array.isArray(s.cookie)||!Number.isInteger(s.counter))throw Error('Invalid snapshot');
 if(s.nodes.length>LIMIT||s.edges.length>4000||s.cookie.length>4000||s.nodes.some(n=>!idOK(n.id)||!n.label)||new Set(s.nodes.map(n=>n.id)).size!==s.nodes.length)throw Error('Unsafe snapshot');
 if(s.edges.some(e=>!get(s,e.from)||!get(s,e.to)||!TYPES.includes(e.type)))throw Error('Broken links');
 s.edges=s.edges.map(e=>({...e,review:'imported-unverified'}));
 return s;
}
function adapter(s,namespace){
 if(!/^[a-z][a-z0-9-]*$/.test(namespace))throw Error('Bad namespace');
 return {schema:'tabor.octopus.adapter.v1',namespace,nodes:clone(s.nodes.filter(n=>n.id.startsWith(namespace+':'))),note:'Read-only. Sharing requires explicit project permission.'};
}
return Object.freeze({SCHEMA,LIMIT,TYPES,create,check,attach,retry,addNode,grow,save,load,adapter,back});
});