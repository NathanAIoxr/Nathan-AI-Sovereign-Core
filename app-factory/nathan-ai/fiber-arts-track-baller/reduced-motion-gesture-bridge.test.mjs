import test from 'node:test';
import assert from 'node:assert/strict';
import { applyAccessibleGestureFrame } from './reduced-motion-gesture-bridge.mjs';

const previous = Object.freeze({ zoom: 1, panX: 0, panY: 0, orientation: Object.freeze([1, 0, 0, 0]) });
const proposed = Object.freeze({ zoom: 3, panX: 100, panY: 0, orientation: Object.freeze([0, 1, 0, 0]) });

test('normal gesture remains unrestricted by default', () => {
  const result = applyAccessibleGestureFrame(previous, proposed);
  assert.equal(result.zoom, 3);
  assert.equal(result.panX, 100);
  assert.deepEqual(result.orientation, [0, 1, 0, 0]);
  assert.equal(result.reducedMotionApplied, false);
  assert.equal(result.verifiedPhysics, false);
});
test('opt-in guard limits pan and zoom and prevents rotation', () => {
  const result = applyAccessibleGestureFrame(previous, proposed, { reducedMotion: true, maxPanDelta: 10, maxZoomRatio: 1.1 });
  assert.equal(result.panX, 10);
  assert.equal(result.zoom, 1.1);
  assert.deepEqual(result.orientation, [1, 0, 0, 0]);
});
test('invalid inputs fail closed', () => {
  assert.throws(() => applyAccessibleGestureFrame(previous, proposed, { reducedMotion: 'true' }), TypeError);
  assert.throws(() => applyAccessibleGestureFrame(previous, { ...proposed, zoom: Infinity }), TypeError);
});
test('snapshots are immutable and input objects untouched', () => {
  const result = applyAccessibleGestureFrame(previous, proposed, { reducedMotion: true });
  assert.equal(Object.isFrozen(result), true);
  assert.equal(Object.isFrozen(result.orientation), true);
  assert.equal(previous.zoom, 1);
  assert.equal(proposed.zoom, 3);
});
