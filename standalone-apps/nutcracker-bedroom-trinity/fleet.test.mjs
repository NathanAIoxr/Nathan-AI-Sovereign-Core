import assert from "node:assert/strict";
import test from "node:test";
import { runInNewContext } from "node:vm";
import { createNutcrackerFleet } from "../../deployments/conductor/handoffs/nutcracker-fleet-core.mjs";
import { serveNutcrackerBedroomHandoff } from "../../deployments/conductor/handoffs/nutcracker-bedroom.mjs";

const fleet = createNutcrackerFleet();
const digest = await fleet.digestSource(new TextEncoder().encode("a source to review"));
const manifest = () => ({
  protection: {
    sourceSha256: digest, reviewRef: "review-001", consent: "pass", privacy: "pass", exploitation: "pass"
  },
  parts: []
});
const part = (id, value, overrides = {}) => ({
  id, subject: "release", predicate: "consented", scope: "review", value,
  reuseReview: { status: "approved", sourceSha256: digest, ref: "independent-review" },
  ...overrides
});

test("all 69 fleets have 1,000 distinct units across stable address boundaries", () => {
  const ids = new Set();
  for (let ordinal = 1; ordinal <= 69_000; ordinal++) {
    ids.add(fleet.unitAt(ordinal).id);
  }
  assert.equal(ids.size, 69_000);
  assert.equal(fleet.unitAt(1).id, "NC-01-0001");
  assert.equal(fleet.unitAt(1_001).id, "NC-02-0001");
  assert.equal(fleet.unitAt(69_000).id, "NC-69-1000");
  assert.throws(() => fleet.unitAt(69_001), RangeError);
  assert.throws(() => fleet.unitAt(1.5), RangeError);
  assert.throws(() => fleet.assign("abc"), TypeError);
  assert.deepEqual(fleet.assign(digest), fleet.assign(digest));
  assert.equal(fleet.assign(digest).ordinal, Number(BigInt("0x" + digest) % 69_000n) + 1);
});

test("source evidence and intake medium are required to clear", async () => {
  const submitted = manifest();
  assert.equal(fleet.review(submitted, digest, "paper").disposition, "cleared");
  assert.equal(fleet.review(submitted, digest, "digital").disposition, "cleared");
  assert.equal(fleet.review(submitted, digest, "unrecognized").disposition, "held");
  const changed = await fleet.digestSource(new TextEncoder().encode("another source"));
  assert.equal(fleet.review(submitted, changed, "digital").disposition, "held");
  delete submitted.protection.privacy;
  assert.equal(fleet.review(submitted, digest, "digital").disposition, "held");
  assert.equal(fleet.review(null, digest, "paper").disposition, "held");
  assert.equal(fleet.review({ ...manifest(), parts: Array(501).fill(null) }, digest, "digital").disposition, "held");
  await assert.rejects(fleet.digestSource(new Uint8Array(fleet.sourceLimit + 1)), RangeError);
});

test("protect-innocence failures crush a submission and preserve only separately reviewed IDs", () => {
  const submitted = manifest();
  submitted.protection.consent = "fail";
  submitted.parts = [
    part("safe", true),
    part("no-independent-review", true, { reuseReview: { status: "approved", sourceSha256: digest, ref: "review-001" } }),
    part("no-review", true, { reuseReview: null }),
    part("sensitive-original", "never copied into the report", { scope: "different-scope", reuseReview: null })
  ];
  const report = fleet.review(submitted, digest, "digital");
  assert.equal(report.disposition, "crushed");
  assert.deepEqual(report.failures, ["Innocence protection failed: consent."]);
  assert.deepEqual(report.reuse, [{ part: "safe", reviewRef: "independent-review" }]);
  assert.doesNotMatch(JSON.stringify(report), /never copied/);
  delete submitted.protection.privacy;
  assert.deepEqual(fleet.review(submitted, digest, "digital").reuse, []);
});

test("contradictory claims and duplicate part identifiers are never listed for reuse", () => {
  const submitted = manifest();
  submitted.parts = [
    part("yes", true),
    part("no", false),
    part("duplicate", true, { scope: "other" }),
    part("duplicate", true, { scope: "other" }),
    part("outside-scope", false, { scope: "new-document" })
  ];
  const report = fleet.review(submitted, digest, "digital");
  assert.equal(report.disposition, "crushed");
  assert.deepEqual(report.contradictions, [
    { type: "duplicate-part-id", parts: ["duplicate"] },
    { type: "conflicting-claims", parts: ["yes", "no"] }
  ]);
  assert.deepEqual(report.reuse, [{ part: "outside-scope", reviewRef: "independent-review" }]);
  submitted.parts = [part("one", true), part("two", false, { scope: "other" })];
  assert.equal(fleet.review(submitted, digest, "digital").disposition, "cleared");
});

test("JSON manifest rejects duplicate keys while accepting nested scopes and escaped text", () => {
  assert.throws(() => fleet.parseManifest('{"protection":{"consent":"fail","consent":"pass"}}'), /duplicate JSON field/);
  assert.throws(() => fleet.parseManifest(String.raw`{"privacy":1,"\u0070rivacy":2}`), /duplicate JSON field/);
  const record = { parts: [{ value: '["a":"b"]' }, { value: "true" }], slash: "\\" };
  assert.deepEqual(fleet.parseManifest(JSON.stringify(record)), record);
});

test("reuse export extracts a nonconflicting part by verified byte range", async () => {
  const bytes = new TextEncoder().encode("a source to review");
  const submitted = manifest();
  submitted.protection.exploitation = "fail";
  const partHash = await fleet.digestSource(bytes.subarray(2, 8));
  submitted.parts = [
    part("verified-bytes", true, {
      range: [2, 8],
      reuseReview: { status: "approved", sourceSha256: digest, ref: "second-review", partSha256: partHash }
    }),
    part("wrong-range", true, {
      range: [3, 9],
      reuseReview: { status: "approved", sourceSha256: digest, ref: "second-review", partSha256: partHash }
    }),
    part("metadata-only", true)
  ];
  const result = await fleet.reuseBundle(bytes, submitted, "paper");
  assert.equal(result.sourceSha256, digest);
  assert.equal(result.approvedParts.length, 2);
  assert.equal(Buffer.from(result.approvedParts[0].bytesBase64, "base64").toString(), "source");
  assert.deepEqual(result.approvedParts[1], { part: "metadata-only", reviewRef: "independent-review" });
});

const root = "/tabor-sites/conductor";
const page = "/handoffs/nutcracker-bedroom/fleet";
const api = "/api" + page;
const request = (path, options) => serveNutcrackerBedroomHandoff(
  new Request("https://example.test" + root + path, options), path.split("?")[0]
);

test("Conductor routes the printable desk, lists any fleet, and rejects submissions to the server", async () => {
  const desk = request(page);
  assert.match(desk.headers.get("Content-Security-Policy"), /connect-src 'self'/);
  assert.match(await desk.text(), /Print paper worksheet/);
  const roster = await request(api + "?fleet=69").json();
  assert.equal(roster.units.length, 1_000);
  assert.equal(roster.units[0].id, "NC-69-0001");
  assert.equal(roster.units[999].id, "NC-69-1000");
  assert.equal((await request(api).json()).total, 69_000);
  assert.equal((await request(api + "?fleet=70")).status, 400);
  assert.equal((await request(page, { method: "POST" })).status, 405);
  assert.equal(await request(page, { method: "HEAD" }).text(), "");
  assert.match(await request("/handoffs/nutcracker-bedroom").text(), /Open the 69-fleet intake and review desk/);
});

test("the served browser script reviews the sample and resolves the last unit", async () => {
  const requests = new Map();
  const getElementById = id => {
    if (!requests.has(id)) {
      requests.set(id, {
        value: "", textContent: "", files: [],
        addEventListener(event, listener) { this[event] = listener; }
      });
    }
    return requests.get(id);
  };
  runInNewContext(await request(page + ".js").text(), {
    document: { getElementById }, crypto: globalThis.crypto, TextEncoder, Uint8Array
  });
  await getElementById("example").click();
  await getElementById("check").click();
  assert.match(getElementById("status").textContent, /Crushed · rejected · NC-/);
  assert.deepEqual(JSON.parse(getElementById("receipt").textContent).reuse, [
    { part: "help-text", reviewRef: "demo-second-review" }
  ]);
  getElementById("ordinal").valueAsNumber = 69_000;
  getElementById("lookup").click();
  assert.match(getElementById("location").textContent, /NC-69-1000/);
});
