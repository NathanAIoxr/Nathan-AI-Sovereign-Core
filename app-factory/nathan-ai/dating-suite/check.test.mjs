import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import test from "node:test";
import { evaluateIntent } from "./relationship-intent/rules.mjs";
import { makeDraft } from "./icu-buddy/drafts.mjs";

const directory = fileURLToPath(new URL(".", import.meta.url));
const projects = JSON.parse(await readFile(new URL("./projects.json", import.meta.url), "utf8"));

test("Act AI evaluates aligned, divergent, uncertain, blocked and expired scenarios", () => {
  const input = { firstIntent: "Dating", secondIntent: "Dating", blocked: false, expired: false };
  assert.equal(evaluateIntent(input).state, "aligned");
  assert.equal(evaluateIntent({ ...input, secondIntent: "Friendship" }).state, "clarify");
  assert.equal(evaluateIntent({ ...input, firstIntent: "Unsure", secondIntent: "Unsure" }).state, "clarify");
  assert.equal(evaluateIntent({ ...input, expired: true }).state, "expired");
  assert.equal(evaluateIntent({ ...input, expired: true, blocked: true }).state, "blocked");
  assert.throws(() => evaluateIntent({ ...input, blocked: "false" }), TypeError);
});

test("iCU Buddy drafts preserve user text and reject unknown or oversized input", () => {
  assert.match(makeDraft("boundary", "  Text before calling.  "), /Text before calling\.$/);
  assert.match(makeDraft("stepBack"), /space\.$/);
  assert.throws(() => makeDraft("toString"), TypeError);
  assert.throws(() => makeDraft("reflect", "a".repeat(301)), TypeError);
});

test("three independent releases serve their site, dependencies, exact HTML and health receipt", async t => {
  const output = await mkdtemp(join(tmpdir(), "dating-build-"));
  t.after(() => rm(output, { recursive: true, force: true }));
  execFileSync(process.execPath, [resolve(directory, "build.mjs"), output]);
  assert.equal(new Set(projects.map(project => project.origin)).size, 3);
  for (const project of projects) {
    const { default: app } = await import(pathToFileURL(join(output, `${project.worker}.mjs`)));
    const request = (path, options) => app.fetch(new Request(new URL(path, project.origin), options));
    const home = await request("/");
    assert.equal(home.status, 200);
    const html = await home.text();
    assert.equal(html, await readFile(resolve(directory, project.entry), "utf8"));
    for (const [, path] of html.matchAll(/(?:href|src)="([^":#]+\.(?:m?js|css|zip))"/g)) {
      assert.equal((await request(path)).status, 200, `${project.id} serves ${path}`);
    }
    const health = await (await request("/healthz")).json();
    assert.equal(health.site, project.id);
    assert.equal(health.worker, project.worker);
    assert.match(health.release, /^[a-f0-9]{16}$/);
    assert.equal((await request("/", { headers: { "If-None-Match": home.headers.get("ETag") } })).status, 304);
    assert.equal(await (await request("/", { method: "HEAD" })).text(), "");
    assert.equal((await request("/", { method: "POST" })).status, 405);
    assert.equal((await request("/missing")).status, 404);
  }
});

test("mobile and keyboard accessibility smoke checks for reconstructed previews", async () => {
  const css = await readFile(new URL("./style.css", import.meta.url), "utf8");
  assert.match(css, /input:focus-visible/);
  assert.match(css, /button\s*\{[^}]*min-height:\s*44px/s);
  assert.match(css, /select, textarea\s*\{[^}]*min-height:\s*44px/s);
  for (const path of ["relationship-intent/index.html", "icu-buddy/index.html"]) {
    const html = await readFile(resolve(directory, path), "utf8");
    assert.match(html, /<html lang="en">/);
    assert.match(html, /name="viewport" content="width=device-width, initial-scale=1"/);
    assert.match(html, /<main>/);
    assert.match(html, /<h1>/);
    assert.match(html, /<label for="/);
    assert.match(html, /role="status"/);
    assert.match(html, /type="reset"/);
  }
});
