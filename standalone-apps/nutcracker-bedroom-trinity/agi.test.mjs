import assert from "node:assert/strict";
import test from "node:test";
import { runInNewContext } from "node:vm";
import { createNutcrackerAgi } from "../../deployments/conductor/handoffs/nutcracker-agi-core.mjs";
import { agiModelPath } from "../../deployments/conductor/handoffs/nutcracker-agi-model.mjs";
import { createNutcrackerFleet } from "../../deployments/conductor/handoffs/nutcracker-fleet-core.mjs";
import { serveNutcrackerBedroomHandoff } from "../../deployments/conductor/handoffs/nutcracker-bedroom.mjs";

const fleet = createNutcrackerFleet();
const agi = createNutcrackerAgi(fleet);
const bytes = value => new TextEncoder().encode(value);
const root = "https://example.test/tabor-sites/conductor";
const modelUrl = root + agiModelPath;
const type = { "Content-Type": "application/json" };
const setup = current => {
  const prepared = agi.prepareManifest(current);
  Object.assign(prepared.protection, {
    consent: "pass", privacy: "pass", exploitation: "pass", reviewRef: "protection-1"
  });
  return prepared;
};

test("literal claims preserve exact multibyte evidence and produce a contradictory Fleet receipt", async () => {
  const source = bytes("Résumé\r\nCLAIM object | counted | here | true\r\nCLAIM object | counted | here | false\r\nCLAIM other | checked | here | true");
  const current = await agi.draft(source);
  assert.equal(current.claims.length, 3);
  for (const claim of current.claims) {
    const selected = source.slice(...claim.range);
    assert.equal(new TextDecoder().decode(selected), claim.quote);
    assert.equal(await fleet.digestSource(selected), claim.evidenceSha256);
  }
  assert.match(current.binary, /^01010010 /);
  const prepared = setup(current);
  const reusable = current.claims[2];
  prepared.parts = [{ id: reusable.id, reuseReview: {
    status: "approved", ref: "independent-1", sourceSha256: current.sourceSha256,
    partSha256: reusable.evidenceSha256
  } }];
  const { report, effective } = agi.assess(current, prepared, current.sourceSha256, "paper");
  assert.equal(report.disposition, "crushed");
  assert.equal(report.contradictions[0].parts.length, 2);
  assert.equal(report.reasoning.evidence.length, 3);
  assert.equal(report.reuse[0].part, reusable.id);
  const bundle = await fleet.reuseBundle(source, effective, "paper");
  assert.equal(Buffer.from(bundle.approvedParts[0].bytesBase64, "base64").toString(), reusable.quote);
});

test("model quotes are checked and reviewed before a candidate affects a decision", async () => {
  const source = bytes("The tests passed at 08:00. The tests failed at 09:00. Repeat. Repeat.");
  const candidate = { subject: "tests", predicate: "passed", scope: "release", value: true };
  const current = await agi.draft(source, { claims: [
    { ...candidate, quote: "The tests passed at 08:00." },
    { ...candidate, subject: " Tests ", quote: "The tests failed at 09:00.", value: false },
    { ...candidate, quote: "No such quote." },
    { ...candidate, quote: "Repeat." }
  ] });
  assert.equal(current.claims.length, 2);
  assert.deepEqual(current.skipped.map(value => value.reason), ["quote-not-in-source", "quote-ambiguous"]);
  const prepared = setup(current);
  const [first, second] = current.claims;
  assert.equal(agi.assess(current, prepared, current.sourceSha256, "digital").report.disposition, "held");
  prepared.claimReview.decisions[first.id] = { decision: "accept", reviewRef: "claim-review-1" };
  prepared.claimReview.decisions[second.id] = { decision: "dismiss", reviewRef: "claim-review-2" };
  assert.equal(agi.assess(current, prepared, current.sourceSha256, "digital").report.disposition, "cleared");
  prepared.claimReview.decisions[second.id].decision = "accept";
  assert.equal(agi.assess(current, prepared, current.sourceSha256, "digital").report.disposition, "crushed");
  assert.throws(() => agi.assess(current, prepared, "f".repeat(64), "digital"), /source changed/);
  const different = await agi.draft(bytes("CLAIM alpha | test | delta | true"));
  const rebound = agi.prepareManifest(different, { ...prepared, parts: [{ id: "previous-part" }] });
  assert.equal(rebound.protection.reviewRef, "");
  assert.deepEqual(rebound.parts, []);
});

test("malformed local claims and changed reviewer data cannot silently clear", async () => {
  const current = await agi.draft(bytes('CLAIM A | B | C | {"not":"a scalar"}'));
  assert.equal(agi.assess(current, setup(current), current.sourceSha256, "digital").report.disposition, "held");
  const valid = await agi.draft(bytes("CLAIM A | B | C | true"));
  const prepared = setup(valid);
  prepared.parts = "wrong type";
  assert.equal(agi.assess(valid, prepared, valid.sourceSha256, "digital").report.disposition, "held");
  await assert.rejects(agi.draft(new Uint8Array([255])), /UTF-8 source/);
});

test("hosting requires authorized operator identity before reading or using the model", async () => {
  let calls = 0;
  const runtime = {
    authorize: async () => false,
    ai: { async run() { calls++; } },
    async readBytes() { calls++; }
  };
  const request = new Request(modelUrl, { method: "POST", headers: type, body: "{}" });
  const response = await serveNutcrackerBedroomHandoff(request, agiModelPath, runtime);
  assert.equal(response.status, 401);
  assert.equal(calls, 0);
  runtime.authorize = async () => true;
  const cross = new Request(modelUrl, { method: "POST", headers: { ...type, Origin: "https://cross.test" }, body: "{}" });
  assert.equal((await serveNutcrackerBedroomHandoff(cross, agiModelPath, runtime)).status, 403);
  assert.equal(calls, 0);
});

test("authenticated model responses remain proposals and oversized input never reaches inference", async () => {
  const source = "Release 1 passed testing.";
  let input = { source };
  let called = 0;
  const responseBody = { claims: [{ subject: "release", predicate: "passed-tests", scope: "r1", value: true, quote: source }] };
  const runtime = {
    authorize: async () => "authorized",
    readBytes: async () => bytes(JSON.stringify(input)),
    ai: { async run(model, options) {
      called++;
      assert.match(model, /^@cf\//);
      assert.equal(JSON.parse(options.messages[1].content).source, source);
      return { response: JSON.stringify(responseBody) };
    } }
  };
  const invoke = () => serveNutcrackerBedroomHandoff(
    new Request(modelUrl, { method: "POST", headers: type, body: "{}" }), agiModelPath, runtime
  );
  const direct = await invoke();
  assert.equal(direct.status, 200);
  assert.deepEqual((await direct.json()).claims, responseBody.claims);
  input = { source: "x".repeat(6_001) };
  assert.equal((await invoke()).status, 400);
  assert.equal(called, 1);
});

test("the served AGI sample produces a browser evidence trail and approved reuse", async () => {
  const path = "/handoffs/nutcracker-bedroom/fleet.js";
  const response = serveNutcrackerBedroomHandoff(new Request(root + path), path);
  const controls = new Map();
  const getElementById = id => {
    if (!controls.has(id)) controls.set(id, {
      value: "", textContent: "", files: [],
      addEventListener(event, callback) { this[event] = callback; }
    });
    return controls.get(id);
  };
  runInNewContext(await response.text(), {
    document: { getElementById }, crypto: globalThis.crypto, TextEncoder, TextDecoder, Uint8Array
  });
  await getElementById("agi-example").click();
  await getElementById("check").click();
  assert.match(getElementById("draft-status").textContent, /3 grounded claims/);
  assert.match(getElementById("status").textContent, /Crushed · rejected · NC-/);
  const result = JSON.parse(getElementById("receipt").textContent);
  assert.equal(result.reasoning.evidence.length, 3);
  assert.equal(result.reuse.length, 1);
  getElementById("proposal").input();
  await getElementById("check").click();
  assert.match(getElementById("status").textContent, /Draft again/);
});
