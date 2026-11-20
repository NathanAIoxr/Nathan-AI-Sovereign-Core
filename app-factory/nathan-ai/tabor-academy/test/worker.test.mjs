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

test("library only displays hash-matching records and keeps archive text private", async () => {
  const privateText = "Unpublished voice transcript";
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(privateText));
  const recordId = Buffer.from(digest).toString("hex");
  const record = {
    record_id: recordId, loc_call_number: "LA", cud_index: 1,
    title_bottom: "Archive <test>", end_outcome_z: "Result", root_origin_a: "Root",
    public_explanation: "Public interpretation", sources_json: "[]", verbatim_body: privateText,
  };
  const library = {
    prepare: (query) => query,
    batch: async () => [
      { results: [record, { ...record, title_bottom: "Tampered entry", verbatim_body: "Changed" }] },
      { results: [] },
      { results: [] },
    ],
  };
  const response = await worker.fetch(new Request("https://academy.example/library/"), { LIBRARY: library });
  assert.equal(response.status, 200);
  const body = await response.text();
  assert.match(body, /Archive &lt;test&gt;/);
  assert.match(body, /Public interpretation/);
  assert.doesNotMatch(body, /Unpublished voice transcript|Tampered entry/);
});
