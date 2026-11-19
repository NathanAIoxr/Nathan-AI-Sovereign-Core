// Two bounded, offline language processors. No external I/O or side effects.
const MAX_LENGTH = 4096;
function requireText(value) {
  if (typeof value !== 'string' || value.length > MAX_LENGTH) throw new TypeError('text must be a string of at most 4096 UTF-16 code units');
  return value;
}
export function mirrorText(text) {
  const original = requireText(text);
  return { unit: 'NTW-002', original, reversed: Array.from(original).reverse().join(''), unchangedOriginal: true };
}
export function acrosticMatrix(text) {
  const original = requireText(text);
  const lines = original.split(/\r\n|\n|\r/u);
  if (lines.length > 256) throw new RangeError('at most 256 lines');
  const initials = lines.map(line => Array.from(line.trimStart())[0] ?? '');
  return { unit: 'NTW-003', original, initials, acrostic: initials.join(''), lineCount: lines.length };
}
