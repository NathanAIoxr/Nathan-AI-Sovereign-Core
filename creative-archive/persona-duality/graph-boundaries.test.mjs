import test from "node:test";
import assert from "node:assert/strict";
import worker, {batchForTime, recordTick} from "./worker.mjs";
import {NODES, EDGES, TASKS, INTEGRATIONS, SCRIPTURE} from "./registry.mjs";

test("all graph edges are references, not identity assertions", () => {
  const ids = new Set(NODES.map(node => node.id));
  assert.equal(ids.size, NODES.length);
  for (const edge of EDGES) {
    assert.ok(ids.has(edge.from) && ids.has(edge.to), JSON.stringify(edge));
    assert.notEqual(edge.from, edge.to);
    assert.equal(edge.assertion, "creative_crosslink");
    assert.notMatch(edge.relation, /^(same_as|identical_to|is)$/);
  }
  assert.equal(SCRIPTURE, "Isaiah 45:7 (KJV)");
  assert.notEqual(NODES.find(x => x.id === "isaiah").kind, "persona");
  assert.notEqual(NODES.find(x => x.id === "yin-yang").kind, "scriptural_anchor");
});

test("MAS SPIRIT spellings remain separately discoverable", async () => {
  const response = await worker.fetch(new Request("https://example.test/api/graph"), {});
  const graph = await response.json();
  assert.equal(response.status, 200);
  assert.equal(graph.nodes.find(x => x.id === "supmalg").name, "SANTA SUPMALG");
  assert.equal(graph.nodes.find(x => x.id === "supmals").name, "SANTA SUPMALS");
  assert.ok(graph.edges.some(x => x.from === "supmalg" && x.to === "supmals" && x.relation === "variant_conflict_needs_review"));
});

test("review rotation stays bounded and does not mark work complete", async () => {
  const seen = new Set();
  for (let slot = 0; slot < TASKS.length; slot++) {
    const batch = batchForTime(slot * 900000);
    assert.equal(batch.length, 3);
    assert.equal(new Set(batch.map(x => x.id)).size, 3);
    for (const item of batch) {
      assert.ok(TASKS.some(task => task.id === item.id));
      seen.add(item.id);
    }
  }
  assert.equal(seen.size, TASKS.length);
  const receipt = await recordTick({scheduledTime: Date.parse("2026-11-19T15:15:00Z")}, {});
  assert.equal(receipt.result, "queued_for_review_not_executed");
  assert.equal(receipt.receipt_saved, false);
  assert.equal(receipt.external_dispatch, false);
  assert.equal(receipt.mutations_to_other_services, 0);
});

test("read-only API does not expose credentials or allow mutation", async () => {
  for (const path of ["/api/health", "/api/graph", "/api/backlog", "/api/integrations", "/api/receipts"]) {
    const response = await worker.fetch(new Request("https://example.test" + path), {});
    assert.equal(response.status, 200, path);
    assert.doesNotMatch(await response.text(), /private[_-]?key|api[_-]?token|BEGIN PRIVATE KEY/i);
  }
  for (const method of ["POST", "PUT", "PATCH", "DELETE"]) {
    const response = await worker.fetch(new Request("https://example.test/api/graph", {method}), {});
    assert.equal(response.status, 405);
  }
  assert.ok(INTEGRATIONS.every(x => x.mode === "reference_only"));
});
