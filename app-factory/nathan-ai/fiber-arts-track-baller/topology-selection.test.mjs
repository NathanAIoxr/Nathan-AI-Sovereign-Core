import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveTopologySelection } from './topology-selection.mjs';

const strands = [
  { id: 'blue', braidIndex: 2, points: [{ x: 20, y: 0 }, { x: 20, y: 10 }] },
  { id: 'red', braidIndex: 1, points: [{ x: 0, y: 0 }, { x: 0, y: 10 }] },
  { id: 'green', braidIndex: 3, points: [{ x: 40, y: 0 }, { x: 40, y: 10 }] },
];
const word = [{ strand: 1, parity: 1 }, { strand: 2, parity: -1 }];
test('explicit mapping connects viewport selection to both crossing steps', () => {
  const result = resolveTopologySelection(strands, { x: 20, y: 5 }, word);
  assert.equal(result.selectedStrandId, 'blue');
  assert.equal(result.braidIndex, 2);
  assert.deepEqual(result.crossingSteps, [1, 2]);
  assert.equal(result.simulation, 'symbolic-only');
  assert.ok(Object.isFrozen(result.crossingSteps));
});
test('missed selection returns no crossings', () => {
  const result = resolveTopologySelection(strands, { x: 100, y: 100 }, word);
  assert.equal(result.braidIndex, null);
  assert.deepEqual(result.crossingSteps, []);
});
test('rejects ambiguous indices', () => {
  assert.throws(() => resolveTopologySelection([...strands, { id: 'duplicate', braidIndex: 2, points: [] }], { x: 0, y: 0 }, word), TypeError);
});
test('rejects incomplete mapping for braid', () => {
  assert.throws(() => resolveTopologySelection(strands.slice(0, 2), { x: 0, y: 0 }, word), RangeError);
});
test('does not mutate source data', () => {
  const before = JSON.stringify({ strands, word });
  resolveTopologySelection(strands, { x: 0, y: 5 }, word);
  assert.equal(JSON.stringify({ strands, word }), before);
});
