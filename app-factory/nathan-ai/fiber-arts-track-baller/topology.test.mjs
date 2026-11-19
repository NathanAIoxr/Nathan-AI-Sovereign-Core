import test from 'node:test';
import assert from 'node:assert/strict';
import { validateBraidWord, reduceBraidWord } from './topology.mjs';
test('empty braid is valid and immutable', () => {
  const result = validateBraidWord([]);
  assert.equal(result.crossingCount, 0);
  assert.equal(result.minimumStrands, 0);
  assert.ok(Object.isFrozen(result.crossings));
});
test('crossing parity and strand count are deterministic', () => {
  assert.equal(validateBraidWord([{strand:1,parity:1},{strand:2,parity:-1},{strand:2,parity:1}]).signedCrossings, 1);
  assert.equal(validateBraidWord([{strand:3,parity:-1}]).minimumStrands, 4);
});
test('adjacent inverse pairs cancel without mutation', () => {
  const word = [{strand:1,parity:1},{strand:2,parity:1},{strand:2,parity:-1},{strand:1,parity:-1}];
  assert.deepEqual(reduceBraidWord(word), []);
  assert.equal(word.length, 4);
});
test('non-adjacent and same-sign crossings remain', () => {
  assert.equal(reduceBraidWord([{strand:1,parity:1},{strand:2,parity:1},{strand:1,parity:-1}]).length, 3);
});
test('invalid parity, strand, shape and limits reject', () => {
  for (const word of [[{strand:0,parity:1}],[{strand:1,parity:0}],[null],[{strand:1.5,parity:1}]])
    assert.throws(() => validateBraidWord(word), TypeError);
  assert.throws(() => validateBraidWord('not a word'), RangeError);
  assert.throws(() => validateBraidWord([{strand:1,parity:1}],{maxCrossings:0}), RangeError);
});
