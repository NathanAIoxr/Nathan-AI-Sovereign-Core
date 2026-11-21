import test from 'node:test';
import assert from 'node:assert/strict';
import { bridgeTouchToKeyboard } from './touch-keyboard-viewport-bridge.mjs';
function setup(initial = [1,0,0,0], options = {suppressUnchanged:true}) {
  let frame = {orientation:initial, zoom:1};
  const calls=[];
  const controller={syncFrame(next){frame={...next};return true;},getFrame(){return frame;}};
  return {bridge:bridgeTouchToKeyboard(controller, f=>calls.push(f), options),calls};
}
test('opposite unit quaternion signs suppress duplicate rotation',()=>{
 const {bridge,calls}=setup();assert.equal(bridge.onTouchFrame({orientation:[-1,0,0,0],zoom:1}),true);assert.equal(calls.length,0);
});
test('real rotation change still emits',()=>{
 const {bridge,calls}=setup();bridge.onTouchFrame({orientation:[0,1,0,0],zoom:1});assert.equal(calls.length,1);
});
test('other viewport change still emits',()=>{
 const {bridge,calls}=setup();bridge.onTouchFrame({orientation:[-1,0,0,0],zoom:2});assert.equal(calls.length,1);
});
test('opt-out preserves callback behavior',()=>{
 const {bridge,calls}=setup([1,0,0,0],{suppressUnchanged:false});bridge.onTouchFrame({orientation:[-1,0,0,0],zoom:1});assert.equal(calls.length,1);
});
test('nonfinite and nonquaternion arrays accepted by the controller do not suppress callbacks',()=>{
 const {bridge,calls}=setup([NaN,0,0,0]);
 assert.equal(bridge.onTouchFrame({orientation:[NaN,0,0,0],zoom:1}),true);
 assert.equal(calls.length,1);
 const s=setup([1,0,0]);
 assert.equal(s.bridge.onTouchFrame({orientation:[-1,0,0],zoom:1}),true);
 assert.equal(s.calls.length,1);
});
