import test from "node:test";
import assert from "node:assert/strict";
import { verifyPatch } from "./worker.mjs";

const job = "github:goldener-data/goldener#422";
const base = "a".repeat(40);
const patch = [
  "diff --git a/README.md b/README.md",
  "--- a/README.md",
  "+++ b/README.md",
  "@@ -1 +1,2 @@",
  " Original",
  "+New text",
  "diff --git a/docs/posts/GOLD_DENSITY_WEIGHING.md b/docs/posts/GOLD_DENSITY_WEIGHING.md",
  "new file mode 100644",
  "--- /dev/null",
  "+++ b/docs/posts/GOLD_DENSITY_WEIGHING.md",
  "@@ -0,0 +1 @@",
  "+New document",
  ""
].join("\n");

test("the existing hunk matches and the new path is absent", async () => {
  const read = async (url) => {
    assert.ok(url.includes("/" + base + "/"));
    return url.endsWith("README.md") ? new Response("Original\n") : new Response(null, { status: 404 });
  };
  assert.deepEqual(await verifyPatch(job, { base, patch }, read), { base, files: 2, hunks: 2 });
});

test("changed context or a pre-existing new path prevents a match", async () => {
  await assert.rejects(verifyPatch(job, { base, patch }, async () => new Response("Changed\n")), /context differs/);
  await assert.rejects(verifyPatch(job, { base, patch }, async () => new Response("Original\n")), /already exists/);
});

test("a malformed hunk or unsupported path fails before fetching", async () => {
  const read = () => assert.fail("Unexpected fetch");
  await assert.rejects(verifyPatch(job, { base, patch: patch.replace("+1,2", "+1,3") }, read), /inconsistent/);
  await assert.rejects(verifyPatch(job, { base, patch: patch.replaceAll("README.md", "elsewhere.md") }, read), /unsupported path/);
});

test("an upstream permission error does not count as missing source", async () => {
  const read = async (url) => new Response("Original\n", { status: url.endsWith("README.md") ? 200 : 403 });
  await assert.rejects(verifyPatch(job, { base, patch }, read), /403/);
});
