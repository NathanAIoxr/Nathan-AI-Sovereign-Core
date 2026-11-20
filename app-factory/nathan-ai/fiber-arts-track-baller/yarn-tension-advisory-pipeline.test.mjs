import test from 'node:test';
import assert from 'node:assert/strict';
import { previewYarnTensionAdvisory } from './yarn-tension-advisory-pipeline.mjs';

test('defaults to disabled without requiring or processing yarn samples', () => {
  assert.deepEqual(previewYarnTensionAdvisory(), { enabled: false, simulated: true, verifiedPhysics: false, advisoryOnly: true, series: null, advisory: null });
});
test('combines real series and advisory modules with strict threshold crossings', () => {
  const result = previewYarnTensionAdvisory({ enabled: true, lengthsMm: [100, 105, 115], restLengthMm: 100, stiffnessNPerMm: 1, maxTensionN: 10, advisoryThresholdN: 5 });
  assert.deepEqual(result.series.samples.map(s => s.tensionN), [0, 5, 10]);
  assert.equal(result.advisory.aboveThresholdCount, 1);
  assert.equal(result.advisory.cappedCount, 1);
  assert.equal(result.advisory.peakN, 10);
  assert.equal(result.verifiedPhysics, false);
});
test('rejects invalid enabled input and oversized series', () => {
  assert.throws(() => previewYarnTensionAdvisory({ enabled: true, lengthsMm: [NaN], restLengthMm: 100, stiffnessNPerMm: 1 }), RangeError);
  assert.throws(() => previewYarnTensionAdvisory({ enabled: true, lengthsMm: [100, 101], restLengthMm: 100, stiffnessNPerMm: 1, maxSamples: 1 }), RangeError);
  assert.throws(() => previewYarnTensionAdvisory({ enabled: true, lengthsMm: [], restLengthMm: 100, stiffnessNPerMm: 1, advisoryThresholdN: 0 }), RangeError);
});
test('does not mutate inputs and freezes all returned structures', () => {
  const lengthsMm = [101, 102];
  const result = previewYarnTensionAdvisory({ enabled: true, lengthsMm, restLengthMm: 100, stiffnessNPerMm: 1 });
  assert.deepEqual(lengthsMm, [101, 102]);
  assert.ok(Object.isFrozen(result) && Object.isFrozen(result.series) && Object.isFrozen(result.series.samples) && Object.isFrozen(result.advisory));
});
