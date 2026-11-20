import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";
import { runInNewContext } from "node:vm";
import { createNutcrackerFleet } from "../../deployments/conductor/handoffs/nutcracker-fleet-core.mjs";
import { createNutcrackerAgi } from "../../deployments/conductor/handoffs/nutcracker-agi-core.mjs";
import { createLlmagiSystem } from "../../deployments/conductor/handoffs/llmagi-os-core.mjs";
import { serveNutcrackerBedroomHandoff } from "../../deployments/conductor/handoffs/nutcracker-bedroom.mjs";

const fleet = createNutcrackerFleet();
const agi = createNutcrackerAgi(fleet);
const os = createLlmagiSystem(fleet, agi);
const route = "/handoffs/nutcracker-bedroom/llmagi-os";
const origin = "https://example.test/tabor-sites/conductor";
const serve = (path, options) => serveNutcrackerBedroomHandoff(new Request(origin + path, options), path);
const bytes = text => new TextEncoder().encode(text);
const source = bytes("CLAIM release | ready | test | true\nCLAIM release | ready | test | false");

test("LLMAGI names, reversal, ASCII and 144-bit anchor comparison are exact", () => {
  assert.equal(os.encoding.forward, "LLMAGI");
  assert.equal(os.encoding.reverse, "IGAMLL");
  assert.equal(os.binary(os.encoding.forward), "01001100 01001100 01001101 01000001 01000111 01001001");
  assert.equal(os.binary(os.encoding.reverse), "01001001 01000111 01000001 01001101 01001100 01001100");
  assert.ok(os.verifyFixedFrame(os.fixedFrame.toLowerCase()));
  assert.equal(os.verifyFixedFrame(os.fixedFrame.replace("7E", "7F")), false);
  assert.equal(os.verifyFixedFrame(os.fixedFrame.split(" ").reverse().join(" ")), false);
});

test("IGAMLL checks changed source, edited receipt, reordered fields and changed review", async () => {
  const report = await os.forward(source, null, null, "digital");
  assert.equal(report.artifact.body.disposition, "crushed");
  assert.equal((await os.reverse(source, report.artifact, null, null, "digital")).decisionMatches, true);
  const edited = structuredClone(report.artifact);
  edited.body.disposition = "cleared";
  assert.equal((await os.reverse(source, edited, null, null, "digital")).receiptMatches, false);
  assert.equal((await os.reverse(bytes("other"), report.artifact, null, null, "digital")).sourceMatches, false);
  assert.equal((await os.reverse(source, report.artifact, null, null, "paper")).decisionMatches, false);
  const reordered = { sha256: report.artifact.sha256, body: Object.fromEntries(Object.entries(report.artifact.body).reverse()) };
  assert.equal((await os.reverse(source, reordered, null, null, "digital")).decisionMatches, true);
  const changed = { ...report.manifest, protection: {
    ...report.manifest.protection, reviewRef: "review-updated"
  } };
  assert.equal((await os.reverse(source, report.artifact, null, changed, "digital")).decisionMatches, false);
});

test("Conductor routes expose a manifest and the exact boot image without a write endpoint", async () => {
  const manifest = await serve("/api" + route).json();
  assert.equal(manifest.naming.reference, "Matthew 2:1–12 (KJV)");
  assert.match(manifest.services.fleet, /nutcracker-bedroom\/fleet$/);
  assert.equal(serve(route, { method: "POST" }).status, 405);
  const download = serve(route + "/llmagi-os.img");
  const image = Buffer.from(await download.arrayBuffer());
  assert.equal(image.length, manifest.native.bytes);
  assert.equal(image.readUInt16LE(510), 0xaa55);
  assert.equal(createHash("sha256").update(image).digest("hex"), manifest.native.sha256);
  const header = serve(route + "/llmagi-os.img", { method: "HEAD" });
  assert.equal(header.headers.get("content-length"), String(image.length));
  assert.equal(await header.text(), "");
  assert.match(await serve(route).text(), /Replay with IGAMLL/);
  assert.match(await serve("/handoffs/nutcracker-bedroom/fleet").text(), /LLMAGI OS and IGAMLL/);
});

test("served OS script runs the forward sample, approved reuse and reverse replay", async () => {
  const items = new Map();
  const files = new Map();
  const downloads = [];
  const getElementById = id => {
    if (!items.has(id)) items.set(id, { value: "", files: [], textContent: "",
      addEventListener(event, fn) { this[event] = fn; }
    });
    return items.get(id);
  };
  runInNewContext(await serve(route + ".js").text(), {
    document: {
      getElementById,
      createElement() { return { click() { downloads.push(files.get(this.href)); } }; }
    },
    crypto: globalThis.crypto, TextEncoder, TextDecoder, Uint8Array, Blob, btoa,
    URL: {
      createObjectURL(file) { const key = "blob:" + files.size; files.set(key, file); return key; },
      revokeObjectURL() {}
    },
    setTimeout() {}
  });
  await getElementById("example").click();
  await getElementById("forward").click();
  assert.match(getElementById("status").textContent, /LLMAGI · CRUSHED/);
  await getElementById("reuse").click();
  const approved = JSON.parse(await downloads.at(-1).text());
  assert.equal(approved.approvedParts.length, 1);
  assert.match(Buffer.from(approved.approvedParts[0].bytesBase64, "base64").toString(), /CLAIM instructions/);
  await getElementById("reverse").click();
  assert.match(getElementById("status").textContent, /IGAMLL · replay verified/);
});
