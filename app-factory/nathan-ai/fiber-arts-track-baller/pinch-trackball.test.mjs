import test from 'node:test';
import assert from 'node:assert/strict';
import { applyPinchTrackball } from './pinch-trackball.mjs';
const p = [{x:-1,y:0},{x:1,y:0}];
test('identity gesture preserves orientation and scale', () => {
  const r = applyPinchTrackball([1,0,0,0], p, p);
  assert.deepEqual(r.orientation, [1,0,0,0]);
  assert.equal(r.scale,1); assert.equal(r.rotation,0); assert.equal(r.simulated,true);
});
test('quarter turn composes normalized quaternion', () => {
  const r = applyPinchTrackball([1,0,0,0], p, [{x:0,y:-1},{x:0,y:1}]);
  assert.ok(Math.abs(r.orientation[0]-Math.SQRT1_2)<1e-12);
  assert.ok(Math.abs(r.orientation[3]-Math.SQRT1_2)<1e-12);
});
test('pinch zoom and pan do not alter orientation', () => {
  const r = applyPinchTrackball([1,0,0,0],p,[{x:-2,y:3},{x:2,y:3}]);
  assert.equal(r.scale,2); assert.equal(r.panY,3); assert.deepEqual(r.orientation,[1,0,0,0]);
});
test('degenerate gesture does not rotate', () => {
  const r = applyPinchTrackball([1,0,0,0],p,[{x:0,y:0},{x:0,y:0}]);
  assert.equal(r.valid,false); assert.deepEqual(r.orientation,[1,0,0,0]);
});
test('rejects invalid input without mutation', () => {
  const q=[1,0,0,0], a=p.map(x=>({...x}));
  assert.throws(()=>applyPinchTrackball(q,p,[{x:NaN,y:0},{x:1,y:0}]),TypeError);
  assert.deepEqual(q,[1,0,0,0]); assert.deepEqual(p,a);
});
