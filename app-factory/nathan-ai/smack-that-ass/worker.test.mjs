import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { buildWorker } from "./build.mjs";

const { release, source } = await buildWorker();
const { default: worker } = await import("data:text/javascript;base64," + Buffer.from(source).toString("base64"));
const fetchRoute = (path, method = "GET") =>
  worker.fetch(new Request("https://app.example" + path, { method }));

test("serves the exact capitalized title and definition with the static app", async () => {
  const response = await fetchRoute("/");
  const html = await response.text();
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("content-type"), "text/html; charset=utf-8");
  assert.equal(html, await readFile(new URL("public/index.html", import.meta.url), "utf8"));
  assert.match(html, /<title>SMACK THAT ASS<\/title>/);
  assert.match(html, /<h1>SMACK THAT ASS <span class="name-meaning">\(AUTHORITARIAN SATANIC SOULS\)<\/span><\/h1>/);
  assert.match(html, /Only the player can slap the hand or masked face/);
  assert.match(html, /class="wordmark" href="index.html"/);
  assert.equal((await fetchRoute("/index.html")).status, 200);
});

test("serves the stylesheet and script with consistent release headers", async () => {
  const css = await fetchRoute("/retribution.css");
  const js = await fetchRoute("/retribution.js");
  assert.equal(css.headers.get("content-type"), "text/css; charset=utf-8");
  assert.equal(js.headers.get("content-type"), "text/javascript; charset=utf-8");
  assert.equal(css.headers.get("x-app-release"), release);
  assert.equal(js.headers.get("x-app-release"), release);
  assert.equal(js.headers.get("x-content-type-options"), "nosniff");
  assert.equal(await js.text(), await readFile(new URL("public/retribution.js", import.meta.url), "utf8"));
});

test("reports release identity and handles HEAD, unknown routes, and unsupported methods", async () => {
  const health = await fetchRoute("/health");
  assert.deepEqual(await health.json(), { ok: true, app: "smack-that-ass", release });
  assert.match(release, /^[a-f0-9]{64}$/);
  const head = await fetchRoute("/", "HEAD");
  assert.equal(head.status, 200);
  assert.equal(await head.text(), "");
  assert.equal((await fetchRoute("/missing")).status, 404);
  const post = await fetchRoute("/health", "POST");
  assert.equal(post.status, 405);
  assert.equal(post.headers.get("allow"), "GET, HEAD");
});
