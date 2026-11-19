import test from 'node:test';
import assert from 'node:assert/strict';
import { advance, createGame, stages } from '../public/game.mjs';

const tick = 1 / 60;
const step = (game, input = {}) => advance(game, input, tick);

function walk(game, x) {
  if (game.run === 'mirror') x = 480 - x;
  for (let frame = 0; frame < 260 && Math.abs(game.player.x - x) > 2; frame++) {
    step(game, game.player.x < x ? { right: true } : { left: true });
  }
  assert.ok(Math.abs(game.player.x - x) <= 2, `Reach x=${x}`);
}

function settle(game, y) {
  for (let frame = 0; frame < 120 && (!game.player.grounded || game.player.y !== y); frame++) step(game);
  assert.equal(game.player.y, y, `Land on platform y=${y}`);
  assert.equal(game.player.grounded, true);
}

function jump(game, y) {
  step(game, { jump: true });
  settle(game, y);
}

function paint(game, index) {
  const bay = game.bays[index];
  walk(game, stages[game.stageIndex].bays[index][0]);
  assert.equal(game.player.y, bay.y);
  for (let action = 0; action < 3; action++) step(game, { brush: true });
  assert.equal(bay.step, 3);
}

for (const run of ['classic', 'mirror']) {
  test(`a complete three-stage ${run} run uses ordinary movement, brush, and star inputs`, () => {
    let game = createGame(0, 0, run);
    walk(game, 120); jump(game, 224); paint(game, 0);
    walk(game, 260); settle(game, 171); paint(game, 1);
    walk(game, 369); assert.equal(game.relic, true);
    walk(game, 274); jump(game, 118); jump(game, 63); paint(game, 2);
    walk(game, 407); step(game, { flip: true }); assert.equal(game.ending, 'clear');

    game = createGame(1, game.score, run);
    walk(game, 382); jump(game, 223); paint(game, 0);
    walk(game, 275); jump(game, 115); assert.equal(game.sticker, true);
    walk(game, 133); settle(game, 169); paint(game, 1);
    walk(game, 250); jump(game, 115); paint(game, 2);
    walk(game, 365); assert.equal(game.relic, true);
    walk(game, 244); jump(game, 59); paint(game, 3);
    walk(game, 82); step(game, { flip: true }); assert.equal(game.ending, 'clear');

    game = createGame(2, game.score, run);
    walk(game, 109); jump(game, 223); paint(game, 0);
    walk(game, 223); jump(game, 167); paint(game, 1);
    walk(game, 395); settle(game, 112); paint(game, 2);
    walk(game, 313); assert.equal(game.relic, true);
    jump(game, 55); paint(game, 3);
    walk(game, 126); step(game, { flip: true }); assert.equal(game.ending, 'win');
    assert.ok(game.score > 5000);
  });
}

test('the sticker turns hazards into gold, clears rats, and launches the player', () => {
  const game = createGame();
  const [x, y] = game.stage.sticker;
  Object.assign(game.player, { x, y });
  game.rats = 62;
  game.drips = [{ x: 300, y: 33, vy: 90 }];
  step(game);
  assert.equal(game.sticker, true);
  assert.equal(game.drips.length, 0);
  assert.equal(game.motes.length, 1);
  assert.ok(game.player.vy < 0);
  assert.ok(game.rats < 32);
  assert.equal(game.score, 385);
});

test('star gates and both loss conditions are enforced', () => {
  const game = createGame(2);
  const [x, y] = stages[2].star;
  Object.assign(game.player, { x, y });
  step(game, { flip: true });
  assert.match(game.message, /paint 4 more bays and grab the sticker/);
  assert.equal(game.ending, '');
  game.time = tick;
  step(game);
  assert.equal(game.ending, 'time');
  const idle = createGame();
  for (let frame = 0; frame < 720 && !idle.ending; frame++) step(idle);
  assert.equal(idle.ending, 'rats');
});
