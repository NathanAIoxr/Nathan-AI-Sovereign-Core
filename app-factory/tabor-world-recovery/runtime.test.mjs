import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { handleRuntime } from "./runtime-api.mjs";

const root = new URL("../../", import.meta.url);
const load = async path => JSON.parse(await readFile(new URL(path, root), "utf8"));
const revision = "f".repeat(40);
async function call(route, body, status = 200) {
  const response = await handleRuntime(new Request("https://runtime.example/api/runtime/" + route, body === undefined ? {} :
    { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) }), load, revision);
  assert.equal(response.status, status);
  return response.json();
}
test("a restored mind retains its source and executes its encoded function", async () => {
  const group = await call("roster?group=g0");
  assert.equal(group.count, 763);
  assert.equal(group.profiles.length, 80);
  const { profiles: [archivist] } = await call("roster?group=g0&q=Archivist");
  const profile = await call("profile?id=" + archivist.id);
  assert.equal(profile.original.name, "Archivist");
  assert.equal(profile.original.purpose, "Preserve verbatim originals; attach source IDs; never silently edit originals.");
  assert.equal(profile.facets.functionality[0].value, profile.original.purpose);
  const text = "\ufeff Preserve\r\nOriginal UTF-8 😃 ";
  const run = await call("run", { id: profile.id, action: "restore", text });
  assert.equal(run.result.restored, text);
  assert.equal(run.result.exactRoundTrip, true);
  assert.match(run.receipt.id, /^[0-9a-f]{64}$/);
  const repeat = await call("run", { id: profile.id, action: "restore", text });
  assert.equal(repeat.receipt.id, run.receipt.id);
  await call("run", { id: profile.id, action: "retire" }, 400);
});

test("the four devices maintain independent capabilities and share an ordered fictional scene", async () => {
  const group = await call("roster?group=tabor");
  assert.equal(group.profiles.length, 4);
  const b = await call("run", { id: "tabor:0", action: "manifest", choice: "automatic",
    scene: { obstacle: "Fracture" } });
  assert.equal(b.result.form, "Bridged Edge");
  assert.equal(b.result.chosenBy, "blade");
  assert.equal(b.result.scene.obstacle, "Clear");
  const relay = await call("relay", { scene: b.result.scene, steps: [
    { id: "tabor:1", action: "weave" }, { id: "tabor:1", action: "weave" }, { id: "tabor:3", action: "sanctuary" },
  ] });
  assert.equal(relay.steps[0].result.scene.shadow, "held");
  assert.equal(relay.steps[1].result.scene.shadow, "converted");
  assert.equal(relay.result.scene.sanctuary, true);
  assert.equal(relay.steps[2].result.canon, "Innocence is God");
  const prev = await call("run", { id: "tabor:1", action: "timeline", scene: relay.result.scene });
  assert.equal(prev.result.scene.sanctuary, false);
  const dream = await call("run", { id: "tabor:1", action: "dream", text: "A light crossing the Loom" });
  assert.deepEqual(dream.result.scene.dreams, ["A light crossing the Loom"]);
  const retire = await call("run", { id: "tabor:2", action: "retire" });
  assert.equal(retire.result.scene.shadow, "retired");
});

test("source facets select from executable tools and a relay can transfer working text", async () => {
  const first = await call("profile?id=g0:0");
  const classify = await call("roster?group=g0&q=classifier");
  const verify = await call("roster?group=g0&q=Validator");
  assert.ok(classify.count && verify.count);
  const output = await call("relay", { text: "first\nsecond", steps: [
    { id: first.id, action: "observe" }, { id: first.id, action: "restore" },
  ] });
  assert.equal(output.steps.length, 2);
  assert.equal(output.result.working, "first\nsecond");
  assert.match(output.receipt.outputSha256, /^[0-9a-f]{64}$/);
  const typed = await call("relay", { text: "# Draft\n- Check sources\nIs it ready?", steps: [
    { id: classify.profiles[0].id, action: "classify" }, { id: verify.profiles[0].id, action: "verify" },
  ] });
  assert.equal(typed.result.working, "- Check sources");
  assert.equal(typed.steps[1].result.actual, createHash("sha256").update("- Check sources").digest("hex"));
  await call("relay", { steps: [{ id: "tabor:0", action: "manifest" }, null] }, 400);
});
