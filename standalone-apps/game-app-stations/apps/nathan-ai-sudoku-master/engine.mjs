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

export function skyscraper(board) {
  const choices = board.map((n,i)=>n ? [] : candidates(board,i));
  for (const swap of [false,true]) {
    const locate = (major, minor) => swap ? minor * 9 + major : major * 9 + minor;
    const peers = (a,b) => cells[a].some((value,index)=>value===cells[b][index]);
    for (let n=1;n<=9;n++) {
      const pairs = Array.from({length:9},(_, major)=>
        Array.from({length:9},(_, minor)=>minor).filter(minor=>choices[locate(major,minor)].includes(n)));
      for (let a=0;a<9;a++) for (let b=a+1;b<9;b++) {
        if (pairs[a].length!==2 || pairs[b].length!==2) continue;
        const common=pairs[a].filter(i=>pairs[b].includes(i));
        if (common.length!==1) continue;
        const ends=[locate(a,pairs[a].find(i=>i!==common[0])),locate(b,pairs[b].find(i=>i!==common[0]))];
        const exclude=[...ends,locate(a,common[0]),locate(b,common[0])];
        const target=choices.findIndex((list,i)=>list.includes(n)&&!exclude.includes(i)&&ends.every(end=>peers(i,end)));
        if (target>=0) return {digit:n,target,ends};
      }
    }
  }
  return null;
}
