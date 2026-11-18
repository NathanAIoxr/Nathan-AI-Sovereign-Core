import test from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_POLICY, scheduleActions, monthlyPacing, parseLocalQuota } from "./capacity-policy.mjs";

test("every minute is schedulable but not a queue batch", () => {
  assert.deepEqual(scheduleActions(Date.parse("2026-11-18T22:01:00Z")), {
    cron_invoked: true, sample: false, heartbeat: false
  });
});
test("five minute ticks record a sample without posting heartbeat", () => {
  const r = scheduleActions(Date.parse("2026-11-18T22:05:00Z"));
  assert.equal(r.sample, true);
  assert.equal(r.heartbeat, false);
});
test("quarter-hour ticks post one heartbeat", () => {
  const r = scheduleActions(Date.parse("2026-11-18T22:15:00Z"));
  assert.equal(r.sample, true);
  assert.equal(r.heartbeat, true);
});
test("UTC crossing and zero minute continue safely", () => {
  assert.equal(scheduleActions(Date.parse("2026-11-18T23:00:00Z")).heartbeat, true);
});
test("invalid scheduled time fails", () => {
  assert.throws(() => scheduleActions(NaN), TypeError);
});
test("reserve avoids pretending full subscription is free to consume", () => {
  const p = monthlyPacing();
  assert.equal(p.workerRequestAveragePerMinute, 219);
  assert.equal(p.workerCpuMsAveragePerMinute, 659);
  assert.equal(p.basis.startsWith("hypothetical"), true);
});
test("month length changes pacing, missing billing usage remains unknown", () => {
  const p = monthlyPacing({days: 31});
  assert.ok(p.workerRequestAveragePerMinute < monthlyPacing({days:30}).workerRequestAveragePerMinute);
  assert.throws(() => monthlyPacing({days:1}), RangeError);
});
test("local self-throttle accepts only bounded integer controls", () => {
  assert.equal(parseLocalQuota(), 200);
  assert.equal(parseLocalQuota("150"), 150);
  assert.throws(() => parseLocalQuota("0"), RangeError);
  assert.throws(() => parseLocalQuota("4000"), RangeError);
  assert.throws(() => parseLocalQuota("garbage"), RangeError);
});
test("queue estimate counts more than one operation per message", () => {
  assert.equal(monthlyPacing().approximateDeliveredQueueMessagesIncluded, 333333);
  assert.equal(DEFAULT_POLICY.localQueueMessagesPerDay, 200);
});
