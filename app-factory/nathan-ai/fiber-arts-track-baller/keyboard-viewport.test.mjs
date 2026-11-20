import test from 'node:test';
import assert from 'node:assert/strict';
import { keyboardViewportFrame } from './keyboard-viewport.mjs';
const base = Object.freeze({ zoom: 1, panX: 0, panY: 0, orientation: Object.freeze([1,0,0,0]) });
test('arrow keys pan without changing source or quaternion', () => {
  const frame = keyboardViewportFrame(base, 'ArrowRight');
  assert.equal(frame.panX, 16); assert.deepEqual(frame.orientation, [1,0,0,0]); assert.equal(base.panX, 0);
  assert.equal(Object.isFrozen(frame.orientation), true);
});
test('zoom keys respect bounds', () => {
  assert.equal(keyboardViewportFrame(base, '+', { maxZoom: 1.05 }).zoom, 1.05);
  assert.equal(keyboardViewportFrame(base, '-', { minZoom: 0.95 }).zoom, 0.95);
});
test('reduced motion limits both pan and zoom', () => {
  assert.equal(keyboardViewportFrame(base, 'ArrowUp', { reducedMotion: true }).panY, -4);
  assert.equal(keyboardViewportFrame(base, '+', { reducedMotion: true }).zoom, 1.02);
});
test('unrecognized key is safe no-op', () => {
  const frame = keyboardViewportFrame(base, 'Enter');
  assert.equal(frame.handled, false); assert.equal(frame.zoom, 1);
});
test('invalid state and settings are rejected', () => {
  assert.throws(() => keyboardViewportFrame({ ...base, zoom: 0 }, '+'), TypeError);
  assert.throws(() => keyboardViewportFrame(base, '+', { reducedMotion: 'yes' }), TypeError);
  assert.throws(() => keyboardViewportFrame(base, '+', { zoomRatio: 1 }), TypeError);
});
