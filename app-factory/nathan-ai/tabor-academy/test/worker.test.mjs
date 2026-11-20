import assert from "node:assert/strict";
import test from "node:test";
import worker from "../src/worker.mjs";

const call = (pathname, method = "GET") =>
  worker.fetch(new Request(new URL(pathname, "https://academy.example"), { method }));

test("serves Nathan Tabor's launch announcement", async () => {
  const page = await call("/");
  assert.equal(page.status, 200);
  const text = (await page.text()).replace(/<[^>]*>/g, "").replace(/\s+/g, " ");
  assert.match(text, /TABOR ACADEMY COMING SOON LIKE IN THE NEXT FIVE MINUTES BY NATHAN TABOR/);
});

test("exposes service health", async () => {
  const health = await call("/healthz");
  assert.equal(health.status, 200);
  assert.deepEqual(await health.json(), { service: "tabor-academy", status: "ok" });
});

test("handles HEAD, missing pages, and unsupported methods", async () => {
  assert.equal(await (await call("/", "HEAD")).text(), "");
  assert.equal((await call("/missing")).status, 404);
  const response = await call("/", "POST");
  assert.equal(response.status, 405);
  assert.equal(response.headers.get("allow"), "GET, HEAD");
});
