// NTW-005 and NTW-007: deterministic offline processors; no network or persistence.
const MAX_TEXT = 4096;
function text(value, label) {
  if (typeof value !== 'string' || value.length > MAX_TEXT) throw new TypeError(`${label} must be a string of at most ${MAX_TEXT} UTF-16 code units`);
  return value;
}
const IPA = Object.freeze({
  cat: '/kæt/', dog: '/dɔɡ/', book: '/bʊk/', light: '/laɪt/',
  truth: '/truːθ/', love: '/lʌv/', two: '/tuː/', to: '/tuː/', too: '/tuː/'
});
export function ipaSoundMap(input) {
  const original = text(input, 'input');
  const tokens = original.match(/[A-Za-z]+/g) ?? [];
  if (tokens.length > 512) throw new RangeError('at most 512 tokens');
  return { unit: 'NTW-005', original, dialect: 'illustrative broad English transcription',
    tokens: tokens.map(word => ({ word, ipa: Object.hasOwn(IPA, word.toLowerCase()) ? IPA[word.toLowerCase()] : null })),
    note: 'Small curated reference only; null means unknown, not a guessed pronunciation' };
}
export function strongRootLookup(number, records) {
  if (typeof number !== 'string' || !/^[GH][1-9][0-9]{0,4}$/.test(number)) throw new TypeError('number must be a Strong-style G/H identifier');
  if (!Array.isArray(records) || records.length > 256) throw new RangeError('records must be an array of at most 256 entries');
  const matches = [];
  for (const record of records) {
    if (!record || typeof record !== 'object' || Array.isArray(record)) throw new TypeError('invalid record');
    const id = text(record.number, 'record.number');
    const root = text(record.root, 'record.root');
    const meaning = text(record.meaning, 'record.meaning');
    if (!/^[GH][1-9][0-9]{0,4}$/.test(id)) throw new TypeError('invalid record number');
    if (id === number) matches.push({ number: id, root, meaning });
  }
  return { unit: 'NTW-007', number, matches, source: 'caller-supplied records; not independently verified', found: matches.length > 0 };
}
