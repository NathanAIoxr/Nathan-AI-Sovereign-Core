import assert from 'node:assert/strict';
import test from 'node:test';
import { createRoute, duration, sample, simulationExport } from './timeline.mjs';
import { describeScenario, draftScenario, importScenario, routeMetrics } from './scenario.mjs';

test('Nathan AI reads the original example and computes the route totals', () => {
  const route = draftScenario('Highway at 110 mph for 10 minutes then Dinner for 1 hour 37 minutes; Parking-lot goodbye for 2 minutes');
  assert.deepEqual(route.map(item => [item.seconds, item.mph]), [[600, 110], [5820, 0], [120, 0]]);
  assert.deepEqual(draftScenario(describeScenario(route)), route);
  assert.equal(routeMetrics(route).miles.toFixed(2), '18.33');
  assert.equal(routeMetrics(route).travelSeconds, 600);
  assert.equal(routeMetrics(route).stopSeconds, 5940);
});

test('custom playback handles moving and stationary stages and clips to the final stage', () => {
  const route = draftScenario('Pause for 1 second\nDrive at 25 mph for 00:02:00\nWait for a friend for 4 min\nReturn at 40 mph for 5m');
  assert.equal(sample(route, 0).mph, 0);
  assert.equal(sample(route, 1).mph, 25);
  assert.equal(sample(route, 121).stage, 2);
  assert.equal(sample(route, 361).mph, 40);
  assert.equal(sample(route, duration(route)).stage, 3);
  assert.equal(sample(route, 1000).done, true);
  assert.equal(sample(draftScenario('Pause for 1 minute'), 120).stage, 0);
});

test('rejects ambiguous or invalid durations and speeds', () => {
  for (const line of ['Dinner sometime', 'Dinner for longer', 'Dinner for 99:99:99',
    'Dinner for 0 min', 'Highway at 201 mph for 10 minutes', 'Dinner for 7 hours']) {
    assert.throws(() => draftScenario(line));
  }
  assert.throws(() => draftScenario(Array(17).fill('Dinner for 2 minutes').join('\n')));
  assert.throws(() => draftScenario(Array(5).fill('Dinner for 5 hours').join('\n')));
});

test('imports original and current exports and rejects incorrect totals or non-simulations', () => {
  const current = simulationExport(createRoute());
  const original = { ...current };
  delete original.version;
  assert.deepEqual(importScenario(JSON.stringify(original)), importScenario(JSON.stringify(current)));
  assert.throws(() => importScenario(JSON.stringify({ ...current, simulated: false })));
  assert.throws(() => importScenario(JSON.stringify({ ...current, totalSeconds: 0 })));
  assert.throws(() => importScenario(JSON.stringify({ ...current, version: 99 })));
});
