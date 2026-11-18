import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import test from "node:test";
import worker from "./worker.mjs";

const read = (name) => readFileSync(new URL(name, import.meta.url), "utf8");
const raw = read("catalog.json");
const { categories, engines } = JSON.parse(raw);
const digest = createHash("sha256").update(raw).digest("hex");
const bytes = Buffer.byteLength(raw);
const db = new DatabaseSync(":memory:");
db.exec(read("schema.sql"));
db.prepare("INSERT INTO tabor_imagination_releases VALUES (?,?,?,?,?)")
  .run(digest, "archive-key", bytes, engines.length, JSON.stringify(categories));
const seed = db.prepare(read("import.sql"));
seed.run({ "?1": digest, "?2": JSON.stringify(engines) });
assert.equal(seed.run({ "?1": digest, "?2": JSON.stringify(engines) }).changes, 0);

const env = {
  RELEASE_SHA256: digest,
  ARCHIVE_DB: {
    prepare(sql) {
      const statement = db.prepare(sql);
      return { bind: (...params) => ({
        all: async () => ({ results: statement.all(...params) }),
        first: async () => statement.get(...params),
      }) };
    },
  },
  ARCHIVE_BLOB: {
    head: async (key) => key === "archive-key" ? { size: bytes } : null,
    get: async (key) => key === "archive-key" ? { size: bytes, body: raw } : null,
  },
};

const call = (path, bindings = env, init) => worker.fetch(new Request("https://test.invalid" + path, init), bindings);

test("matches all 101 ordered IDs, category ranges and release digest", () => {
  assert.equal(categories.length, 8);
  assert.deepEqual(engines.map((e) => e.id), Array.from({ length: 101 }, (_, i) =>
    "IMAG-" + String(i + 1).padStart(3, "0")));
  for (const category of categories) {
    const group = engines.filter((entry) => entry.category === category.id);
    assert.equal(group[0].number, category.first);
    assert.equal(group.at(-1).number, category.last);
    assert.equal(group.length, category.last - category.first + 1);
  }
  assert.equal(JSON.parse(read("wrangler.json")).vars.RELEASE_SHA256, digest);
});

test("shows the complete index, finds exact IDs, and returns eight playable entries", async () => {
  assert.match(await (await call("/")).text(), /101 of 101 engines/);
  const filtered = await (await call("/?q=IMAG-045&category=4")).text();
  assert.match(filtered, /1 of 101 engines/);
  assert.match(filtered, /A–Z Creature Kingdom Portal Router/);
  assert.match(await (await call("/?demos=1")).text(), /8 of 101 engines/);
  assert.match(await (await call("/?q=%3Cscript%3E")).text(), /&lt;script&gt;/);
});

test("serves details by catalog ID and rejects docs for missing entries", async () => {
  assert.match(await (await call("/engines/IMAG-101")).text(), /Universal Imagination/);
  assert.match(await (await call("/engines/IMAG-001")).text(), /href="\/demo\/IMAG-001"/);
  assert.equal((await call("/engines/IMAG-102")).status, 404);
  assert.equal((await call("/demo/IMAG-101")).status, 404);
  assert.equal((await call("/", env, { method: "POST" })).status, 405);
});

test("reads the same release from R2 and reports missing snapshots", async () => {
  assert.deepEqual(await (await call("/health")).json(), { status: "ok", entries: 101, sha256: digest });
  assert.equal(await (await call("/api/catalog.json")).text(), raw);
  assert.equal((await call("/health", { ...env, ARCHIVE_BLOB: { head: async () => null } })).status, 503);
});

test("each demo forwards a fixed example to its existing service", async () => {
  const bindings = { ...env };
  for (const entry of engines.filter((candidate) => candidate.demo)) {
    const svg = [31, 73].includes(entry.number);
    bindings[entry.id.replace("-", "_")] = { fetch: async (request) => {
      const { pathname, search } = new URL(request.url);
      assert.equal(pathname + search, entry.demo.path);
      if (entry.number === 93) {
        assert.equal(request.method, "POST");
        assert.deepEqual(await request.json(), { text: "STAR LIBRARY", shift: 3 });
      } else {
        assert.equal(request.method, "GET");
      }
      return svg ? new Response("<svg/>", { headers: { "content-type": "image/svg+xml" } })
        : Response.json({ id: entry.id });
    }};
    const result = await call("/demo/" + entry.id + "?seed=ignored", bindings);
    assert.equal(result.status, 200);
    assert.equal(result.headers.get("content-type"), svg ? "image/svg+xml" : "application/json");
    await result.text();
  }
});
