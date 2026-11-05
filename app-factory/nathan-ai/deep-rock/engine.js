/* NATHAN AI — Deep Rock Lab: inert, local defensive state simulator.
   No network, authentication action, file system, shell, exploit or service probe.
   A mathematical identity and a displayed title never authorize access.
*/
(function(root,factory){'use strict';const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.NathanDeepRock=factory();})(typeof globalThis!=='undefined'?globalThis:this,function(){'use strict';
 const SCHEMA='nathan-ai.deep-rock-convergence.v1';
 const GATES=[
  {id:'authorization',label:'Owner or researcher authorization recorded',help:'An explicit and verifiable owner approval is required. Creator claims or arithmetic are not credentials.'},
  {id:'isolation',label:'Offline laboratory boundaries maintained',help:'No live remote endpoints, third-party systems, packets, files or privileged control are accessed.'},
  {id:'provenance',label:'Source and archive provenance verified',help:'Original sources and real physical facts are distinguished from claims and simulated labels.'},
  {id:'integrity',label:'Local data integrity independently checked',help:'Source hash, stored copy and restoration hashes match in the local test design.'},
  {id:'recovery',label:'Rollback and recovery plan reviewed',help:'A local test fixture can be restored without modifying real services.'},
  {id:'audit',label:'A non-destructive evidence record kept',help:'Document what mock flags were tested, never assert a real breach or live containment.'}
 ];
 function validate(data){
  if(!data||data.schema!==SCHEMA||!Array.isArray(data.dossiers)||data.dossiers.length!==2||!Array.isArray(data.scenarios)||data.scenarios.length!==28||!Array.isArray(data.phases)||data.phases.length!==2)throw Error('Incomplete Deep Rock source record');
  if(data.dossiers[0].id!=='70.1'||data.dossiers[1].id!=='70.2')throw Error('Original dossier numbering changed');
  for(let i=0;i<28;i++){
   const s=data.scenarios[i];
   if(!s||s.number!==i+1||s.phase!==(i<20?'I':'II')||typeof s.name!=='string'||!s.name.trim()||
       s.execution!=='not-run-no-real-target'||!s.objective||!s.requiredBoundary)throw Error('Missing or misrepresented scenario '+(i+1));
  }
  if(data.phases[1].availableThrough!==28||!data.phases[1].note.includes('not invented'))throw Error('Source cutoff must be explicit');
  if(!data.observations.some(x=>x.includes('No verified cryogenic facility')))throw Error('Missing fact/evidence boundary');
  return {dossiers:2,scenarios:28,networkActions:0,verifiedExternalAccess:0};
 }
 function blankState(){return Object.fromEntries(GATES.map(x=>[x.id,false]));}
 function assess(state){
  const s=state||{},rows=GATES.map(g=>({...g,passed:s[g.id]===true}));
  const passed=rows.filter(x=>x.passed).length;
  return {mode:'synthetic-defensive-readiness-only',passes:passed,total:GATES.length,
   label:passed===GATES.length?'Mock review gates marked complete (NOT an independently verified release)':'Defensive readiness gaps remain',
   nonExecuting:true,realRemoteAccess:false,actualAuthorizationEstablished:false,
   results:rows,warning:'Inputs are self-reported test flags. Never use a simulated pass to infer permission, external access, network isolation or operational success.'};
 }
 function select(data,q,phase){
  validate(data);const needle=String(q||'').trim().toLocaleLowerCase();
  return data.scenarios.filter(x=>(!phase||phase==='all'||x.phase===phase)&&
    (!needle||[x.name,x.objective,String(x.number)].join(' ').toLocaleLowerCase().includes(needle)));
 }
 return Object.freeze({SCHEMA,GATES,validate,blankState,assess,select});
});
