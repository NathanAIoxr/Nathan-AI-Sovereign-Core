import test from "node:test";
import assert from "node:assert/strict";
import {execFileSync} from "node:child_process";
import {mkdtemp, readFile, rm} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {pathToFileURL} from "node:url";

const host = "https://tabor-app-portfolio.nathantaboract.workers.dev";
const commit = "0123456789012345678901234567890123456789";
const temp = await mkdtemp(join(tmpdir(), "tabor-portfolio-"));
const bundle = join(temp, "worker.mjs");
execFileSync("python3", [new URL("./pack_worker.py", import.meta.url).pathname, "--output", bundle, "--source", commit]);
const {default:worker} = await import(pathToFileURL(bundle));
await rm(temp, {recursive:true});
const resource = (path, options) => new Request(host + path, options);
const file = name => readFile(new URL(name, import.meta.url));

test("packaged catalog and progress match checked-in bytes", async () => {
  for (const asset of ["catalog","progress"]) {
    const response = await worker.fetch(resource("/api/" + asset));
    assert.equal(response.status, 200);
    assert.match(response.headers.get("content-type"), /application\/json/);
    assert.deepEqual(Buffer.from(await response.arrayBuffer()), await file(asset + ".json"));
  }
});

test("website and artwork serve their exact bytes, MIME types, and CSP", async () => {
  for (const [path, name, mime] of [["/","index.html","text/html"],["/style.css","style.css","text/css"],
    ["/assets/tabor-world.webp","assets/tabor-world.webp","image/webp"]]) {
    const response = await worker.fetch(resource(path));
    assert.match(response.headers.get("content-type"), new RegExp(mime));
    assert.match(response.headers.get("content-security-policy"), /frame-ancestors 'none'/);
    assert.deepEqual(Buffer.from(await response.arrayBuffer()), await file(name));
  }
});

test("health identifies the bundled release and HEAD returns an empty body", async () => {
  const response = await worker.fetch(resource("/api/health"));
  assert.deepEqual(await response.json(), {status:"ok", service:"tabor-app-portfolio",source:commit,bundledFiles:6});
  const head = await worker.fetch(resource("/", {method:"HEAD"}));
  assert.equal(head.status, 200);
  assert.equal(await head.text(), "");
});

test("allowlisted record link redirects and other paths cannot access files", async () => {
  const notice = await worker.fetch(resource("/docs/record/index.html"));
  assert.equal(notice.status, 302);
  assert(notice.headers.get("location").endsWith("/docs/record/index.html"));
  assert.equal((await worker.fetch(resource("/.env"))).status, 404);
  assert.equal((await worker.fetch(resource("/api/../../../etc/passwd"))).status, 404);
  assert.equal((await worker.fetch(resource("/", {method:"POST"}))).status, 405);
});

test("a matching resource ETag avoids sending the asset body again", async () => {
  const first = await worker.fetch(resource("/style.css",{method:"HEAD"}));
  const cached = await worker.fetch(resource("/style.css",{headers:{"if-none-match":first.headers.get("etag")}}));
  assert.equal(cached.status, 304);
  assert.equal(await cached.text(), "");
});

test("the current catalog retains unique IDs and source paths", async () => {
  const data = JSON.parse(await file("catalog.json"));
  assert.equal(data.schema, 1);
  assert(data.items.length > 334);
  assert.equal(new Set(data.items.map(item => item.id)).size, data.items.length);
  const paths = data.items.flatMap(item => item.path ? [item.path] : []);
  assert.equal(new Set(paths).size, paths.length);
  assert(data.items.some(item => item.id === "bibletopia"));
  for (const item of data.items) {
    if (item.state === "template") assert.equal(item.url, null);
    if (item.url) assert.equal(new URL(item.url).protocol, "https:");
  }
});
