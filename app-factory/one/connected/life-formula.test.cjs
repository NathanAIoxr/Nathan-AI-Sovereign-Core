"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const {createNodeProtocol, LIFE_SEQUENCE, PROPOSED_COLLECTIVE_CAPACITY} = require("./life-formula.js");

test("denied by default, no uncontrolled activation", () => {
  const p = createNodeProtocol();
  assert.throws(() => p.register("one"), /not authorized/);
  assert.equal(p.list().length, 0);
});
test("four ordered phases then running and reversible shutdown", () => {
  const events = [];
  const p = createNodeProtocol({authorize: () => true, onEvent: e => events.push(e.event)});
  p.register("one");
  assert.equal(p.activate("one").state, "RUNNING");
  assert.deepEqual(events.slice(1, 5), LIFE_SEQUENCE);
  assert.equal(p.stop("one").state, "STOPPED");
  assert.equal(p.snapshot("one").enabled, false);
});
test("capacity and duplicate guards", () => {
  const p = createNodeProtocol({maxActive:1, authorize: () => true});
  p.register("one");
  assert.throws(() => p.register("one"), /Duplicate/);
  assert.throws(() => p.register("two"), /Capacity/);
  assert.equal(PROPOSED_COLLECTIVE_CAPACITY.toString(), "732000000");
});
