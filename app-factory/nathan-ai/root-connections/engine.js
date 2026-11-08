(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.NathanConnections=factory();})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 function load(input){
  const data=input&&input.cross_connections||input;
  if(!data||!Array.isArray(data.nodes)||!Array.isArray(data.edges))throw Error('Choose a Nathan Root Codex or graph JSON containing nodes and edges.');
  if(data.nodes.length>20000||data.edges.length>100000)throw Error('Graph exceeds this viewer’s size limit.');
  const nodes=new Map(),adj=new Map();
  for(const n of data.nodes){if(!n||typeof n.id!=='string'||!n.id||nodes.has(n.id))throw Error('Missing or duplicate node ID.');nodes.set(n.id,n);adj.set(n.id,[]);}
  const edges=data.edges.map((e,index)=>{const source=e.source||e.from,target=e.target||e.to;if(!nodes.has(source)||!nodes.has(target))throw Error('Connection has a missing endpoint.');const edge={...e,source,target,index};adj.get(source).push({id:target,edge,direction:'out'});adj.get(target).push({id:source,edge,direction:'in'});return edge;});
  return {nodes,edges,adj};
 }
 function search(graph,text){const q=String(text).normalize('NFC').toLocaleLowerCase();return [...graph.nodes.values()].filter(n=>[n.id,n.label||n.name,n.kind,n.source].join(' ').normalize('NFC').toLocaleLowerCase().includes(q));}
 function neighbors(graph,id){return graph.adj.get(id)||[];}
 function path(graph,start,end,options={}){
  if(!graph.nodes.has(start)||!graph.nodes.has(end))throw Error('Select two existing nodes.');
  const previous=new Map([[start,null]]),queue=[start];
  for(let i=0;i<queue.length;i++){const id=queue[i];if(id===end){const route=[];for(let p=end;p!==null;p=previous.get(p)?.parent??null)route.push({id:p,via:previous.get(p)?.edge||null});return route.reverse();}for(const next of neighbors(graph,id)){if(!options.includeInventory&&['indexed_in_source','source_part_of_system'].includes(next.edge.relation))continue;if(!previous.has(next.id)){previous.set(next.id,{parent:id,edge:next.edge});queue.push(next.id);}}}
  return null;
 }
 return Object.freeze({load,search,neighbors,path});
});
