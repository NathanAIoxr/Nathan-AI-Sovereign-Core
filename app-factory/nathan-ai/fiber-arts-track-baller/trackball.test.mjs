import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeQuaternion,multiplyQuaternion,dragTrackball} from './trackball.mjs';
const id=[1,0,0,0];
test('identity and zero drag',()=>{assert.deepEqual(multiplyQuaternion(id,id),id);assert.deepEqual(dragTrackball(id,0,0),id)});
test('unit norm and deterministic',()=>{const a=dragTrackball(id,120,-80);assert.ok(Math.abs(Math.hypot(...a)-1)<1e-12);assert.deepEqual(a,dragTrackball(id,120,-80))});
test('bounded displacement',()=>assert.deepEqual(dragTrackball(id,10000,0),dragTrackball(id,500,0)));
test('invalid input rejected',()=>{assert.throws(()=>normalizeQuaternion([0,0,0,0]),RangeError);assert.throws(()=>dragTrackball(id,NaN,1),TypeError)});
