import test from 'node:test';import assert from 'node:assert/strict';import {assessCycle,evaluateIndependentPots} from './engine.mjs';
test('net after expenses',()=>{const r=assessCycle({grossReceipts:20,energyKwh:10,energyRate:0.5,fees:2,computeCost:3,openingPot:100,maxLoss:10});assert.equal(r.net,10);assert.equal(r.closingPot,110);assert.equal(r.decision,'SIMULATED_ACCEPT')});
test('stop loss holds',()=>assert.equal(assessCycle({grossReceipts:0,fees:5,maxLoss:4}).decision,'HOLD'));
test('no loss allowed by default',()=>assert.equal(assessCycle({fees:1}).decision,'HOLD'));
test('independent pots',()=>assert.equal(evaluateIndependentPots([{projectId:'voice-box',cycle:{}},{projectId:'sovereign-coins',cycle:{}}]).length,2));
test('reject duplicates',()=>assert.throws(()=>evaluateIndependentPots([{projectId:'a'},{projectId:'a'}])));
