import test from 'node:test';
import assert from 'node:assert/strict';
import { applyAccessiblePinchFrame } from './pinch-accessible-frame.mjs';
const p = [{ x: -1, y: 0 }, { x: 1, y: 0 }];
const before = Object.freeze({ zoom: 1, panX: 0, panY: 0, orientation: Object.freeze([1, 0, 0, 0]) });
test('default pinch composes zoom and translation without modifying source', () => {
  const result = applyAccessiblePinchFrame(before, p, [{ x: -2, y: 3 }, { x: 2, y: 3 }]);
  assert.equal(result.zoom, 2); assert.equal(result.panY, 3);
  assert.equal(result.reducedMotionApplied, false); assert.equal(result.verifiedPhysics, false);
  assert.equal(before.zoom, 1);
});
test('opt-in reduced motion limits zoom, pan and twist', () => {
  const result = applyAccessiblePinchFrame(before, p, [{ x: 0, y: -2 }, { x: 0, y: 2 }], { reducedMotion: true, maxZoomRatio: 1.1, maxPanDelta: 1 });
  assert.equal(result.zoom, 1.1); assert.deepEqual(result.orientation, [1, 0, 0, 0]);
  assert.equal(Object.isFrozen(result.orientation), true);
});
test('invalid geometry is a no-op, never a new transform', () => {
  const result = applyAccessiblePinchFrame(before, p, [{ x: 0, y: 0 }, { x: 0, y: 0 }]);
  assert.equal(result.valid, false); assert.equal(result.zoom, 1);
});
test('invalid options and viewport are rejected', () => {
  assert.throws(() => applyAccessiblePinchFrame(before, p, p, { reducedMotion: 'yes' }), TypeError);
  assert.throws(() => applyAccessiblePinchFrame({ ...before, zoom: -1 }, p, p), TypeError);
});
