import test from 'node:test';
import assert from 'node:assert/strict';
import { summarizeSimulatedTension } from './yarn-tension-alert.mjs';
const sample = (tensionN, capped = false) => ({ simulated: true, verifiedPhysics: false, tensionN, capped });
const series = samples => ({ simulated: true, verifiedPhysics: false, samples });
test('summarizes simulated peaks and strict threshold crossings', () => {
  assert.deepEqual(summarizeSimulatedTension(series([sample(2), sample(5), sample(8, true)])), { simulated: true, verifiedPhysics: false, advisoryOnly: true, sampleCount: 3, peakN: 8, aboveThresholdCount: 1, cappedCount: 1, advisoryThresholdN: 5 });
});
test('handles empty series without suggesting a measurement', () => {
  assert.equal(summarizeSimulatedTension(series([])).peakN, 0);
});
test('rejects measured or malformed input', () => {
  assert.throws(() => summarizeSimulatedTension({ simulated: false, verifiedPhysics: true, samples: [] }), TypeError);
  assert.throws(() => summarizeSimulatedTension(series([sample(NaN)])), TypeError);
});
test('rejects invalid advisory thresholds', () => {
  assert.throws(() => summarizeSimulatedTension(series([]), { advisoryThresholdN: 0 }), RangeError);
});
test('does not mutate input and freezes output', () => {
  const input = series([sample(3)]);
  const output = summarizeSimulatedTension(input);
  assert.equal(Object.isFrozen(output), true);
  assert.equal(input.samples[0].tensionN, 3);
});
