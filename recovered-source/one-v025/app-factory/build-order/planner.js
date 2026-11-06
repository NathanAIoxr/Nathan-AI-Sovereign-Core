/* TABOR ROOT dependency planning engine.
 * Runs in browser and Node, offline. Records status, NEVER executes external actions.
 */
(function(root,factory){'use strict';const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.TaborBuildPlanner=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){'use strict';
const KNOWN=new Set(['public-prototype','private-package','not-built','blocked-approval','concept','catalog-only']);
function indexNodes(nodes){
 if(!Array.isArray(nodes))throw Error('Expected an array of dependency nodes');
 const index=new Map();
 for(const n of nodes){
  if(!n||typeof n.id!=='string'||!/^[a-z][a-z0-9-]*$/.test(n.id)||index.has(n.id))throw Error('Invalid or duplicate dependency ID: '+n?.id);
  if(!KNOWN.has(n.status)||!Number.isInteger(n.phase)||n.phase<0||!Array.isArray(n.dependsOn))throw Error('Invalid dependency attributes: '+n.id);
  if(new Set(n.dependsOn).size!==n.dependsOn.length)throw Error('Duplicate dependency: '+n.id);
  index.set(n.id,n);
 }
 for(const n of nodes)for(const d of n.dependsOn)if(!index.has(d)||d===n.id)throw Error('Missing or self dependency: '+n.id+' -> '+d);
 return index;
}
function ordered(nodes){
 const ix=indexNodes(nodes),ind=new Map(),adj=new Map();
 for(const n of nodes){ind.set(n.id,n.dependsOn.length);adj.set(n.id,[])}
 for(const n of nodes)for(const dep of n.dependsOn)adj.get(dep).push(n.id);
 const cmp=(a,b)=>ix.get(a).phase-ix.get(b).phase||a.localeCompare(b);
 let queue=nodes.filter(n=>ind.get(n.id)===0).map(n=>n.id).sort(cmp);const sorted=[];
 while(queue.length){
  const id=queue.shift();sorted.push(ix.get(id));
  for(const next of adj.get(id)){ind.set(next,ind.get(next)-1);if(ind.get(next)===0)queue.push(next)}
  queue.sort(cmp);
 }
 if(sorted.length!==nodes.length)throw Error('Circular dependency detected');
 return sorted;
}
function classify(n){if(n.status==='public-prototype')return 'reuse-public';if(n.status==='private-package')return 'import-and-verify';if(n.status==='blocked-approval')return 'owner-approval';if(n.status==='catalog-only')return 'keep-catalog';if(n.status==='concept')return 'specify-after-prerequisites';return 'implement-once'}
function prerequisites(nodes,id,includeSelf=false){
 const ix=indexNodes(nodes);if(!ix.has(id))throw Error('Unknown feature '+id);
 const seen=new Set();
 function visit(item){for(const d of ix.get(item).dependsOn)if(!seen.has(d)){seen.add(d);visit(d)}}
 visit(id);if(includeSelf)seen.add(id);
 return ordered(nodes).filter(n=>seen.has(n.id));
}
function plan(nodes){
 return ordered(nodes).map((n,i)=>({order:i+1,...n,actionClass:classify(n),blocking:n.dependsOn.filter(id=>{
 const dep=nodes.find(x=>x.id===id);
 return dep.status!=='public-prototype';
 }),reused:n.dependsOn.filter(id=>nodes.find(x=>x.id===id).status==='public-prototype')}));
}
function metrics(nodes){
 const p=plan(nodes);return {total:p.length,publicPrototypes:p.filter(n=>n.status==='public-prototype').length,privatePackages:p.filter(n=>n.status==='private-package').length,needsImplementation:p.filter(n=>n.status==='not-built').length,approvalGates:p.filter(n=>n.status==='blocked-approval').length,concepts:p.filter(n=>n.status==='concept').length,catalogOnly:p.filter(n=>n.status==='catalog-only').length};
}
function noRebuild(nodes,id){const ix=indexNodes(nodes),n=ix.get(id);if(!n)throw Error('Unknown feature');return {feature:n.title,status:n.status,decision:classify(n),evidence:n.evidence,prerequisites:prerequisites(nodes,id).map(x=>({id:x.id,status:x.status,action:classify(x)})),warning:'A referenced path is evidence of a source record, not proof of deployed production readiness.'}}
function validateManifest(data){if(!data||data.schema!=='tabor.build-order.v1')throw Error('Unsupported build manifest');const result=ordered(data.nodes);return {nodes:result.length,uniqueIds:true,acyclic:true,allDependenciesPresent:true};}
return Object.freeze({indexNodes,ordered,plan,metrics,prerequisites,noRebuild,validateManifest});
});