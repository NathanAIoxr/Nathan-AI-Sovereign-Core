(function (root, factory) {
  const arithmetic = factory();
  if (typeof module === 'object' && module.exports) module.exports = arithmetic;
  else root.NathanArithmeticRoots = arithmetic;
})(globalThis, function () {
  'use strict';

  function count(value, label = 'count') {
    if (!Number.isSafeInteger(value) || value < 0 || value > 1e9) {
      throw new RangeError(label + ' must be an integer in 0..1e9');
    }
    return value;
  }

  function build(first, second) {
    return count(first, 'first count') + count(second, 'second count');
  }

  function clear(present, removed) {
    count(present, 'present count');
    count(removed, 'removed count');
    if (removed > present) throw new RangeError('Cannot remove more than are present');
    return present - removed;
  }

  function inventory(present, selected) {
    count(present, 'present count');
    count(selected, 'selected count');
    if (selected > present) throw new RangeError('Cannot select more than are present');
    return { presentBefore: present, selected, moved: 0, presentAfter: present };
  }

  function transfer(originBefore, amount) {
    const originAfter = clear(originBefore, amount);
    return {
      originBefore, destinationBefore: 0, moved: amount, originAfter,
      destinationAfter: amount, totalAfter: originAfter + amount,
      ledgerEntries: amount === 0 ? 0 : 1 + 1,
      ...(originAfter === 0 ? { originReading: 'Nunn' } : {})
    };
  }

  function pingalaNashta(index, length) {
    if (!Number.isSafeInteger(length) || length < 1 || length > 20) throw new RangeError('Length 1..20');
    count(index, 'index');
    if (index < 1) throw new RangeError('Index starts at one');
    const bits = (index - 1).toString(2);
    if (bits.length > length) throw new RangeError('Index exceeds the selected pattern length');
    return [...bits.padStart(length, '0')].reverse().join('');
  }

  function pingalaUddishta(pattern) {
    if (typeof pattern !== 'string' || !/^[01]{1,20}$/.test(pattern)) throw new RangeError('One to twenty binary line symbols required');
    return parseInt([...pattern].reverse().join(''), 2) + 1;
  }

  const BACON_ALPHABET = 'ABCDEFGHIKLMNOPQRSTUWXYZ';
  const NAPIER_ALPHABET = 'abcdefghijklmnopqrstuvwxyz';

  function baconEncode(text) {
    return [...String(text).toUpperCase().replaceAll('J', 'I').replaceAll('V', 'U')]
      .filter(letter => BACON_ALPHABET.includes(letter))
      .map(letter => BACON_ALPHABET.indexOf(letter).toString(2).padStart(5, '0')
        .replaceAll('0', 'a').replaceAll('1', 'b'))
      .join(' ');
  }

  function baconDecode(text) {
    return String(text).toLowerCase().split(/\s+/).filter(Boolean).map(word => {
      if (!/^[ab]{5}$/.test(word)) throw new RangeError('Bacon groups must be 5 a/b letters');
      const index = parseInt(word.replaceAll('a', '0').replaceAll('b', '1'), 2);
      if (index >= BACON_ALPHABET.length) throw new RangeError('Unused Bacon code');
      return BACON_ALPHABET[index];
    }).join('');
  }

  function toNapier(number) {
    count(number);
    if (number > 67108863) throw new RangeError('Number exceeds the 26 Napier locations');
    if (number === 0) return '';
    return [...number.toString(2)].reverse()
      .map((bit, position) => bit === '1' ? NAPIER_ALPHABET[position] : '').join('');
  }

  function fromNapier(code) {
    if (typeof code !== 'string' || !/^[a-z]*$/i.test(code)) throw new RangeError('Location letters a-z required');
    const locations = new Set(code.toLowerCase());
    const bits = [...NAPIER_ALPHABET].reverse().map(letter => locations.has(letter) ? '1' : '0');
    return parseInt(bits.join(''), 2);
  }

  function leibnizBinary(number) { return count(number).toString(2); }

  function leibnizAdd(first, second) {
    if (!/^[01]{1,40}$/.test(first) || !/^[01]{1,40}$/.test(second)) throw new RangeError('Binary strings up to 40 digits');
    let carry = 0;
    let result = '';
    for (let i = first.length - 1, j = second.length - 1; i >= 0 || j >= 0 || carry; i--, j--) {
      const sum = (i >= 0 ? Number(first[i]) : 0) + (j >= 0 ? Number(second[j]) : 0) + carry;
      carry = sum >= 2 ? 1 : 0;
      result = String(carry ? sum - 2 : sum) + result;
    }
    return result.replace(/^0+(?=.)/, '');
  }

  function binary(bit) {
    if (bit !== 0 && bit !== 1) throw new RangeError('Binary input 0 or 1 required');
    return bit;
  }

  function booleNot(bit) { return 1 - binary(bit); }
  function booleAnd(first, second) { return binary(first) & binary(second); }
  function booleOr(first, second) { return binary(first) | binary(second); }
  function booleXor(first, second) { return binary(first) ^ binary(second); }

  const BASE60_PLACES = [777600000, 12960000, 216000, 3600, 60, 1];
  function sexagesimalEncode(number) {
    let remaining = count(number);
    const digits = [];
    for (const place of BASE60_PLACES) {
      let digit = 0;
      while (remaining >= place) {
        remaining -= place;
        digit++;
      }
      if (digits.length || digit || place === 1) digits.push(digit);
    }
    return digits;
  }

  function sexagesimalDecode(digits) {
    if (!Array.isArray(digits) || digits.length < 1 || digits.length > 7 ||
        !Array.from(digits).every(digit => Number.isInteger(digit) && digit >= 0 && digit < 60)) {
      throw new RangeError('Base-60 digits 0..59 required');
    }
    const values = digits.length === 7 && digits[0] === 0 ? digits.slice(1) : digits;
    if (values.length > BASE60_PLACES.length) throw new RangeError('Too large');
    const places = BASE60_PLACES.slice(BASE60_PLACES.length - values.length);
    let number = 0;
    values.forEach((digit, index) => {
      for (let i = 0; i < digit; i++) number += places[index];
    });
    return count(number);
  }

  function iChingState(lower, upper) {
    if (!Number.isInteger(lower) || lower < 0 || lower > 7 ||
        !Number.isInteger(upper) || upper < 0 || upper > 7) throw new RangeError('trigram values 0..7');
    return parseInt(upper.toString(2) + lower.toString(2).padStart(3, '0'), 2);
  }

  function iChingChange(state, mask) {
    if (!Number.isInteger(state) || !Number.isInteger(mask) ||
        state < 0 || state > 63 || mask < 0 || mask > 63) throw new RangeError('6-bit values');
    return state ^ mask;
  }

  const COMPARISON=Object.freeze([
   {id:'sumer',label:'Sumerian / Neo-Sumerian',system:'Early metrology and base-60 place-value precursors',radix:60,kind:'positional & tables',connection:'Place value, grouped counting, standardized calculation',limit:'Not a binary-computer architecture'},
   {id:'babylon',label:'Old Babylonian',system:'Sexagesimal place value and reciprocal tables',radix:60,kind:'positional',connection:'Numerical encoding, lookup tables, repeated arithmetic',limit:'Base 60, not base 2'},
   {id:'egypt',label:'Ancient Egyptian',system:'Repeated doubling and sums of unit fractions',radix:10,kind:'doubling / additive',connection:'Doubling selects powers of two in multiplication',limit:'Written notation remained largely decimal and non-positional'},
   {id:'indian',label:'Pingala / Sanskrit prosody',system:'Two syllable lengths; enumerated poetic meters',radix:2,kind:'combinatorial',connection:'Two-state strings and reversible index mapping',limit:'Poetic prosody, not electronic instructions'},
   {id:'chinese',label:'I Ching and Fu Xi ordering',system:'Broken / unbroken lines; 64 hexagrams',radix:2,kind:'combinatorial',connection:'Six binary-state positions',limit:'Not itself a CPU or predictive physical law'},
   {id:'greek',label:'Greek / Euclid',system:'Euclidean remainder algorithm',radix:10,kind:'algorithmic',connection:'Finite deterministic procedure independent of notation',limit:'Not evidence of a binary encoding tradition'},
   {id:'bacon',label:'Francis Bacon (1605/1623)',system:'Biliteral cipher, 24-letter alphabet',radix:2,kind:'encoding',connection:'Five two-state symbols encode a letter',limit:'This code is a cipher, not general arithmetic'},
   {id:'napier',label:'John Napier (1617)',system:'Location arithmetic and chessboard calculator',radix:2,kind:'arithmetic',connection:'Powers of two represented by letter positions',limit:'Not identical to modern CPUs'},
   {id:'leibniz',label:'Leibniz (1679/1703)',system:'Base-two positional arithmetic',radix:2,kind:'arithmetic',connection:'Formal carry and binary notation',limit:'Leibniz developed this before seeing the Fu Xi diagram'},
   {id:'boole',label:'George Boole (1847/1854)',system:'Algebra of logical states',radix:2,kind:'logic',connection:'AND, OR, NOT, XOR truth operations',limit:'Hardware implementation came later'}
  ]);

  function verify() {
    let transitions = 0;
    for (let state = 0; state < 64; state++) {
      for (let mask = 0; mask < 64; mask++) {
        if (iChingChange(iChingChange(state, mask), mask) !== state) throw Error('XOR failure');
        transitions++;
      }
    }
    let pingalaRoundTrips = 0;
    for (let index = 1; index <= 256; index++) {
      if (pingalaUddishta(pingalaNashta(index, 8)) !== index) throw Error('Pingala failure');
      pingalaRoundTrips++;
    }
    for (let number = 0; number <= 250; number++) {
      if (fromNapier(toNapier(number)) !== number) throw Error('Napier failure');
      if (sexagesimalDecode(sexagesimalEncode(number)) !== number) throw Error('Base60 failure');
    }
    return {
      hexagrams: 64, transitions, pingalaRoundTrips, napierRoundTrips: 251, base60RoundTrips: 251,
      build: build(1, 1), clear: clear(1, 1), nineCars: inventory(9, 0), nunn: transfer(1, 1),
      baconCODE: baconEncode('CODE'), leibniz13plus19: leibnizAdd('1101', '10011')
    };
  }

  return Object.freeze({
    COMPARISON, build, clear, inventory, transfer, pingalaNashta, pingalaUddishta, baconEncode,
    baconDecode, toNapier, fromNapier, leibnizBinary, leibnizAdd, booleNot, booleAnd, booleOr,
    booleXor, sexagesimalEncode, sexagesimalDecode, iChingState, iChingChange, verify
  });
});
