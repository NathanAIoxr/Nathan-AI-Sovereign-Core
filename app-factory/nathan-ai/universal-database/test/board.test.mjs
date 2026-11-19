import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import { DatabaseSync } from 'node:sqlite';
import { buildBoard } from '../scripts/build.mjs';
import { move, start } from '../src/game.mjs';

const board = await buildBoard();

test('both root migrations can be rerun independently', async () => {
  for (const [root, file] of [['D0', 'd0/0001_origin.sql'], ['D1', 'd1/0001_board.sql']]) {
    const db = new DatabaseSync(':memory:');
    try {
      db.exec('PRAGMA foreign_keys = ON');
      const sql = await readFile(new URL('../migrations/' + file, import.meta.url), 'utf8');
      db.exec(sql);
      db.exec(sql);
      assert.equal(db.prepare('SELECT box_id FROM sovereign_root').get().box_id, root);
      assert.equal(db.prepare('PRAGMA foreign_key_check').all().length, 0);
      if (root === 'D1') {
        assert.equal(db.prepare('SELECT COUNT(*) AS cells FROM board_cell').get().cells, 408);
      }
    } finally {
      db.close();
    }
  }
});

test('each direction visits all 34 rings before returning to the origin', () => {
  for (const direction of ['up', 'down']) {
    let state = start();
    const visited = new Set();
    for (let i = 0; i < 34; i++) {
      assert(!visited.has(state.code));
      visited.add(state.code);
      state = move(board, state, direction);
    }
    assert.equal(state.code, 'D0');
  }
});

test('every edge is reversible at all 408 cells', () => {
  for (const { code } of board.dimensions) {
    for (let sector = 0; sector < board.sectors; sector++) {
      for (const [direction, inverse] of [['up', 'down'], ['down', 'up'], ['cw', 'ccw'], ['ccw', 'cw']]) {
        const state = { ...start(), code, sector };
        const result = move(board, move(board, state, direction), inverse);
        assert.deepEqual([result.code, result.sector], [code, sector]);
      }
    }
  }
});

test('firmament mirrors the sector and the field reverses rotation', () => {
  const rebound = move(board, { ...start(), code: '-12D', sector: 2 }, 'down');
  assert.deepEqual([rebound.code, rebound.sector, rebound.event], ['12D', 10, 'FIRMAMENT_FLIP']);
  const inverted = move(board, { ...start(), code: 'D9', sector: 2 }, 'up');
  assert.deepEqual([inverted.code, inverted.event], ['01D', 'MAGNETIC_FIELD']);
  assert.equal(move(board, inverted, 'cw').sector, 1);
  assert.equal(move(board, { ...start(), code: 'D9', sector: 2 }, 'cw').sector, 3);
});

test('a complete run collects each beacon once and wins only at D0 / 00', () => {
  let state = start();
  for (const [direction, steps] of [
    ['cw', 2], ['down', 11], ['cw', 1], ['ccw', 1], ['down', 3],
    ['cw', 1], ['down', 11], ['ccw', 4], ['down', 9], ['ccw', 5]
  ]) {
    for (let i = 0; i < steps; i++) state = move(board, state, direction);
  }
  assert.deepEqual(state, {
    code: 'D0', sector: 0, moves: 48, collected: ['-11D/2', '11D/9', 'D9/5'],
    won: true, event: null
  });
  assert.strictEqual(move(board, state, 'up'), state);
});
