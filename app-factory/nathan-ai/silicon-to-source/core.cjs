/* Nathan AI — additive whole-number BUILD/CLEAR demonstration.
 * No custom CPU or firmware is implied. All mutations return new immutable snapshots.
 */
(function(root) {
  'use strict';
  const STATES=Object.freeze({CLEAR:0,PROTECT:1,BUILD:2});
  function assertWhole(n) {
    if(!Number.isSafeInteger(n) || n<0) throw new TypeError('A nonnegative safe integer is required');
    return n;
  }
  function build(one=1,other=1) { return assertWhole(one)+assertWhole(other); }
  function clear(one=1,other=1) {
    assertWhole(one);assertWhole(other);
    if(other>one) throw new RangeError('Cannot clear more than exists');
    return one-other;
  }
  function protectOne(snapshot,operation) {
    if(!snapshot || snapshot.ownerId==null || !Array.isArray(snapshot.records))
      throw new TypeError('Invalid snapshot');
    if(!operation || operation.ownerId!==snapshot.ownerId)
      throw new Error('Owner permission required');
    if(operation.kind==='BUILD') {
      if(!operation.record || typeof operation.record.id!=='string')
        throw new TypeError('A record ID is required');
      if(snapshot.records.some(r=>r.id===operation.record.id))
        throw new Error('Duplicate record ID');
      return {ownerId:snapshot.ownerId,records:[...snapshot.records,{...operation.record}]};
    }
    if(operation.kind==='CLEAR') {
      if(typeof operation.id!=='string')throw new TypeError('Record ID required');
      if(!snapshot.records.some(r=>r.id===operation.id))throw new Error('Record not found');
      return {ownerId:snapshot.ownerId,records:snapshot.records.filter(r=>r.id!==operation.id)};
    }
    throw new Error('Unknown operation');
  }
  const API=Object.freeze({STATES,build,clear,protectOne});
  if(typeof module!=='undefined' && module.exports) module.exports=API;
  else root.NathanAbsoluteCore=API;
})(typeof globalThis!=='undefined'?globalThis:this);
