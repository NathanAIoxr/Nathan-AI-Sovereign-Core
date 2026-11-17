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
  await assert.rejects(verifyPatch(job, { base, patch }, async url =>
    url.endsWith("README.md") ? new Response("Changed\n") : new Response(null, { status: 404 })), /context differs/);
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

test("a registered GitHub handoff supports blank context and rejects a mismatched repository", async () => {
  const markdown = [
    "diff --git a/docs/guide.md b/docs/guide.md",
    "--- a/docs/guide.md",
    "+++ b/docs/guide.md",
    "@@ -1,3 +1,3 @@",
    " Heading",
    "",
    "-Old",
    "+New",
    ""
  ].join("\n");
  const read = async url => {
    assert.equal(url, `https://raw.githubusercontent.com/Example/docs/${base}/docs/guide.md`);
    return new Response("Heading\n\nOld\n");
  };
  const receipt = { base, patch: markdown };
  assert.deepEqual(await verifyPatch("github:example/docs#8", receipt, read, "Example/docs"),
    { base, files: 1, hunks: 1 });
  await assert.rejects(verifyPatch("github:example/docs#8", receipt, read, "Other/docs"), /pinned Git revision/);
});

test("GitHub contents can supply the same pinned source when raw fetch is unavailable", async () => {
  const read = async url => {
    const target = new URL(url);
    if (target.hostname === "raw.githubusercontent.com") throw new TypeError("Connection unavailable");
    assert.equal(target.hostname, "api.github.com");
    assert.equal(target.searchParams.get("ref"),base);
    return target.pathname.endsWith("README.md") ?
      Response.json({type:"file",encoding:"base64",content:btoa("Original\n")}) :
      new Response(null,{status:404});
  };
  assert.deepEqual(await verifyPatch(job, {base,patch}, read), {base,files:2,hunks:2});
});

test("immutable Git snapshots support scheduled source checks without network egress", async () => {
  const source = "Original\n";
  const {createHash} = await import("node:crypto");
  const sha256 = createHash("sha256").update(source).digest("hex");
  const lookup = async (repository, revision, path) => {
    assert.equal(repository,"goldener-data/goldener");
    assert.equal(revision,base);
    return path === "README.md"
      ? {present:1,source,sha256}
      : {present:0,source:null,sha256:null};
  };
  const read = () => assert.fail("Pinned files should not make network requests");
  assert.deepEqual(await verifyPatch(job,{base,patch},read,undefined,lookup),{base,files:2,hunks:2,snapshots:2});
  await assert.rejects(verifyPatch(job,{base,patch},read,undefined,async () => ({
    present:1,source:"Changed\n",sha256
  })),/checksum differs/);
});
