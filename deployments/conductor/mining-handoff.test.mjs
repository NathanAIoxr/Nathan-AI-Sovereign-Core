import assert from "node:assert/strict";
import { test } from "node:test";
import { serveMiningHandoff } from "./mining-handoff.mjs";

const project = "cryptocurrency-mining";
const sourceRevision = "a".repeat(40);
const receipt = {
  id: "handoff:" + project + ":" + sourceRevision, project, sourceRevision, state: "received",
  title: "Inventory <sample>", recipient: "Conductor", lead: "Rocket", verifiedAt: "2026-11-20T17:55:00Z",
  mining: { state: "awaiting-enrolled-hardware", registeredHardware: 0, heartbeats: 0,
    plannedSlots: { super2x: 1000, hyper: 1000 }, acceptedShares: null, payoutsVerified: null },
  proof: { passed: true, hash: "a".repeat(64) },
  work: [{ title: "Mining lesson", url: "https://example.com", status: "Live" }],
  course: { count: 1, modules: ["proof"] }, next: ["Confirm the enrolled device."],
};
const api = "/api/handoffs/" + project;
const path = "/handoffs/" + project;
const ledger = value => ({ prepare: sql => {
  assert.match(sql, /project_handoff_received/);
  assert.match(sql, /cryptocurrency-mining/);
  return { first: async () => value ? { details: JSON.stringify(value), event_id: value.id } : null };
} });
const request = (route, method) => new Request("https://example.test" + route, { method });

test("the mining handoff displays and returns the received ledger entry", async () => {
  const response = await serveMiningHandoff(request(path), path, ledger(receipt));
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /Inventory &lt;sample&gt;/);
  assert.match(html, /Awaiting enrolled hardware/);
  assert.match(html, /0 devices/);
  const json = await serveMiningHandoff(request(api), api, ledger(receipt));
  assert.deepEqual(await json.json(), receipt);
});

test("the route allows HEAD, refuses writes, and reports missing or invalid ledger entries", async () => {
  assert.equal(await (await serveMiningHandoff(request(path, "HEAD"), path, ledger(receipt))).text(), "");
  assert.equal((await serveMiningHandoff(request(path, "POST"), path, ledger(receipt))).status, 405);
  assert.equal((await serveMiningHandoff(request(api), api, ledger(null))).status, 404);
  assert.equal((await serveMiningHandoff(request(api), api, ledger({ ...receipt, project: "other" }))).status, 503);
  assert.equal(serveMiningHandoff(request("/"), "/", ledger(receipt)), null);
});
