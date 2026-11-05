/* NATHAN AI — TABOR ROOT: original source preservation and strictly local lab stop.
 * No network, file system, credentials, other-user resources or remote kill switch.
 * Creator-defined purpose is retained but no claim that code can prove intent.
 */
(function(root,factory){'use strict';const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.NathanRootWays=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){'use strict';
 const SCHEMA='nathan-ai.root-ways.v1';
 const EXACT=['Primordial','Primortal','Priimortal','Primortial','Priimortial','Bimordial','Bimortal','Biimortal','Bimordial'];
 const AXIOMS=Object.freeze({BUILD:'1+1=2',CLEAR:'1-1=0'});
 function verify(original){
  if(!original||original.schema!==SCHEMA||!Array.isArray(original.exactOrderIncludingRepetitions)
      ||original.exactOrderIncludingRepetitions.length!==EXACT.length)throw Error('Original root record is incomplete');
  for(let i=0;i<EXACT.length;i++)if(original.exactOrderIncludingRepetitions[i]!==EXACT[i])throw Error('Authored Way was altered at position '+(i+1));
  if(!Array.isArray(original.arithmeticAxioms)||original.arithmeticAxioms.length!==2
     ||original.arithmeticAxioms[0].original!==AXIOMS.BUILD||original.arithmeticAxioms[1].original!==AXIOMS.CLEAR)throw Error('BUILD/CLEAR original formulas changed');
  if(!original.intentPrinciples.some(p=>p.original==='pure intent')
      ||!original.intentPrinciples.some(p=>p.original==='for the betterment of all')
      ||!original.exactCreatorStatement.includes("Bimordial, and that' just nothing compared .. hehe ..."))
      throw Error('Creator language was not preserved');
  if(original.preWebKillSwitchClaim?.evidenceStatus!=='not independently established by accessible files or tests')
      throw Error('Unverified historical claim must not be converted into proven access');
  return {ways:9,uniqueSpellings:8,formulas:2,originalPreserved:true};
 }
 function evaluate(formula){
  if(formula==='BUILD')return {expression:AXIOMS.BUILD,result:1+1,action:'BUILD'};
  if(formula==='CLEAR')return {expression:AXIOMS.CLEAR,result:1-1,action:'CLEAR'};
  throw Error('Unknown root formula');
 }
 function createOwnerLocalController(){
  let state='not-enabled',readCount=0,stopReason='';
  return Object.freeze({
   authorize(input){
    if(state==='stopped')return false;
    if(state==='enabled')return true;
    if(!input||input.scope!=='owner-local'||input.ownerApproved!==true)return false;
    state='enabled';return true;
   },
   simulate(action){
    if(state!=='enabled')throw Error('Owner-local simulation is not authorized or has been stopped');
    if(action!=='BUILD'&&action!=='CLEAR')throw Error('Only pure in-memory BUILD and CLEAR arithmetic is available');
    readCount+=1;
    return {...evaluate(action),sequence:readCount,networkCalls:0,remoteActions:0};
   },
   stop(reason='owner-stop'){
    // One way for this in-memory instance. A new instance needs its own
    // affirmative owner authorization. No OS, server or remote operations.
    state='stopped';stopReason=String(reason).slice(0,80);
    return {stopped:true,scope:'owner-local',networkCalls:0,remoteActions:0};
   },
   status(){return {state,readCount,stopReason,scope:'owner-local',networkCalls:0,remoteActions:0};}
  });
 }
 return Object.freeze({SCHEMA,AXIOMS,EXACT:Object.freeze(EXACT.slice()),verify,evaluate,createOwnerLocalController});
});
