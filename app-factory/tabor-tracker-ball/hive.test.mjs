import assert from "node:assert/strict";
import { test } from "node:test";
import { createPattern, domainBees, orbit, patternPositions, previousBees, propose, resolve, stepPattern } from "./public/hive-core.mjs";

test("the bee registry contains the ten prior roles and eleven domain roles", () => {
  assert.equal(previousBees.length, 10);
  assert.equal(domainBees.length, 11);
  assert.equal(new Set([...previousBees, ...domainBees.map(([name]) => name)]).size, 21);
});

test("normal and reverse move independently and transpose to vertical", () => {
  const first = stepPattern(createPattern(), "both", "both");
  assert.deepEqual(patternPositions(first, "horizontal").normal, [4, 2]);
  assert.deepEqual(patternPositions(first, "horizontal").reverse, [4, 6]);
  assert.deepEqual(patternPositions(first, "vertical").normal, [2, 4]);
  assert.deepEqual(patternPositions(first, "vertical").reverse, [6, 4]);
  const second = stepPattern(first, "reverse", "left");
  assert.equal(second.normal, first.normal);
  assert.equal(second.reverse.steps, 2);
});

test("a zero net display retains ongoing motion in both lanes", () => {
  let frame = createPattern();
  for (let tick = 0; tick < 97; tick++) {
    frame = stepPattern(frame, "both", "both");
    assert.equal(patternPositions(frame, "horizontal").netSpin, 0);
    assert.equal(patternPositions(frame, "horizontal").netPhase, 0);
  }
  assert.equal(frame.left.steps, 97);
  assert.equal(frame.right.steps, 97);
  assert.deepEqual(patternPositions(frame, "horizontal").left, orbit.at(-1));
  assert.deepEqual(patternPositions(frame, "horizontal").right, orbit[1]);
  const offset = stepPattern(frame, "both", "right");
  const paired = stepPattern(offset, "both", "both");
  assert.equal(patternPositions(paired, "vertical").netSpin, 1);
  assert.equal(patternPositions(paired, "vertical").netPhase, 1);
});

test("sample handoffs require a choice and cannot be applied twice", () => {
  assert.throws(() => propose("Unknown"), RangeError);
  const pending = propose("Sensor", true);
  assert.equal(pending.state, "proposed");
  assert.equal(resolve(pending, "anything else"), pending);
  const held = resolve(pending, "hold");
  assert.equal(held.state, "held");
  assert.equal(resolve(held, "approve"), held);
  const approved = resolve(pending, "approve");
  assert.equal(approved.state, "observed");
  assert.match(approved.result, /Zero device writes/);
  assert.match(approved.specialist, /dissolved/);
  assert.equal(resolve(approved, "approve"), approved);
});
