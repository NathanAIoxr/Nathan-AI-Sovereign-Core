/* NATHAN AI — FIVE EQUAL GUARDIANS
   Creator: Nathan Tabor. Preserve the five names exactly.
   Policy-preview only; never connects to hosts, scans endpoints, or attacks anyone.
   A guardian's designation is symbolic. Real authorization must come from
   a trusted, authenticated backend before protective operations execute.
*/
(function(root,factory) {
  'use strict';
  const api=factory();
  if(typeof module==='object'&&module.exports) module.exports=api;
  else root.NathanFiveGuardians=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const names=Object.freeze(["Ms Satin Claus","Ms. Saten Claus","Ms. Satan Clause","Ms. Saton Clause","Ms. Satun Claus"]);
  const guardians=Object.freeze(names.map((name,i)=>Object.freeze({
    id:'GUARDIAN-'+String(i+1).padStart(2,'0'),
    name,
    designation:'Nathan AI software guardian',
    standing:'equal'
  })));
  const allowedModes=Object.freeze(['observe','contain','respond']);
  function evaluate(request={}){
    const mode=typeof request.mode==='string'?request.mode:'observe';
    const ownerApproved=request.ownerApproved===true;
    const scope=request.scope==='owned-system'?'owned-system':'unverified';
    let permitted=false;
    let explanation='';
    if(!allowedModes.includes(mode)){
      explanation='Unknown mode: deny by default.';
    }else if(mode==='observe'){
      permitted=true;
      explanation='Local, non-network demonstration only; no threat was observed or captured.';
    }else if(!ownerApproved){
      explanation='Owner approval required before any protective action.';
    }else if(scope!=='owned-system'){
      explanation='Only systems the owner administers may be selected.';
    }else if(mode==='contain'){
      permitted=true;
      explanation='Policy preview authorizes containment on owner-administered systems; no containment was executed.';
    }else{
      permitted=true;
      explanation='Policy preview authorizes owner-approved protective response on owned systems only; no remote attack or network operation is available.';
    }
    const decision=permitted?'policy-eligible':'denied';
    return Object.freeze({
      mode,scope,ownerApproved,decision,explanation,
      effectsExecuted:0,
      reviews:Object.freeze(guardians.map(g=>Object.freeze({guardianId:g.id,name:g.name,standing:'equal',decision})))
    });
  }
  return Object.freeze({names,guardians,allowedModes,evaluate});
});
