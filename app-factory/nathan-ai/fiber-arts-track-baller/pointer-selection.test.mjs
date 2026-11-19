import test from 'node:test';
import assert from 'node:assert/strict';
import { pointerToViewport, selectTopologyAtPointer } from './pointer-selection.mjs';
const bounds = { left: 100, top: 50, width: 200, height: 100 };
const event = { clientX: 120, clientY: 55, pointerType: 'touch', isPrimary: true };
const strands = [
  { id: 'red', braidIndex: 1, points: [{ x: 20, y: 0 }, { x: 20, y: 10 }] },
  { id: 'blue', braidIndex: 2, points: [{ x: 50, y: 0 }, { x: 50, y: 10 }] },
];
const braid = [{ strand: 1, parity: 1 }];
test('maps screen coordinates into viewport coordinates', () => {
  assert.deepEqual(pointerToViewport(event, bounds), { x: 20, y: 5 });
});
test('connects pointer to symbolic topology and accessible selection', () => {
  const result = selectTopologyAtPointer(strands, event, bounds, braid);
  assert.equal(result.selectedStrandId, 'red');
  assert.deepEqual(result.crossingSteps, [1]);
  assert.equal(result.simulation, 'symbolic-only');
});
test('ignores secondary touches and outside pointers', () => {
  assert.equal(selectTopologyAtPointer(strands, { ...event, isPrimary: false }, bounds, braid).ignored, true);
  assert.equal(selectTopologyAtPointer(strands, { ...event, clientX: 999 }, bounds, braid).ignored, true);
});
test('rejects invalid viewport dimensions and coordinates', () => {
  assert.throws(() => pointerToViewport(event, { ...bounds, width: 0 }), RangeError);
  assert.throws(() => pointerToViewport({ ...event, clientX: NaN }, bounds), RangeError);
});
test('does not mutate event, bounds, strands or braid', () => {
  const before = JSON.stringify({ event, bounds, strands, braid });
  selectTopologyAtPointer(strands, event, bounds, braid);
  assert.equal(JSON.stringify({ event, bounds, strands, braid }), before);
});
