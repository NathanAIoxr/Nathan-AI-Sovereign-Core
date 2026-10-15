/* Root Field Merge — non-destructive, explicit multi-pack graft. */
(function(root,factory){'use strict';const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.RootFieldMerge=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const LINKS=[
 ['field:metric','uct:warp','Quadratic metric example compared against speculative continuum geometry'],
 ['field:clock','continuum:gate-clock-bender','Special-relativistic clock math appears independently in both packs'],
 ['field:render','continuum:gate-eye-budget','Visible-cell workload is a software cost proxy'],
 ['field:pinch','uct:plasma','Ideal pinch equilibrium compared with the broader plasma family'],
 ['field:cutoff','uct:shield','Ideal wave cutoff compared with fictional hull field models'],
 ['field:hover','uct:repulsor','Classical weight balance compared with speculative lift narratives'],
 ['field:erasure','uct:machine','Irreversible information erasure is not biological power generation'],
 ['field:anomaly','continuum:family-paradox','Independent statistical gate used for synthetic telemetry'],
 ['field:nerve','continuum:family-mind','Analog membrane equation and information models are not direct biological control'],
 ['field:identity','continuum:family-paradox','Cryptographic integrity does not imply authorization']
];
function install(R,F,U,C,state){
 if(!state||!R||!F||!U||!C||state.schema!==R.SCHEMA)throw Error('All four local engines and valid Root state are required');
 const original=state, f=F.install(R,original),u=U.install(R,f.state),c=C.graft(u.state,R);
 let s=c.state,links=0,conflicts=f.conflicts.concat(u.conflicts);
 for(const [from,to,note] of LINKS){
  if(!s.nodes.some(n=>n.id===from)||!s.nodes.some(n=>n.id===to)){conflicts.push('Missing comparison: '+from+' → '+to);continue}
  if(s.edges.some(e=>e.from===from&&e.to===to&&e.type==='symbolic'))continue;
  const res=R.attach(s,{from,to,type:'symbolic',note:'Independent comparison only. '+note});
  if(res.ok){s=res.state;links++}else conflicts.push(from+' → '+to+': '+res.why);
 }
 return {state:s,added:f.added+u.addedNodes+c.added,linked:f.linked+u.addedEdges+c.attached+links,
  crosslinks:links,conflicts,roots:['field:sovereign','uct:continuum','continuum:root']};
}
return Object.freeze({LINKS,install});
});