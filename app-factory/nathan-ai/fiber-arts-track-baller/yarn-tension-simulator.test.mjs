import test from 'node:test';
import assert from 'node:assert/strict';
import { simulateYarnTension } from './yarn-tension-simulator.mjs';
test('no extension yields zero tension', () => { const x = simulateYarnTension({ stretchMm: 50, restLengthMm: 100, stiffnessNPerMm: 0.2 }); assert.equal(x.tensionN, 0); assert.equal(x.simulated, true); assert.equal(x.verifiedPhysics, false); });
test('extension uses declared illustrative stiffness', () => { const x = simulateYarnTension({ stretchMm: 110, restLengthMm: 100, stiffnessNPerMm: 0.2 }); assert.equal(x.extensionMm, 10); assert.equal(x.tensionN, 2); });
test('tension is capped', () => { const x = simulateYarnTension({ stretchMm: 300, restLengthMm: 100, stiffnessNPerMm: 1, maxTensionN: 5 }); assert.equal(x.tensionN, 5); assert.equal(x.capped, true); });
test('invalid inputs fail closed', () => { for (const value of [NaN, Infinity, -1]) assert.throws(() => simulateYarnTension({ stretchMm: value, restLengthMm: 100, stiffnessNPerMm: 1 }), RangeError); assert.throws(() => simulateYarnTension({ stretchMm: 2, restLengthMm: 0, stiffnessNPerMm: 1 }), RangeError); });
test('output is immutable and input unchanged', () => { const input = { stretchMm: 110, restLengthMm: 100, stiffnessNPerMm: 1 }; const before = structuredClone(input); const x = simulateYarnTension(input); assert.ok(Object.isFrozen(x)); assert.deepEqual(input, before); });
