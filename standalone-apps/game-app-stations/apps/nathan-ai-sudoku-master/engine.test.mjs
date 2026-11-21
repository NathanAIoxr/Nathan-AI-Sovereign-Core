import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generate, solve, clues, candidates, skyscraper, intersection, logicHint, lessons, lessonPuzzle, parsePuzzle } from './engine.mjs';
const levels = process.env.SUDOKU_LEVEL ? [process.env.SUDOKU_LEVEL] : Object.keys(clues);
for (const level of levels) {
  test(level + ' puzzles contain the exact clue count and have one solution', () => {
    for (let seed = 1; seed <= 24; seed++) {
      let state = seed;
      const random = () => {
        state = (Math.imul(state,1664525) + 1013904223) >>> 0;
        return state / 4294967296;
      };
      const {puzzle,solution} = generate(level,random);
      assert.equal(puzzle.filter(Boolean).length,clues[level]);
      assert.deepEqual(solve(puzzle),[solution]);
      assert(puzzle.every((n,i)=>n===0||n===solution[i]));
      const hint=skyscraper(puzzle);
      if (hint) {
        assert(candidates(puzzle,hint.target).includes(hint.digit));
        assert.notEqual(solution[hint.target],hint.digit);
      }
    }
  });
}
test('duplicate givens cannot be solved', () => {
  const board=Array(81).fill(0);
  board[0]=board[1]=1;
  assert.deepEqual(solve(board),[]);
});
test('solver can stop after two distinct solutions', () => {
  const solutions=solve(Array(81).fill(0),2);
  assert.equal(solutions.length,2);
  assert.notDeepEqual(solutions[0],solutions[1]);
});

test('the five Past Master lessons each demonstrate a valid elimination', () => {
  for (const technique of Object.keys(lessons)) {
    const {puzzle, solution} = lessonPuzzle(technique);
    const hint = logicHint(puzzle, {technique});
    assert.equal(hint.technique, technique);
    assert(hint.eliminations.length >= 2);
    for (const {index, digit} of hint.eliminations) {
      assert(candidates(puzzle, index).includes(digit));
      assert.notEqual(solution[index], digit);
    }
    const crossed = Array.from({length: 81}, () => []);
    const [removed, remaining] = hint.eliminations;
    crossed[removed.index].push(removed.digit);
    const next = logicHint(puzzle, {technique, crossed});
    assert(next.eliminations.some(item => item.index === remaining.index && item.digit === remaining.digit));
    assert(!next.eliminations.some(item => item.index === removed.index && item.digit === removed.digit));
  }
});

test('Skyscraper eliminations also work when the puzzle is transposed', () => {
  const {puzzle, solution} = lessonPuzzle('skyscraper');
  const transpose = board => board.map((_, i) => board[i % 9 * 9 + Math.floor(i / 9)]);
  const hint = skyscraper(transpose(puzzle));
  assert(hint);
  const answer = transpose(solution);
  assert(hint.eliminations.every(({index, digit}) => answer[index] !== digit));
});

test('Intersection Radar groups exactly twenty neighboring cells', () => {
  for (let i = 0; i < 81; i++) {
    const mode = intersection(i);
    assert.equal(mode.peers.filter(Boolean).length, 20);
    assert.equal(mode.peers[i], false);
  }
  const {row, col, box} = intersection(41);
  assert.deepEqual([row, col, box], [5, 6, 5]);
});

test('Breaker validates compact and spaced boards and rejects malformed or unsound puzzles', () => {
  const {puzzle, solution} = lessonPuzzle('skyscraper');
  const compact = puzzle.join('');
  assert.deepEqual(parsePuzzle(compact.replaceAll('0', 'O').replaceAll('1', 'I')), {puzzle, solution});
  assert.deepEqual(parsePuzzle(puzzle.join(', ')), {puzzle, solution});
  assert.deepEqual(parsePuzzle(compact.match(/.{9}/g).join('\n')), {puzzle, solution});
  assert.throws(() => parsePuzzle('12,' + puzzle.slice(2).join(',')), /81 cells/);
  assert.throws(() => parsePuzzle('x' + compact.slice(1)), /81 cells/);
  assert.throws(() => parsePuzzle('11' + '0'.repeat(79)), /repeats/);
  assert.throws(() => parsePuzzle('0'.repeat(81)), /multiple solutions/);
  const changed = puzzle.slice();
  changed[2] = candidates(puzzle, 2).find(n => n !== solution[2]);
  assert.throws(() => parsePuzzle(changed.join('')), /no solution/);
});
