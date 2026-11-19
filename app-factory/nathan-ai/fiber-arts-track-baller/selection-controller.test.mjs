import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveStrandInteraction } from './selection-controller.mjs';
const strands = [{id:'warp-1',points:[{x:0,y:0},{x:20,y:0}]},{id:'weft-2',points:[{x:0,y:10},{x:20,y:10}]}];
test('nearest strand returns selection and accessible description',()=>{
  assert.deepEqual(resolveStrandInteraction(strands,{x:8,y:9},{radius:3}),{selectedStrandId:'weft-2',announcement:'Selected strand weft-2',distance:1});
});
test('no hit returns neutral announcement',()=>{
  assert.deepEqual(resolveStrandInteraction(strands,{x:100,y:100},{radius:2}),{selectedStrandId:null,announcement:'No strand selected',distance:null});
});
test('invalid touch coordinates are rejected',()=>{
  assert.throws(()=>resolveStrandInteraction(strands,{x:NaN,y:0}),TypeError);
});
test('does not mutate craft strand data',()=>{
  const before=JSON.stringify(strands);resolveStrandInteraction(strands,{x:0,y:0});assert.equal(JSON.stringify(strands),before);
});
