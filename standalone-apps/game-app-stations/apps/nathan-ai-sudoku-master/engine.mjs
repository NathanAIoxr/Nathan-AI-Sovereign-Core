const FULL = 0x1ff;
const cells = Array.from({length: 81}, (_, i) => [
  Math.floor(i / 9), i % 9, 3 * Math.floor(i / 27) + Math.floor((i % 9) / 3),
]);
export const clues = Object.freeze({easy: 40, medium: 30, hard: 25});
const bits = Array.from({length: 512}, (_, n) => n.toString(2).replaceAll('0', '').length);
const digit = bit => 32 - Math.clz32(bit);

export function solve(values, limit = 2) {
  if (values.length !== 81 || values.some(n => !Number.isInteger(n) || n < 0 || n > 9)) {
    throw new RangeError('Expected 81 digits from zero to nine.');
  }
  const board = Array.from(values);
  const row = new Uint16Array(9), col = new Uint16Array(9), box = new Uint16Array(9);
  const solutions = [];
  const empty = [];
  for (const [i, n] of board.entries()) {
    if (!n) {
      empty.push(i);
      continue;
    }
    const [r,c,b] = cells[i], bit = 1 << (n - 1);
    if ((row[r] | col[c] | box[b]) & bit) return [];
    row[r] |= bit;
    col[c] |= bit;
    box[b] |= bit;
  }
  function search(depth) {
    if (depth === empty.length) {
      solutions.push(board.slice());
      return;
    }
    let best = depth, mask = 0, min = 10;
    for (let j = depth; j < empty.length; j++) {
      const [r,c,b] = cells[empty[j]];
      const available = FULL & ~(row[r] | col[c] | box[b]);
      const count = bits[available];
      if (!count) return;
      if (count < min) {
        best = j;
        mask = available;
        min = count;
        if (count === 1) break;
      }
    }
    [empty[depth],empty[best]] = [empty[best],empty[depth]];
    const i = empty[depth], [r,c,b] = cells[i];
    while (mask && solutions.length < limit) {
      const bit = mask & -mask;
      mask ^= bit;
      board[i] = digit(bit);
      row[r] |= bit;
      col[c] |= bit;
      box[b] |= bit;
      search(depth + 1);
      row[r] ^= bit;
      col[c] ^= bit;
      box[b] ^= bit;
    }
    board[i] = 0;
    [empty[depth],empty[best]] = [empty[best],empty[depth]];
  }
  search(0);
  return solutions;
}

function shuffled(values, random) {
  const copy = values.slice();
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [copy[i],copy[j]] = [copy[j],copy[i]];
  }
  return copy;
}

// A verified, uniquely solvable 25-clue base pattern also bounds generation time.
const hardBase = '000090000000460000308100400050003007600000920000000000075000062200500008060910504';

export function generate(level = 'easy', random = Math.random) {
  if (!Object.hasOwn(clues, level)) throw new RangeError('Unknown difficulty.');
  const axis = () => shuffled([0,1,2], random).flatMap(band =>
    shuffled([0,1,2], random).map(i => band * 3 + i));
  const rows = axis(), cols = axis();
  const numbers = [0, ...shuffled([1,2,3,4,5,6,7,8,9], random)];
  const transpose = random() < 0.5;
  const puzzle = rows.flatMap(r => cols.map(c => numbers[Number(hardBase[transpose ? c * 9 + r : r * 9 + c])]));
  const [solution] = solve(puzzle, 1);
  if (!solution) throw Error('Puzzle fixture is invalid.');
  const amount = puzzle.filter(Boolean).length;
  const blank = shuffled(puzzle.flatMap((n, i) => n === 0 ? [i] : []), random);
  for (const i of blank.slice(0, clues[level] - amount)) puzzle[i] = solution[i];
  return {puzzle, solution};
}

export function candidates(board, i) {
  const [r,c,b] = cells[i], used = new Set();
  for (const [j,[pr,pc,pb]] of cells.entries()) {
    if (j !== i && (r === pr || c === pc || b === pb)) used.add(board[j]);
  }
  return [1,2,3,4,5,6,7,8,9].filter(n=>!used.has(n));
}

const digits = [1, 2, 3, 4, 5, 6, 7, 8, 9];
const units = ['Row', 'Column', 'Box'].flatMap((type, axis) =>
  digits.map(number => ({
    name: type + ' ' + number,
    indexes: cells.flatMap((axes, i) => axes[axis] === number - 1 ? [i] : []),
  })),
);

export function intersection(i) {
  const [row, col, box] = cells[i];
  return {row: row + 1, col: col + 1, box: box + 1, peers: cells.map(([r, c, b], j) => j !== i && (r === row || c === col || b === box))};
}

function combinations(items, size, start = 0, picked = []) {
  if (picked.length === size) return [picked];
  const sets = [];
  for (let i = start; i <= items.length - (size - picked.length); i++) {
    sets.push(...combinations(items, size, i + 1, [...picked, items[i]]));
  }
  return sets;
}

function crosses(indexes, symbols, available) {
  return indexes.flatMap(index => symbols.filter(n => available[index].includes(n)).map(n => ({index, digit: n})));
}

function subset(available, size, hidden, include) {
  const title = (hidden ? 'Hidden ' : 'Naked ') + (size === 2 ? 'pair' : 'triple');
  for (const {name, indexes} of units) {
    const open = indexes.filter(i => available[i].length);
    const candidatesForEachDigit = digits.map(n => open.filter(i => available[i].includes(n)));
    const choices = hidden
      ? digits.filter(n => candidatesForEachDigit[n - 1].length >= 2 && candidatesForEachDigit[n - 1].length <= size)
      : open.filter(i => available[i].length >= 2 && available[i].length <= size);
    for (const group of combinations(choices, size)) {
      const positions = hidden ? [...new Set(group.flatMap(n => candidatesForEachDigit[n - 1]))] : group;
      const symbols = hidden ? group : [...new Set(group.flatMap(i => available[i]))].sort();
      if (positions.length !== size || symbols.length !== size) continue;
      const eliminations = hidden
        ? crosses(positions, digits.filter(n => !symbols.includes(n)), available)
        : crosses(open.filter(i => !positions.includes(i)), symbols, available);
      if (eliminations.some(include)) return {title, cells: positions, symbols, unit: name, eliminations};
    }
  }
  return null;
}

function findSkyscraper(available, include) {
  for (const transpose of [false, true]) {
    const locate = (major, minor) => transpose ? minor * 9 + major : major * 9 + minor;
    for (const n of digits) {
      const pairs = Array.from({length: 9}, (_, major) =>
        Array.from({length: 9}, (_, minor) => minor).filter(minor => available[locate(major, minor)].includes(n)));
      for (let a = 0; a < 8; a++) for (let b = a + 1; b < 9; b++) {
        if (pairs[a].length !== 2 || pairs[b].length !== 2) continue;
        const common = pairs[a].filter(i => pairs[b].includes(i));
        if (common.length !== 1) continue;
        const ends = [locate(a, pairs[a].find(i => i !== common[0])), locate(b, pairs[b].find(i => i !== common[0]))];
        const bases = [locate(a, common[0]), locate(b, common[0])];
        const pattern = [...ends, ...bases];
        const endPeers = ends.map(i => intersection(i).peers);
        const targets = cells.flatMap((_, i) => !pattern.includes(i) && endPeers.every(peers => peers[i]) ? [i] : []);
        const eliminations = crosses(targets, [n], available);
        const first = eliminations.find(include);
        if (first) return {title: 'Skyscraper', cells: pattern, ends, bases, symbols: [n], digit: n, target: first.index, eliminations};
      }
    }
  }
  return null;
}

function availableOn(board) {
  return board.map((n, i) => n ? [] : candidates(board, i));
}

export function skyscraper(board) {
  return findSkyscraper(availableOn(board), () => true);
}

export const lessons = {
  'naked-pair': {title: 'Naked pair', rule: 'Two cells in one house carry the same two candidates. Cross those digits out of the other cells in the house.'},
  'hidden-pair': {title: 'Hidden pair', rule: 'Two digits have only the same two places in a house. Cross the other candidates out of those two cells.'},
  'naked-triple': {title: 'Naked triple', rule: 'Three cells in one house share a pool of only three digits. Cross those digits out of the other cells in the house.'},
  'hidden-triple': {title: 'Hidden triple', rule: 'Three digits are confined to three cells in a house. Cross the other candidates out of those cells.'},
  skyscraper: {title: 'Skyscraper', rule: 'One digit has two possible places in each of two parallel houses. The bases align. Any cell that sees both exposed ends can lose that digit.'},
};

export function logicHint(board, {technique, crossed = []} = {}) {
  const available = availableOn(board);
  if (!technique) {
    const only = available.findIndex(list => list.length === 1);
    if (only >= 0) return {title: 'Naked single', cells: [only], placement: {index: only, digit: available[only][0]}};
    for (const {name, indexes} of units) for (const n of digits) {
      const hits = indexes.filter(i => available[i].includes(n));
      if (hits.length === 1) return {title: 'Hidden single', cells: hits, unit: name, placement: {index: hits[0], digit: n}};
    }
  }
  const include = ({index, digit: n}) => !crossed[index]?.includes(n);
  for (const id of technique ? [technique] : Object.keys(lessons)) {
    const result = id === 'skyscraper' ? findSkyscraper(available, include)
      : subset(available, id.endsWith('pair') ? 2 : 3, id.startsWith('hidden'), include);
    if (result) return {...result, technique: id, eliminations: result.eliminations.filter(include)};
  }
  return null;
}

export function parsePuzzle(text) {
  const input = text.trim();
  const tokens = input.split(/[\s,]+/);
  const allowed = /^[0-9.OoIl]+$/;
  const compact = tokens.length === 1 && allowed.test(input)
    || tokens.length === 9 && tokens.every(token => token.length === 9 && allowed.test(token));
  const separated = tokens.length === 81 && tokens.every(token => token.length === 1 && allowed.test(token));
  if ((!compact && !separated) || tokens.join('').length !== 81) {
    throw new Error('Enter exactly 81 cells. Use digits, 0 or a dot. Separate individual cells or paste nine 9-cell rows.');
  }
  const fixed = tokens.join('').replace(/[.Oo]/g, '0').replace(/[Il]/g, '1');
  const puzzle = [...fixed].map(Number);
  for (const {name, indexes} of units) {
    const givens = indexes.map(i => puzzle[i]).filter(Boolean);
    if (givens.length !== new Set(givens).size) throw new Error(name + ' repeats a given digit.');
  }
  const answers = solve(puzzle);
  if (!answers.length) throw new Error('The givens have no solution.');
  if (answers.length !== 1) throw new Error('The givens have multiple solutions. Add more clues.');
  return {puzzle, solution: answers[0]};
}

const lessonBoards = {
  'naked-pair': '490801000301504009065902013008600340900020100040007000500310000034700580000205600',
  'hidden-pair': '400001000301500009060902010008000340900020100040007000500310000034000580000205600',
  'naked-triple': '490801000301504029065902013008600340900020100040007000500310000034700580000205600',
  'hidden-triple': '490801000301500009065902013008600340900020100040007000500310000034700580000205600',
  skyscraper: '410027050030461289602050710200300500080005620000200098100000040000504000904680100',
};

export function lessonPuzzle(id) {
  return parsePuzzle(lessonBoards[id]);
}
