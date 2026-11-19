import test from 'node:test';
import assert from 'node:assert/strict';
import {selectStrand} from './strand-selection.mjs';
const strands=[{id:'warp',points:[{x:0,y:0},{x:100,y:0}]},{id:'weft',points:[{x:50,y:20},{x:50,y:100}]}];
test('selects nearest polyline segment',()=>assert.equal(selectStrand(strands,{x:51,y:30})?.id,'weft'));
test('returns null outside hit radius',()=>assert.equal(selectStrand(strands,{x:200,y:200}),null));
test('handles empty or malformed strands without mutation',()=>{assert.equal(selectStrand([{id:'bad',points:[{x:NaN,y:0}]}],{x:0,y:0}),null);assert.equal(strands.length,2)});
test('rejects invalid radius and pointer',()=>{assert.throws(()=>selectStrand(strands,{x:NaN,y:0}),TypeError);assert.throws(()=>selectStrand(strands,{x:0,y:0},{radius:-1}),RangeError)});
test('ties select first strand deterministically',()=>assert.equal(selectStrand([{id:'a',points:[{x:0,y:0}]},{id:'b',points:[{x:0,y:0}]}],{x:0,y:0})?.id,'a'));
