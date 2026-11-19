const byId = id => document.getElementById(id);

const flipLetters = { 0: 'O', 1: 'I', 2: 'Z', 3: 'E', 4: 'h', 5: 'S', 6: 'g', 7: 'L', 8: 'B', 9: 'g' };
const flipDigits = { O: '0', I: '1', Z: '2', E: '3', H: '4', S: '5', G: '6', L: '7', B: '8' };
const segmentMasks = ['1011111', '0000101', '1110110', '1110101', '0101101', '1111001', '1111011', '1000101', '1111111', '1111101'];

function readFlip(digits) {
  return Array.from(digits).reverse().map(digit => flipLetters[digit] ?? '?').join('');
}

function makeFlip(word) {
  return Array.from(word.toUpperCase()).reverse().map(letter => flipDigits[letter] ?? '?').join('');
}

function showDigits(display, digits, flipped = false) {
  const row = document.createElement('div');
  row.className = flipped ? 'segment-row flip' : 'segment-row';
  row.setAttribute('aria-hidden', 'true');
  for (const digit of digits) {
    const frame = document.createElement('span');
    frame.className = 'segment';
    for (const bit of segmentMasks[Number(digit)]) {
      const segment = document.createElement('i');
      if (bit === '1') segment.className = 'on';
      frame.append(segment);
    }
    row.append(frame);
  }
  display.replaceChildren(row);
  display.setAttribute('aria-label', flipped ? readFlip(digits) : digits);
}

function readStored(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem('boobies.' + key)) ?? fallback;
  } catch {
    return fallback;
  }
}

function saveStored(key, value) {
  try {
    localStorage.setItem('boobies.' + key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}
