import assert from "node:assert/strict";
import { test } from "node:test";
import { demoFeedstock, demoJob, refineBatch, sha256 } from "../refinery.mjs";
import worker from "../worker.mjs";

test("the Delftia filter and Cupriavidus refinery produce one reproducible receipt", async () => {
  const input = structuredClone(demoFeedstock);
  const { receipt, receiptHash, forwarded, retained } = await refineBatch(demoJob, input);
  assert.deepEqual(receipt.edge, { forwarded: 2, duplicates: 2, discarded: 2 });
  assert.deepEqual(forwarded.map(event => event.id), ["event-1", "event-2"]);
  assert.deepEqual(receipt.archive.retired, ["tx-failed", "mempool-expired", "orphaned-index", "old-build"]);
  assert.deepEqual(retained.map(item => item.id), ["held-build", "pending-tx"]);
  assert.equal(receipt.archive.reclaimedBytes, receipt.archive.before - receipt.archive.after);
  assert.equal(receipt.candidateCoins, 1 + Math.floor(receipt.archive.reclaimedBytes / 64));
  assert.equal(receiptHash, await sha256(receipt));
  assert.deepEqual(input, demoFeedstock);
  assert.deepEqual(await refineBatch(demoJob, input), { receipt, receiptHash, forwarded, retained });
});

test("raw attack counts and evidence-only lanes earn zero coins", async () => {
  const input = { ...demoFeedstock, archive: [], events: [{ id: "spam-1", kind: "spam" }, { id: "spam-1", kind: "spam" }] };
  const { receipt } = await refineBatch(demoJob, input);
  assert.equal(receipt.edge.discarded, 2);
  assert.equal(receipt.candidateCoins, 0);
  assert.equal(receipt.evidence.length, 4);
});

test("job scope, job cap and resource-window identity are enforced", async () => {
  await assert.rejects(refineBatch(demoJob, { ...demoFeedstock, resource: "other" }), /outside the approved/);
  const regular = await refineBatch(demoJob, demoFeedstock);
  const capped = await refineBatch({ ...demoJob, id: "new-job-label", maxCoins: 1 }, demoFeedstock);
  assert.equal(capped.receipt.candidateCoins, 1);
  assert.equal(regular.receipt.jobKey, capped.receipt.jobKey);
  assert.notEqual(regular.receiptHash, capped.receiptHash);
});

test("staging Worker renders and provides an explicitly unsettled receipt", async () => {
  const base = "https://staging.example";
  const page = await worker.fetch(new Request(base));
  assert.equal(page.status, 200);
  assert.match(await page.text(), /The Cryptocurrency Pooper by Nathan Tabor/);
  const response = await worker.fetch(new Request(base + "/api/demo"));
  assert.equal(response.status, 200);
  const report = await response.json();
  assert.equal(report.settlement, "candidate");
  assert.equal(await sha256(report.receipt), report.receiptHash);
  assert.equal((await worker.fetch(new Request(base + "/api/demo", { method: "POST" }))).status, 405);
});
