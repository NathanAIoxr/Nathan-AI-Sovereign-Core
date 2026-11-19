/** Deterministic symbolic crossing validation; not calibrated yarn physics. */
export function validateBraidWord(word, { maxCrossings = 10000 } = {}) {
  if (!Array.isArray(word) || !Number.isSafeInteger(maxCrossings) || maxCrossings < 0 || word.length > maxCrossings)
    throw new RangeError('Invalid braid word or crossing limit');
  let signedCrossings = 0, maxStrand = 0;
  const normalized = word.map(crossing => {
    if (!crossing || typeof crossing !== 'object' || Array.isArray(crossing) ||
        !Number.isSafeInteger(crossing.strand) || crossing.strand < 1 ||
        (crossing.parity !== 1 && crossing.parity !== -1))
      throw new TypeError('Crossing requires a positive strand index and parity +1 or -1');
    signedCrossings += crossing.parity;
    maxStrand = Math.max(maxStrand, crossing.strand + 1);
    return Object.freeze({ strand: crossing.strand, parity: crossing.parity });
  });
  return Object.freeze({ crossings: Object.freeze(normalized), crossingCount: normalized.length,
    signedCrossings, minimumStrands: maxStrand });
}
/** Adjacent inverse crossings cancel algebraically without modifying input. */
export function reduceBraidWord(word) {
  const { crossings } = validateBraidWord(word);
  const stack = [];
  for (const crossing of crossings) {
    const previous = stack[stack.length - 1];
    if (previous?.strand === crossing.strand && previous.parity === -crossing.parity) stack.pop();
    else stack.push(crossing);
  }
  return Object.freeze(stack);
}
