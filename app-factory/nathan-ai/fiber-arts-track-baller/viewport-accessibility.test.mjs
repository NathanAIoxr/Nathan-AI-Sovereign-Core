import test from 'node:test';
import assert from 'node:assert/strict';
import { describeViewportForAccessibility } from './viewport-accessibility.mjs';

test('provides deterministic accessible viewport summary without claiming yarn physics', () => {
  assert.equal(describeViewportForAccessibility({ orientation: [0, 0, 0, 1], zoom: 1.256 }),
    '3D craft view, zoom 1.26 times; orientation controlled by Track Baller');
  assert.equal(describeViewportForAccessibility({ orientation: [0, 0, 0, -1], zoom: 1.256 }),
    '3D craft view, zoom 1.26 times; orientation controlled by Track Baller');
});

test('fails safely on malformed, nonunit, and nonfinite viewport values', () => {
  for (const frame of [null, {}, {orientation:[0,0,0,1],zoom:0},
    {orientation:[0,0,0,2],zoom:1}, {orientation:[0,0,NaN,1],zoom:1},
    {orientation:[0,0,0,1],zoom:Infinity}]) {
    assert.equal(describeViewportForAccessibility(frame), '3D craft view unavailable');
  }
});
