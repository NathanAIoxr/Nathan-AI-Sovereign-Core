import test from 'node:test';
import assert from 'node:assert/strict';
import { limitViewportMotion } from './reduced-motion-viewport.mjs';
const a = { zoom: 2, panX: 0, panY: 0, orientation: [1, 0, 0, 0] };
test('default mode preserves proposed simulated viewport', () => {
  const b = { zoom: 8, panX: 100, panY: 100, orientation: [0, 1, 0, 0] };
  assert.deepEqual(limitViewportMotion(a, b), b);
});
test('reduced motion caps vector pan and zoom and holds orientation', () => {
  const b = { zoom: 8, panX: 30, panY: 40, orientation: [0, 1, 0, 0] };
  const r = limitViewportMotion(a, b, { reducedMotion: true, maxPanDelta: 10, maxZoomRatio: 1.1 });
  assert.equal(r.panX, 6); assert.equal(r.panY, 8); assert.equal(r.zoom, 2.2);
  assert.equal(r.orientation, a.orientation);
});
test('supports zoom-out bound and no orientation property', () => {
  const r = limitViewportMotion({zoom: 2,panX:0,panY:0},{zoom:0.01,panX:1,panY:2},{reducedMotion:true});
  assert.equal(r.zoom, 2 / 1.15); assert.equal(Object.hasOwn(r,'orientation'),false);
});
test('rejects nonfinite input and invalid limits', () => {
  assert.throws(()=>limitViewportMotion(a,{zoom:NaN,panX:0,panY:0}),TypeError);
  assert.throws(()=>limitViewportMotion(a,a,{maxZoomRatio:0.5}),RangeError);
});
test('never mutates inputs and freezes output', () => {
  const b={zoom:4,panX:2,panY:3};const original=JSON.stringify(b);
  const r=limitViewportMotion(a,b,{reducedMotion:true});
  assert.equal(JSON.stringify(b),original);assert.ok(Object.isFrozen(r));
});
