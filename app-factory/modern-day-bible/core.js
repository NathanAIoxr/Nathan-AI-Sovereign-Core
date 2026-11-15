(function(root){'use strict';
function assemble(records){
 const groups=new Map();for(const row of records){const r=row.data;if(!r||typeof r['source-id']!=='string'||typeof r.sha256!=='string')continue;const key=r['source-id']+':'+r.sha256;if(!groups.has(key))groups.set(key,{id:key,sourceId:r['source-id'],title:r.title,number:/^mdb-\d+$/.test(r['source-id'])?Number(r['source-id'].slice(4)):null,indexSequence:/^tabor-kin-\d+$/.test(r['source-id'])?Number(r['source-id'].slice(10)):null,kind:r.kind,source:r.source,scope:r.scope,sha256:r.sha256,expected:r.parts,chunks:[]});groups.get(key).chunks.push(r)}
 return [...groups.values()].map(g=>{g.chunks.sort((a,b)=>a.part-b.part);g.complete=Number.isInteger(g.expected)&&g.chunks.length===g.expected&&g.chunks.every((r,i)=>r.part===i+1&&r.parts===g.expected);g.text=g.chunks.map(r=>r.text).join('');delete g.chunks;return g}).sort((a,b)=>(a.number??(a.indexSequence?100000+a.indexSequence:999999))-(b.number??(b.indexSequence?100000+b.indexSequence:999999))||a.title.localeCompare(b.title));
}
function search(sources,query='',kind=''){
 const q=query.trim().toLocaleLowerCase();
 const matches=sources.filter(s=>(!kind||(kind==='timeline'?s.timeline:s.kind===kind))&&(!q||[s.title,s.text,s.timeline?.date,s.timeline?.track,s.timeline?.evidence].join('\n').toLocaleLowerCase().includes(q)));
 return kind==='timeline'?matches.sort((a,b)=>(a.timeline.date||'').localeCompare(b.timeline.date||'')||(a.timeline.publishedAtUtc||'').localeCompare(b.timeline.publishedAtUtc||'')):matches;
}
const api={assemble,search};if(typeof module==='object'&&module.exports)module.exports=api;else root.OneStoryLibrary=api;
})(typeof globalThis==='object'?globalThis:this);
