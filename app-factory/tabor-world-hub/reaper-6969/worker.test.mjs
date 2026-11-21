import assert from "node:assert/strict";
import test from "node:test";
import { createHash } from "node:crypto";
import { runModel } from "./lab.mjs";
import { createApp } from "./worker.mjs";

const content = "# THE REAPER 6969 ENGINE\n\n## 2. Hardware\n\n**Archive** <script>alert(1)</script> [Source](https://example.com)\n\n| Part | Note |\n| --- | --- |\n| Core | Sealed |\n";
const filename = "Reaper_6969_Recovery.md";
const hash = createHash("sha256").update(content).digest("hex");
const archive = [{ filename, title: "Recovery report", type: "text/markdown", content, bytes: Buffer.byteLength(content), sha256: hash }];
const app = createApp(archive);
const revision = "a".repeat(40);
const env = { REAPER_ACCESS_AUD: "owner-audience", REAPER_GITHUB_SHA: revision };
const ctx = { access: { aud: env.REAPER_ACCESS_AUD } };
const call = (path, context = ctx, options = {}) => app.fetch(new Request("https://owner.test" + path, options), env, context);

test("all owner routes fail closed without the matching Access audience", async () => {
  for (const path of ["/", "/archive", "/lab", "/api/lab?model=thermal", "/api/manifest", "/downloads/" + filename]) {
    assert.equal(call(path, {}, { headers: { "Cf-Access-Jwt-Assertion": "untrusted" } }).status, 403);
    assert.equal(call(path, { access: { aud: "other" } }).status, 403);
    assert.equal(call(path).status, 200);
  }
});

test("the archive renders citations, table, author text and escaped HTML", async () => {
  const response = call("/archive");
  const body = await response.text();
  assert.match(body, /id="hardware"/);
  assert.match(body, /<table>/);
  assert.match(body, /<strong>Archive<\/strong>/);
  assert.match(body, /&lt;script&gt;/);
  assert.match(body, /href="https:\/\/example.com"/);
  assert.doesNotMatch(body, /<script>/);
  assert.equal(response.headers.get("Cache-Control"), "private, no-store");
});

test("manifest points to the exact GitHub revision and archive verifies against it", async () => {
  const manifest = await call("/api/manifest").json();
  assert.equal(manifest.revision, revision);
  assert.match(manifest.github, new RegExp(revision));
  const file = call("/downloads/" + filename);
  assert.match(file.headers.get("content-disposition"), /attachment/);
  assert.equal(createHash("sha256").update(await file.text()).digest("hex"), manifest.files[0].sha256);
  assert.equal(await call("/downloads/" + filename, ctx, { method: "HEAD" }).text(), "");
  assert.equal(call("/archive", ctx, { method: "POST" }).status, 405);
  assert.equal(call("/api/unknown").status, 404);
});

test("corresponds to Python reference energy, pump and rotor cases", () => {
  const thermal = runModel("thermal", new URLSearchParams());
  assert.ok(Math.abs(thermal.metrics[2][1] - 2.8815731607397206) < 1e-9);
  assert.ok(Math.abs(thermal.states[0].pressure_absolute_pa - 2*thermal.states[1].pressure_absolute_pa) < 1e-8);
  assert.equal(runModel("thermal", new URLSearchParams({ hot_k: 300 })).metrics[2][1], 0);
  assert.ok(Math.abs(runModel("hydraulic", new URLSearchParams()).metrics[0][1] - 1.111019895125) < 1e-12);
  const rotor = runModel("rotors", new URLSearchParams()).metrics;
  assert.ok(rotor[0][1] > 0);
  assert.equal(rotor[1][1], 0);
});

test("calculator and JSON refuse invalid parameters, with independent cards", async () => {
  assert.equal(call("/api/lab?model=thermal&cold_k=0").status, 400);
  assert.equal(call("/api/lab?model=hydraulic&efficiency=2").status, 400);
  assert.equal(call("/api/lab?model=rotors&left_inertia_kg_m2=Infinity").status, 400);
  assert.equal(call("/api/lab?model=unknown").status, 400);
  assert.match(await call("/lab?model=rotors").text(), /Net axial angular momentum/);
  assert.match(await call("/lab?model=hydraulic&efficiency=2").text(), /role="alert"/);
});
