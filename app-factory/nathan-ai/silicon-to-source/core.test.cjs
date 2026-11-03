const test=require('node:test');
const assert=require('node:assert/strict');
const C=require('./core.cjs');
test('whole arithmetic',()=>{assert.equal(C.build(1,1),2);assert.equal(C.clear(1,1),0);assert.equal(C.STATES.PROTECT,1)});
test('invalid arithmetic fails closed',()=>{assert.throws(()=>C.build(-1,1));assert.throws(()=>C.clear(1,2));assert.throws(()=>C.build(0.2,1))});
test('owner approval and source preservation',()=>{
 const before={ownerId:'owner',records:[{id:'original',text:'verbatim'}]};
 assert.throws(()=>C.protectOne(before,{kind:'CLEAR',ownerId:'other',id:'original'}));
 const withNew=C.protectOne(before,{kind:'BUILD',ownerId:'owner',record:{id:'new',text:'additional'}});
 assert.equal(before.records.length,1);
 assert.equal(withNew.records.length,2);
 const after=C.protectOne(withNew,{kind:'CLEAR',ownerId:'owner',id:'new'});
 assert.deepEqual(after,before);
});
