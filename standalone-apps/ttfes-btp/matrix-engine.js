/* TTFES&BTP creator-defined learning stacks, geometry, logic and phonetic views.
 * Original source is NEVER modified, and derived output remains explicitly labeled.
 */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.TTFESMatrix=api;
})(typeof globalThis==='undefined'?this:globalThis,function(){
 'use strict';
 const PLANES=Object.freeze(['Geometry','Logic','Phonetic','Deployment']);
 const AXES=Object.freeze(['Source','Structure','Direction','Language','Format','Destination','Permission','Status','Revision']);
 const STACKS=Object.freeze([
  'Source Records','Learning and Reading Stacks','Alphabetic Index Matrices',
  'Geometry and Character Grids','Multi-Dimensional Registers',
  'Phonetics and Sound Maps','Ancient and Modern Text Comparisons',
  'Original Books and Media','Metadata and Classifications','Task and Approval Workflows',
  'Provenance and Revision Evidence'
 ]);
 const MODES=Object.freeze([
  {id:'identity',name:'Identity / original view',plane:'Geometry',purpose:'Exact same text in derived slot'},
  {id:'reverse-characters',name:'Reverse visible character sequence',plane:'Geometry',purpose:'Unicode code-point reversal; not visual glyph rotation'},
  {id:'reverse-lines',name:'Reverse line order',plane:'Geometry',purpose:'Lines in reverse order, normalized output newline'},
  {id:'reverse-words',name:'Reverse word order',plane:'Geometry',purpose:'Token reordering across spaces'},
  {id:'az-forward',name:'A–Z forward coordinates',plane:'Geometry',purpose:'26 letters indexed 1..26'},
  {id:'az-reverse',name:'Z–A reverse coordinates',plane:'Geometry',purpose:'26 letters indexed 26..1'},
  {id:'word-grid',name:'Word row/column grid',plane:'Geometry',purpose:'Structured tokens with line, word and text values'},
  {id:'acrostic',name:'First-letter acrostic',plane:'Phonetic',purpose:'Leading letter from each nonblank line'},
  {id:'telestich',name:'Last-letter telestich',plane:'Phonetic',purpose:'Last letter from each nonblank line'},
  {id:'case-sound',name:'Lowercase auditory preparation',plane:'Phonetic',purpose:'Optional case-only derived view; not a phonetic translation'},
  {id:'binary-build',name:'1+1=2 BUILD — Derived state 1',plane:'Logic',purpose:'A label for retained transformation'},
  {id:'binary-clear',name:'1−1=0 CLEAR — Derived state 0',plane:'Logic',purpose:'Reject/clear the new derivative while source stays'},
  {id:'transport-plan',name:'Deployment plan / review gates',plane:'Deployment',purpose:'Explicit local/export/external stages'}
 ]);
 function createLenses(labels){
   if(labels!==undefined&&(!Array.isArray(labels)||labels.length>38))throw Error('Custom lens labels must be up to 38.');
   return Object.freeze(Array.from({length:38},(_,i)=>Object.freeze({
     index:i+1,label:String(labels?.[i]||'Lens '+String(i+1).padStart(2,'0')).slice(0,120),
     authorDefined:true,clinicalClassification:false
   })));
 }
 function derive(source,mode,details){
   const raw=String(source===undefined?'':source);
   if(!raw)throw Error('Original source is required.');
   if(new TextEncoder().encode(raw).length>10*1024*1024)throw Error('Large source must be split.');
   const spec=MODES.find(m=>m.id===mode);
   if(!spec)throw Error('Unknown transformation.');
   const lines=raw.split(/\r\n|\n|\r/);
   let derived='';
   switch(mode){
    case 'identity':derived=raw;break;
    case 'reverse-characters':derived=Array.from(raw).reverse().join('');break;
    case 'reverse-lines':derived=lines.reverse().join('\n');break;
    case 'reverse-words':derived=(raw.match(/\S+/gu)||[]).reverse().join(' ');break;
    case 'az-forward':case 'az-reverse':{
      const rows=[];
      raw.split(/\r\n|\n|\r/).forEach((line,row)=>{
        Array.from(line).forEach((char,col)=>{
          const upper=char.toUpperCase(),idx='ABCDEFGHIJKLMNOPQRSTUVWXYZ'.indexOf(upper);
          if(idx>=0&&upper.length===1)rows.push({line:row+1,column:col+1,source:char,
            index:mode==='az-forward'?idx+1:26-idx,coordinate:'L'+(row+1)+'C'+(col+1)});
        });
      });
      derived=JSON.stringify({coordinateSystem:mode,characters:rows},null,2);break;
    }
    case 'word-grid':{
      const words=[];raw.split(/\r\n|\n|\r/).forEach((line,row)=>{
        (line.match(/\S+/gu)||[]).forEach((word,col)=>words.push({row:row+1,column:col+1,text:word}));
      });
      derived=JSON.stringify({gridType:'words',cells:words},null,2);break;
    }
    case 'acrostic':derived=lines.map(s=>s.trim()).filter(Boolean).map(s=>Array.from(s)[0]).join('');break;
    case 'telestich':derived=lines.map(s=>s.trim()).filter(Boolean).map(s=>Array.from(s).at(-1)).join('');break;
    case 'case-sound':derived=raw.toLocaleLowerCase();break;
    case 'binary-build':derived=JSON.stringify({build:'1+1=2',wholeState:1,derivative:'retained',originalUnchanged:true},null,2);break;
    case 'binary-clear':derived=JSON.stringify({clear:'1-1=0',wholeState:0,derivative:'rejected-without-source-deletion',originalUnchanged:true},null,2);break;
    case 'transport-plan':derived=JSON.stringify({stages:['create-source','prepare-fields','review-claims','review-rights','export-local','owner-transfer','observe-provider-receipt'],providerSubmitted:false,verified:false},null,2);break;
   }
   return Object.freeze({
     schema:'ttfes-btp.matrix-derivation.v1',
     createdAtUtc:new Date().toISOString(),mode:spec.id,
     plane:spec.plane,purpose:spec.purpose,
     original:{text:raw,preservedExactly:true},derived:{text:derived,independent:true},
     interpretation:'User-defined symbolic/linguistic transformation; not automatically a historical, linguistic, legal or scientific fact.',
     notes:String(details||'').slice(0,4000)
   });
 }
 function audit(){
   return {planes:PLANES.length,axes:AXES.length,stacks:STACKS.length,
     modes:MODES.length,lenses:createLenses().length,
     uniqueModes:new Set(MODES.map(x=>x.id)).size===MODES.length};
 }
 return Object.freeze({PLANES,AXES,STACKS,MODES,createLenses,derive,audit});
});