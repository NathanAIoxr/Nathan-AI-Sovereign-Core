import test from 'node:test';
import assert from 'node:assert/strict';
import { mirrorText, acrosticMatrix } from './units.mjs';
test('mirror preserves original and reverses Unicode code points', () => {
  assert.deepEqual(mirrorText('A🚀B'), { unit:'NTW-002', original:'A🚀B', reversed:'B🚀A', unchangedOriginal:true });
});
test('mirror rejects nonstrings and oversized input', () => {
  assert.throws(() => mirrorText(null), TypeError);
  assert.throws(() => mirrorText('x'.repeat(4097)), TypeError);
});
test('acrostic handles mixed newlines and indentation', () => {
  assert.deepEqual(acrosticMatrix('  Alpha\r\nBeta\n  Cat'), {unit:'NTW-003',original:'  Alpha\r\nBeta\n  Cat',initials:['A','B','C'],acrostic:'ABC',lineCount:3});
});
test('acrostic keeps empty lines explicit', () => {
  assert.deepEqual(acrosticMatrix('A\n\nB').initials, ['A','','B']);
});
test('acrostic enforces bounded lines', () => {
  assert.throws(() => acrosticMatrix('a\n'.repeat(256)), RangeError);
});
