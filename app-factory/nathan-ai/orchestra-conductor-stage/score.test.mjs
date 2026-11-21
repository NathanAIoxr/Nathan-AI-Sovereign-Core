import assert from 'node:assert/strict';
import { test } from 'node:test';
import { interval, locate, scores } from './web/score.mjs';

test('STOMP STOMP CLAP REST repeats every four cues and stays in tempo', () => {
  const { stomp } = scores;
  assert.deepEqual(Array.from({ length: 8 }, (_, i) => locate(stomp, i).sound),
    ['stomp', 'stomp', 'clap', 'rest', 'stomp', 'stomp', 'clap', 'rest']);
  assert.equal(interval(stomp, 120), .5);
});

test('6/8 score respects measure, stanza, and performance boundaries', () => {
  const { stille } = scores;
  assert.deepEqual(stille.sounds, ['accent', 'tick', 'tick', 'accent', 'tick', 'tick']);
  assert.equal(interval(stille, 60), 1 / 3);
  assert.equal(locate(stille, 71).stanza, 1);
  assert.equal(locate(stille, 72).stanza, 2);
  assert.deepEqual(locate(stille, 431), { beat: 5, measure: 72, finished: false, stanza: 6, sound: 'tick' });
  assert.equal(locate(stille, 432).finished, true);
});
