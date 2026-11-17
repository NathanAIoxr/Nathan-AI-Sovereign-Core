import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {createWorker} from "./worker.mjs";

const host = "https://tabor-app-portfolio.nathantaboract.workers.dev";
const commit = "0123456789012345678901234567890123456789";
const env = {PORTFOLIO_SOURCE:commit};
const origin = "https://raw.githubusercontent.com/NathanAIoxr/Nathan-AI-Sovereign-Core/";
const resource = path => new Request(host + path);

test("catalog and progress are served from a pinned public commit", async () => {
  const requests = [];
  const worker = createWorker(async (url, options) => {
    requests.push([url, options.method]);
    return new Response('{"schema":1}', {headers:{"etag":"test"}});
  });
  for (const [route, file] of [["catalog","catalog.json"],["progress","progress.json"]]) {
    const response = await worker.fetch(resource("/api/" + route), env);
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("content-type"), "application/json; charset=utf-8");
    assert.equal(response.headers.get("etag"), "test");
    assert.equal((await response.json()).schema, 1);
    assert.deepEqual(requests.at(-1), [origin + commit + "/app-factory/portfolio/" + file, "GET"]);
  }
});

test("website and image routes use their expected types and CSP", async () => {
  const worker = createWorker(async () => new Response("asset"));
  for (const [path, mime] of [["/","text/html"],["/style.css","text/css"],["/assets/tabor-world.webp","image/webp"]]) {
    const response = await worker.fetch(resource(path), env);
    assert.match(response.headers.get("content-type"), new RegExp(mime));
    assert.match(response.headers.get("content-security-policy"), /frame-ancestors 'none'/);
  }
});

test("health probes the catalog and HEAD returns an empty body", async () => {
  const calls = [];
  const worker = createWorker(async (url, options) => {
    calls.push([url, options.method]);
    return new Response(null);
  });
  const response = await worker.fetch(resource("/api/health"), env);
  assert.equal((await response.json()).source, commit);
  assert.equal(calls[0][1], "HEAD");
  const head = await worker.fetch(new Request(host, {method:"HEAD"}), env);
  assert.equal(await head.text(), "");
  assert.equal(calls[1][1], "HEAD");
});

test("unknown routes and modifying methods never reach the source", async () => {
  const worker = createWorker(() => assert.fail("Unexpected source request"));
  assert.equal((await worker.fetch(resource("/.env"), env)).status, 404);
  assert.equal((await worker.fetch(resource("/api/../../../etc/passwd"), env)).status, 404);
  assert.equal((await worker.fetch(new Request(host, {method:"POST"}), env)).status, 405);
  assert.equal((await worker.fetch(resource("/"), {PORTFOLIO_SOURCE:"../main"})).status, 503);
});

test("upstream failures return a bounded gateway error", async () => {
  const missing = createWorker(async () => new Response("HTML error", {status:404}));
  assert.equal((await missing.fetch(resource("/api/health"), env)).status, 502);
  const failed = createWorker(async () => { throw new Error("network error"); });
  const response = await failed.fetch(resource("/api/progress"), env);
  assert.equal(response.status, 502);
  assert.equal(response.headers.get("cache-control"), "no-store");
});

test("checked-in catalog retains unique stable IDs and paths", async () => {
  const data = JSON.parse(await readFile(new URL("./catalog.json", import.meta.url)));
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
