import assert from 'node:assert/strict';
import { test } from 'node:test';
import { clock, createRoute, defaults, duration, sample, simulationExport } from './timeline.mjs';

test('default route preserves the requested speed and stops', () => {
  const route = createRoute();
  assert.equal(sample(route, 0).mph, 110);
  assert.equal(sample(route, 599.9).stage, 0);
  assert.equal(sample(route, 600).stage, 1);
  assert.equal(sample(route, 600).mph, 0);
  assert.equal(clock(route[1].seconds), '01:37:00');
  assert.equal(sample(route, 6419.99).stage, 1);
  assert.equal(sample(route, 6420).stage, 2);
  assert.equal(clock(route[2].seconds), '00:02:00');
  assert.equal(duration(route), 6540);
  assert.equal(sample(route, 6540).done, true);
});

test('route validation, editing and clamping', () => {
  assert.throws(() => createRoute({ ...defaults, highway: 0 }), RangeError);
  assert.throws(() => createRoute({ ...defaults, mph: Infinity }), RangeError);
  const route = createRoute({ ...defaults, highway: 3, mph: 55, dinner: 4 });
  assert.equal(sample(route, -10).mph, 55);
  assert.equal(sample(route, 180).stage, 1);
  assert.equal(sample(route, 99999).elapsed, duration(route));
});

test('exports a plainly marked fictional timeline', () => {
  const data = simulationExport(createRoute());
  assert.equal(data.simulated, true);
  assert.equal(data.type, 'scrambler-simulation');
  assert.equal(data.route[1].seconds, 5820);
  assert.doesNotMatch(JSON.stringify(data), /latitude|longitude|coordinates/i);
});
