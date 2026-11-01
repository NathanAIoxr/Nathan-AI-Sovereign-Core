"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const W = require("./engine.js");

test("exact arithmetic invariants, no fractional bits", () => {
  assert.equal(W.gate(1, 1, "BUILD"), 2);
  assert.equal(W.gate(1, 1, "CLEAR"), 0);
  assert.equal(W.gate(0, 0, "BUILD"), 0);
  assert.throws(() => W.gate(0.5, 1, "BUILD"), TypeError);
  assert.throws(() => W.gate("1", 1, "BUILD"), TypeError);
  assert.throws(() => W.gate(1, 1, "OTHER"), TypeError);
});
test("authorized event evaluates only derived software state", () => {
  const input = {channel: "SENSORY", signal: 1, operatorConsent: 1};
  const copy = JSON.stringify(input);
  const built = W.processEvent(input, "BUILD");
  const cleared = W.processEvent(input, "CLEAR");
  assert.equal(built.derivedValue, 2);
  assert.equal(cleared.derivedValue, 0);
  assert.equal(built.action, "BUILD_DERIVED");
  assert.equal(cleared.action, "CLEAR_DERIVED");
  assert.equal(JSON.stringify(input), copy);
  assert.equal(built.sourcePreserved, true);
});
test("no operator consent means HOLD", () => {
  const result = W.simulate([{channel: "PAIN", signal: 1, operatorConsent: 0}], "CLEAR");
  assert.equal(result.entries[0].action, "HOLD");
  assert.equal(result.entries[0].derivedValue, null);
  assert.deepEqual(result.counts, {evaluated: 1, authorized: 0, held: 1});
  assert.equal(result.noPhysicalControl, true);
});
test("rejects malformed events and invalid claims of bitness", () => {
  assert.throws(() => W.processEvent(null, "BUILD"), TypeError);
  assert.throws(() => W.processEvent({channel:"UNKNOWN", signal:1, operatorConsent:1},"BUILD"), TypeError);
  assert.throws(() => W.processEvent({channel:"ALERT", signal:-1, operatorConsent:1},"BUILD"), TypeError);
  assert.throws(() => W.processEvent({channel:"ALERT", signal:1, operatorConsent:true},"BUILD"), TypeError);
  assert.throws(() => W.simulate(new Array(27).fill({channel:"MOTOR",signal:1,operatorConsent:1}),"BUILD"), TypeError);
  assert.throws(() => W.simulate("nope","BUILD"), TypeError);
});
test("every allowed channel is representable without I/O", () => {
  const events = W.CHANNELS.map(channel => ({channel,signal:1,operatorConsent:1}));
  const result = W.simulate(events, "BUILD");
  assert.equal(result.counts.authorized, 4);
  assert.ok(result.entries.every(x => x.derivedValue === 2));
  assert.equal(result.implementation,"conceptual-software-simulation");
});
