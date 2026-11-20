import test from 'node:test';
import assert from 'node:assert/strict';
import { simulateYarnTensionSeries } from './yarn-tension-series.mjs';

test('simulated tension series preserves sample order and values', () => {
  const result = simulateYarnTensionSeries({ lengthsMm: [90, 110, 140], restLengthMm: 100, stiffnessNPerMm: 0.2, maxTensionN: 5 });
  assert.deepEqual(result.samples.map(x => x.tensionN), [0, 2, 5]);
  assert.deepEqual(result.samples.map(x => x.index), [0, 1, 2]);
  assert.equal(result.samples[2].capped, true);
  assert.equal(result.verifiedPhysics, false);
});
test('empty series is valid and explicitly simulated', () => {
  const result = simulateYarnTensionSeries({ lengthsMm: [], restLengthMm: 100, stiffnessNPerMm: 1 });
  assert.deepEqual(result.samples, []);
  assert.equal(result.simulated, true);
});
test('invalid lengths and unbounded series fail closed', () => {
  assert.throws(() => simulateYarnTensionSeries({ lengthsMm: [NaN], restLengthMm: 100, stiffnessNPerMm: 1 }), RangeError);
  assert.throws(() => simulateYarnTensionSeries({ lengthsMm: [1,2,3], restLengthMm: 100, stiffnessNPerMm: 1, maxSamples: 2 }), RangeError);
  assert.throws(() => simulateYarnTensionSeries({ lengthsMm: '1', restLengthMm: 100, stiffnessNPerMm: 1 }), RangeError);
});
test('results are frozen and input remains unchanged', () => {
  const input = { lengthsMm: [100, 120], restLengthMm: 100, stiffnessNPerMm: 1 };
  const result = simulateYarnTensionSeries(input);
  assert.ok(Object.isFrozen(result));
  assert.ok(Object.isFrozen(result.samples));
  assert.ok(Object.isFrozen(result.samples[0]));
  assert.deepEqual(input.lengthsMm, [100, 120]);
});
