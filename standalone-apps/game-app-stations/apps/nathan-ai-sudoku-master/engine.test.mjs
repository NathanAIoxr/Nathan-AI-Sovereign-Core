import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generate, solve, clues, candidates, skyscraper } from './engine.mjs';
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
