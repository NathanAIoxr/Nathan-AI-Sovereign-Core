import test from "node:test";
import assert from "node:assert/strict";
import worker, {batchForTime, recordTick} from "./worker.mjs";
import {OWNER, NODES, EDGES, TASKS, INTEGRATIONS} from "./registry.mjs";

const nodeById = new Map(NODES.map(n => [n.id, n]));
const allowedKinds = new Set(["creator","scriptural_anchor","philosophical_comparison","persona","folklore_adapter","original_concept","family_metaphor","original_character","creative_world","source_current_spelling","source_variant","symbolic_creature","agent_role","existing_project"]);
const allowedRelations = new Set(["created_persona","interpreted_with","compared_to","contrasting_modes","adaptation_association","symbolic_association","complementary_family_metaphor","illustrates","story_duo","character_in","thematic_not_identity","contains","contains_repository_spelling","variant_conflict_needs_review","twins_of_mas","twins_of_spirit_in_repository","preserved_by","software_role_inspired_by","included_in","orchestrates","thematically_related","archive_crosslink"]);

test("PD-010 graph has unique, typed, non-dangling nodes and explicitly labeled creative edges", () => {
  assert.equal(nodeById.size, NODES.length);
  assert.equal(OWNER, "Nathan Tabor");
  for (const node of NODES) {
    assert.match(node.id, /^[a-z][a-z0-9-]+$/);
    assert.ok(node.name.trim() && node.summary.trim());
    assert.ok(allowedKinds.has(node.kind), node.kind);
  }
  const keys = new Set();
  for (const edge of EDGES) {
    assert.ok(nodeById.has(edge.from), edge.from);
    assert.ok(nodeById.has(edge.to), edge.to);
    assert.ok(allowedRelations.has(edge.relation), edge.relation);
    assert.equal(edge.assertion, "creative_crosslink");
    const key = [edge.from, edge.to, edge.relation].join(":");
    assert.ok(!keys.has(key), key);
    keys.add(key);
  }
});

test("PD-010 original, folklore, theology, software, and variants cannot collapse into one author identity", () => {
  assert.equal(nodeById.get("isaiah").kind, "scriptural_anchor");
  assert.equal(nodeById.get("yin-yang").kind, "philosophical_comparison");
  assert.equal(nodeById.get("belsnickel").kind, "folklore_adapter");
  assert.equal(nodeById.get("santa").kind, "persona");
  assert.equal(nodeById.get("santa-ai").kind, "agent_role");
  assert.equal(nodeById.get("buddy").kind, "original_character");
  assert.equal(nodeById.get("hunny").kind, "original_character");
  assert.equal(nodeById.get("supmalg").kind, "source_current_spelling");
  assert.equal(nodeById.get("supmals").kind, "source_variant");
  assert.notEqual(nodeById.get("supmalg").id, nodeById.get("supmals").id);
  assert.ok(EDGES.some(e => e.from === "supmalg" && e.to === "supmals" && e.relation === "variant_conflict_needs_review"));
  assert.ok(EDGES.some(e => e.from === "buddy" && e.to === "dog-ai" && e.relation === "thematic_not_identity"));
  assert.ok(!EDGES.some(e => e.relation === "is_same_person" || e.relation === "owns_third_party_ip"));
});

test("PD-010 integration references cannot silently become credentials, sync or execution", () => {
  assert.ok(INTEGRATIONS.length > 0);
  for (const item of INTEGRATIONS) {
    assert.equal(item.mode, "reference_only");
    assert.ok(["github_path","cloudflare_script"].includes(item.type));
    assert.ok(!("token" in item || "secret" in item || "password" in item));
  }
  assert.equal(new Set(TASKS.map(t => t.id)).size, TASKS.length);
  assert.ok(TASKS.every(t => t.dispatch === false && t.status === "pending_review"));
});

test("PD-010 public endpoints are read-only and do not report review as execution", async () => {
  for (const path of ["/api/graph","/api/backlog","/api/integrations","/api/health"]) {
    const r = await worker.fetch(new Request("https://example.test"+path), {});
    assert.equal(r.status, 200);
    assert.equal(r.headers.get("cache-control"), "no-store");
  }
  for (const method of ["POST","PUT","PATCH","DELETE"]) {
    const r = await worker.fetch(new Request("https://example.test/api/graph",{method}), {});
    assert.equal(r.status, 405);
  }
  const backlog = await (await worker.fetch(new Request("https://example.test/api/backlog"),{})).json();
  assert.equal(backlog.automated_execution, false);
  assert.ok(backlog.tasks.every(t => t.dispatch === false));
  const receipt = await recordTick({scheduledTime: Date.parse("2026-11-18T21:15:00Z")}, {});
  assert.equal(receipt.result, "queued_for_review_not_executed");
  assert.equal(receipt.external_dispatch, false);
  assert.equal(receipt.mutations_to_other_services, 0);
  assert.equal(batchForTime(Date.parse("2026-11-18T21:15:00Z")).length, 3);
});
