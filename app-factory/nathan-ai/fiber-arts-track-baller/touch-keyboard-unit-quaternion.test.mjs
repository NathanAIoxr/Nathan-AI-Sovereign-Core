import test from 'node:test';
import assert from 'node:assert/strict';
import { bridgeTouchToKeyboard } from './touch-keyboard-viewport-bridge.mjs';
function fixture(initial, options) {
  let frame = { orientation: initial, zoom: 1 };
  const emitted = [];
  const controller = {
    getFrame: () => frame,
    syncFrame(next) { frame = { ...next }; return true; }
  };
  return { bridge: bridgeTouchToKeyboard(controller, next => emitted.push(next), options), emitted };
}
test('strict mode suppresses sign-equivalent unit quaternion', () => {
  const { bridge, emitted } = fixture([1,0,0,0], {suppressUnchanged:true, requireUnitQuaternion:true});
  assert.equal(bridge.onTouchFrame({orientation:[-1,0,0,0],zoom:1}), true);
  assert.equal(emitted.length, 0);
});
test('strict mode does not coalesce identical nonunit orientations', () => {
  const { bridge, emitted } = fixture([2,0,0,0], {suppressUnchanged:true, requireUnitQuaternion:true});
  bridge.onTouchFrame({orientation:[2,0,0,0],zoom:1});
  assert.equal(emitted.length, 1);
});
test('strict mode does not coalesce opposite nonunit orientations', () => {
  const { bridge, emitted } = fixture([2,0,0,0], {suppressUnchanged:true, requireUnitQuaternion:true});
  bridge.onTouchFrame({orientation:[-2,0,0,0],zoom:1});
  assert.equal(emitted.length, 1);
});
test('legacy default still coalesces opposite nonunit values', () => {
  const { bridge, emitted } = fixture([2,0,0,0], {suppressUnchanged:true});
  bridge.onTouchFrame({orientation:[-2,0,0,0],zoom:1});
  assert.equal(emitted.length, 0);
});
test('strict option rejects invalid type', () => {
  assert.throws(() => bridgeTouchToKeyboard({syncFrame(){},getFrame(){}},()=>{}, {requireUnitQuaternion:'yes'}), TypeError);
});
