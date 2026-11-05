/* Nathan AI · Snow Family Field deterministic browser engine · no remote model */
(function(root,factory){
  'use strict';
  const data=typeof module==='object'&&module.exports?require('./data.js'):root.NathanSnowFieldData;
  const api=factory(data);
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.NathanSnowField=api;
})(typeof globalThis==='object'?globalThis:this,function(d){
  'use strict';
  const tokens=s=>(String(s||'').normalize('NFKC').toLowerCase().match(/[\p{L}\p{N}+-]+/gu)||[]).filter(x=>x.length>1);
  function search(query,limit=6){
    const q=tokens(query);if(!q.length)return [];
    return d.sources.map((s,i)=>{
      const title=(s.title+' '+s.id+' '+s.topics.join(' ')).toLowerCase();
      const body=(s.body+' '+s.detail+' '+s.type).toLowerCase();
      return {...s,score:q.reduce((sum,t)=>sum+(title.includes(t)?5:0)+(body.includes(t)?2:0),0),i};
    }).filter(s=>s.score>0).sort((a,b)=>b.score-a.score||a.i-b.i).slice(0,Math.max(1,Math.min(12,limit)));
  }
  function answer(query){
    const q=String(query||'').trim();
    if(!q)return {text:'Ask about the Snow Family, Babel, the equator, Dante, the 1380 illustration, scripture, the 4×6 matrix or the book series.',sources:[],kind:'local guide'};
    const found=search(q);
    if(!found.length)return {text:'No matching record in the bundled source register. Try a name, verse, matrix level or a specific artifact. This offline guide does not invent citations or use a live language model.',sources:[],kind:'local source search'};
    const best=found.slice(0,3);
    const s=best[0];
    const text='Source: '+s.title+' ['+s.type+']\n\n'+s.body+'\n\n'+s.detail+'\n\nCompare '+best.length+' matching source record'+(best.length===1?'':'s')+' below. Original story, scripture, artifact and interpretation are independently labeled.';
    return {text,sources:best,kind:'local source search · not a live model'};
  }
  function level(n){
    const id=String(n);if(!d.north.includes(id)&&!d.south.includes(id)&&id!=='0')return null;
    const category=id==='0'?'CENTER / EQUATOR / VOID':id.startsWith('+')?'ABOVE / NORTH · BABEL':'BELOW / SOUTH · INVERTED INFERNO';
    return {id,category,description:id==='0'?'Level zero: the creator-defined middle and conceptual boundary.':id.startsWith('+')?'North level '+id+' in the prescribed +9 through +1 order.':'South level '+id+' in the prescribed -9 through -1 order.',status:'creator symbolic cosmology · not a surveyed physical Earth layer'};
  }
  function xor(a,b){return [...a].map((x,i)=>String(Number(x)!==Number(b[i])?1:0)).join('')}
  function simulate(input='101100'){
    if(!/^[01]{6}$/.test(input))throw Error('Enter exactly six binary digits (0 or 1).');
    let state=input;const steps=[];
    for(const row of d.rows){const before=state;state=xor(state,row.mask);
      steps.push({row:row.name,operators:row.operators,mask:row.mask,before,after:state,channels:d.channels.map((name,i)=>({name,value:Number(state[i])}))});
    }
    // A second pass through the same XOR masks cancels the first: explicit cycle.
    let next=state;for(const row of d.rows)next=xor(next,row.mask);
    return {input,steps,loopState:state,returnState:next,cycleLength:next===input?2:null,release:input,releaseLabel:'Matrix 9 · ONE / original input preserved'};
  }
  function quest(id,choice){
    const q=d.quests.find(v=>v.id===id);if(!q)throw Error('Unknown quest');
    if(!Number.isInteger(choice)||choice<0||choice>=q.options.length)throw Error('Invalid choice');
    return {correct:choice===q.correct,explain:q.explain,source:d.sources.find(s=>s.id===q.source)};
  }
  function chapter(volumeId,index){
    const v=d.volumes.find(x=>x.id===volumeId);
    if(!v||!Number.isInteger(index)||index<0||index>=v.chapters.length)throw Error('Unknown chapter');
    const title=v.chapters[index],number=index+1;
    const scene=d.sceneNotes[volumeId][index];
    return {volume:v,number,title,excerpt:title+'.\n\n'+scene+'\n\nEvidence practice: Mark what the source directly records, what is interpretation, and what belongs to the creator’s story. Keep every original intact.',status:'unique original scene preview · not a full completed novel'};
  }
  function exportBooks(){
    const lines=['# NATHAN AI · SNOW FAMILY · THE BOOK OF LIGHTS','# 3-volume / 39-chapter story preview series','', 'Original chapter scenes and book-development scaffold. Existing creator manuscripts remain unchanged.',''];
    for(const v of d.volumes){
      lines.push('## '+v.title,'*'+v.subtitle+'*','');
      v.chapters.forEach((c,i)=>{const ch=chapter(v.id,i);lines.push('### Chapter '+ch.number+' · '+c,'',ch.excerpt,'')});
    }
    lines.push('## Source boundaries','The 1380 title is creator-authored. The identified manuscript is catalogued circa 1390. Dante is literature; the 19-level architecture is a creator symbolic model.','', '1+1=2 BUILD · 1-1=0 CLEAR');
    return lines.join('\n');
  }
  function exportLedger(){
    return JSON.stringify({schema:d.id,date:'2026-11-05',levels:{north:d.north,center:d.center,south:d.south},operators:d.operators,channels:d.channels,rows:d.rows,sources:d.sources,volumes:d.volumes,quests:d.quests},null,2);
  }
  return Object.freeze({data:d,tokens,search,answer,level,simulate,quest,chapter,exportBooks,exportLedger});
});