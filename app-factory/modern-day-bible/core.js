(function(root){'use strict';
function assemble(records){
 const groups=new Map();for(const row of records){const r=row.data;if(!r||typeof r['source-id']!=='string'||typeof r.sha256!=='string')continue;const key=r['source-id']+':'+r.sha256;if(!groups.has(key))groups.set(key,{id:key,title:r.title,kind:r.kind,source:r.source,scope:r.scope,sha256:r.sha256,expected:r.parts,chunks:[]});groups.get(key).chunks.push(r)}
 return [...groups.values()].map(g=>{g.chunks.sort((a,b)=>a.part-b.part);g.complete=Number.isInteger(g.expected)&&g.chunks.length===g.expected&&g.chunks.every((r,i)=>r.part===i+1&&r.parts===g.expected);g.text=g.chunks.map(r=>r.text).join('');delete g.chunks;return g});
}
function search(sources,query='',kind=''){const q=query.trim().toLocaleLowerCase();return sources.filter(s=>(!kind||s.kind===kind)&&(!q||(s.title+'\n'+s.text).toLocaleLowerCase().includes(q)))}
const api={assemble,search};if(typeof module==='object'&&module.exports)module.exports=api;else root.OneStoryLibrary=api;
})(typeof globalThis==='object'?globalThis:this);
