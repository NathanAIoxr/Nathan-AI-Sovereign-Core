import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import test from "node:test";
import { makeDraft } from "./public/drafts.mjs";

const directory = fileURLToPath(new URL(".", import.meta.url));
const project = JSON.parse(await readFile(new URL("./app.json", import.meta.url), "utf8"));

test("iCU Buddy drafts preserve user text and reject unknown or oversized input", () => {
  assert.match(makeDraft("boundary", "  Text before calling.  "), /Text before calling\.$/);
  assert.match(makeDraft("stepBack"), /space\.$/);
  assert.throws(() => makeDraft("toString"), TypeError);
  assert.throws(() => makeDraft("reflect", "a".repeat(301)), TypeError);
});

test("standalone Worker serves its own site, assets and health receipt", async t => {
  const output = await mkdtemp(join(tmpdir(), "dating-build-"));
  t.after(() => rm(output, { recursive: true, force: true }));
  execFileSync(process.execPath, [resolve(directory, "build.mjs"), output]);
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
  assert.equal((await request("/dating-suite/")).status, 404);
  assert.doesNotMatch(html, /dating-suite/);
});

test("mobile and keyboard accessibility smoke checks for reconstructed previews", async () => {
  const css = await readFile(new URL("./public/style.css", import.meta.url), "utf8");
  assert.match(css, /input:focus-visible/);
  assert.match(css, /button\s*\{[^}]*min-height:\s*44px/s);
  assert.match(css, /select, textarea\s*\{[^}]*min-height:\s*44px/s);
  const html = await readFile(resolve(directory, project.entry), "utf8");
  assert.match(html, /<html lang="en">/);
  assert.match(html, /name="viewport" content="width=device-width, initial-scale=1"/);
  assert.match(html, /<main>/);
  assert.match(html, /<h1>/);
  assert.match(html, /<label for="/);
  assert.match(html, /role="status"/);
  assert.match(html, /type="reset"/);
});

test("editable draft interaction handlers work with fictional local input", async () => {
  const handlers = new Map();
  let focused = false;
  const draft = { value: "", focus() { focused = true; } };
  const approach = { value: "boundary", focus() { focused = true; } };
  const note = { value: "Please ask before visiting." };
  const form = {
    elements: { approach, note, draft },
    addEventListener(type, callback) { handlers.set(type, callback); }
  };
  const panel = { hidden: true };
  const status = { textContent: "" };
  const elements = new Map([
    ["#draft-form", form], ["#draft-panel", panel], ["#status", status]
  ]);
  const previousDocument = globalThis.document;
  globalThis.document = { querySelector(selector) { return elements.get(selector); } };
  try {
    await import(new URL(`./public/page.mjs?test=${Date.now()}`, import.meta.url));
    let prevented = false;
    handlers.get("submit")({ preventDefault() { prevented = true; } });
    assert.equal(prevented, true);
    assert.equal(panel.hidden, false);
    assert.equal(focused, true);
    assert.match(draft.value, /Please ask before visiting\.$/);
    assert.equal(status.textContent, "Draft ready to edit.");
    approach.value = "unrecognized";
    focused = false;
    handlers.get("submit")({ preventDefault() {} });
    assert.equal(panel.hidden, true);
    assert.equal(status.textContent, "Choose a starting point and keep your note within 300 characters.");
    assert.equal(focused, true);
    approach.value = "boundary";
    draft.value = "Edited locally by the user.";
    assert.equal(draft.value, "Edited locally by the user.");
    focused = false;
    handlers.get("reset")();
    assert.equal(panel.hidden, true);
    assert.equal(status.textContent, "");
    assert.equal(focused, true, "reset restores keyboard focus to starting point");
  } finally {
    if (previousDocument === undefined) delete globalThis.document;
    else globalThis.document = previousDocument;
  }
});
