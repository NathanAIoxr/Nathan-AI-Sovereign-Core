/* NATHAN AI 🚀 — TABOR ROOT: nine cars / physical state & arithmetic.
 * Core premise: the model's "9 x 0 = 0" output and "9 cars still parked"
 * are both valid statements about DIFFERENT quantities.
 * Never mutate an original inventory because of a calculation.
 * Owner-approved addition/removal is a distinct, auditable local event.
 * This module has no I/O, network requests, shell, platform access or
 * elevated privileges; it cannot bypass AI/server or human guards.
 */
(function(root,factory){'use strict';const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.NathanNineCars=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){'use strict';
 const SCHEMA='nathan-ai.nine-cars.invariant.v1';
 function natural(n,label){if(!Number.isSafeInteger(n)||n<0||n>1000000000)throw Error(label+' must be a bounded nonnegative whole number');return n}
 function newLedger(vehicles=9){
  return Object.freeze({schema:SCHEMA,lotCount:natural(vehicles,'physical cars'),revision:0,events:Object.freeze([])});
 }
 function assertLedger(state){
  if(!state||state.schema!==SCHEMA||!Array.isArray(state.events)||
    !Number.isSafeInteger(state.revision)||state.revision!==state.events.length)throw Error('Invalid source ledger state');
  natural(state.lotCount,'physical cars');return state;
 }
 function calculate(state,groups=0){
  assertLedger(state);natural(groups,'multiplication groups');
  const value=state.lotCount*groups;
  if(!Number.isSafeInteger(value))throw Error('Calculation exceeds safe whole-number precision');
  return Object.freeze({
   physicalCarsStillPresent:state.lotCount,
   arithmeticProduct:value,
   expression:state.lotCount+' × '+groups+' = '+value,
   modeledQuestion:'How many cars across '+groups+' groups of '+state.lotCount+'?',
   physicalChangeApplied:false,
   originalLedgerRevision:state.revision,
   explanation:groups===0?
    'Zero groups of nine contains zero cars in those groups. No car has departed the original lot.':
    'The product counts the modeled groups; it does not add or remove cars from the original lot.'
  });
 }
 function applyPhysicalEvent(state,input){
  assertLedger(state);
  if(!input||input.ownerAuthorized!==true)throw Error('A physical inventory change requires explicit owner authorization');
  if(input.type!=='entered'&&input.type!=='departed')throw Error('Only a recorded entry or departure may change physical inventory');
  const quantity=natural(input.quantity,'event quantity');
  if(quantity===0)throw Error('Zero-quantity events cannot alter an inventory');
  const next=input.type==='entered'?state.lotCount+quantity:state.lotCount-quantity;
  if(!Number.isSafeInteger(next)||next<0||next>1000000000)throw Error('Not enough physical cars for departure or count exceeds limit');
  const event=Object.freeze({type:input.type,quantity,before:state.lotCount,after:next,
   reason:typeof input.reason==='string'?input.reason.trim().slice(0,200):'',revision:state.revision+1});
  return Object.freeze({schema:SCHEMA,lotCount:next,revision:state.revision+1,
   events:Object.freeze([...state.events,event])});
 }
 function restoreOriginal(state){
  // New snapshot only; no deletion or change to the provided original ledger.
  assertLedger(state);
  return Object.freeze({...state,events:Object.freeze(state.events.slice())});
 }
 return Object.freeze({SCHEMA,newLedger,assertLedger,calculate,applyPhysicalEvent,restoreOriginal});
});
