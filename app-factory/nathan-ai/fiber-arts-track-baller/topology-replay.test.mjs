import test from 'node:test';
import assert from 'node:assert/strict';
import { replayBraidWord } from './topology-replay.mjs';

test('empty braid has no steps', () => {
  assert.deepEqual(replayBraidWord([]), { totalSteps: 0, steps: [] });
});
test('over and under crossings produce accessible descriptions', () => {
  const result = replayBraidWord([{ strand: 1, parity: 1 }, { strand: 1, parity: -1 }]);
  assert.equal(result.steps[0].announcement, 'Step 1: strand 1 crosses over strand 2');
  assert.equal(result.steps[1].announcement, 'Step 2: strand 1 crosses under strand 2');
  assert.deepEqual(result.steps[1].reducedCrossings, []);
});
test('snapshots are immutable and input is unchanged', () => {
  const input = [{ strand: 2, parity: 1 }];
  const result = replayBraidWord(input);
  assert.ok(Object.isFrozen(result));
  assert.ok(Object.isFrozen(result.steps));
  assert.ok(Object.isFrozen(result.steps[0].reducedCrossings));
  input[0].strand = 3;
  assert.equal(result.steps[0].crossing.strand, 2);
});
test('supports 72 symbolic steps without inventing a craft catalog', () => {
  const result = replayBraidWord(Array.from({ length: 72 }, (_, i) => ({ strand: 1 + (i % 3), parity: 1 })));
  assert.equal(result.totalSteps, 72);
  assert.equal(result.steps.at(-1).step, 72);
});
test('rejects invalid crossings and crossing limits', () => {
  assert.throws(() => replayBraidWord([{ strand: 0, parity: 1 }]), TypeError);
  assert.throws(() => replayBraidWord([{ strand: 1, parity: 1 }], { maxCrossings: 0 }), RangeError);
});
