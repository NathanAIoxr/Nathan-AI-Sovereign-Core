import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import test from "node:test";

const directory = fileURLToPath(new URL(".", import.meta.url));
const project = JSON.parse(await readFile(new URL("./app.json", import.meta.url), "utf8"));

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

