import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { frameBytes, spec, verifyFrame } from "./anchor.mjs";
import { serveFixedAnchor } from "./http.mjs";

const original = readFileSync(new URL("./ORIGINAL.md", import.meta.url), "utf8");
const canonical = Buffer.from("aa55ff01312b313d327e312d313d300400f0", "hex");
const bytes = bits => Buffer.from(bits.match(/.{8}/g).map(byte => parseInt(byte, 2)));
const request = (path, options) => new Request("https://conductor.test" + path, options);

test("matches the original and computes all rail and frame vectors", () => {
  assert.equal(spec.byteLength, 18);
  assert.equal(spec.bitLength, 144);
  assert.equal(spec.hex, "AA 55 FF 01 31 2B 31 3D 32 7E 31 2D 31 3D 30 04 00 F0");
  assert.equal(spec.bits, original.match(/^[01]{144}$/m)[0]);
  assert.deepEqual(bytes(spec.bits), canonical);
  assert.deepEqual(spec.fields.map(field => field.offset), [0, 3, 4, 9, 10, 15, 16]);
  assert.deepEqual(spec.rails.map(rail => [rail.text, rail.xor]), [["1+1=2", "24"], ["1-1=0", "20"]]);
  assert.equal(spec.alternate.binary, "00110001 00101101 00110001 00101011 00110000");
  assert.equal(spec.xor.columns, "00 06 00 00 02");
  assert.equal(spec.xor.combinedSeal, "04");
  assert.ok(verifyFrame(canonical));
  const copy = frameBytes();
  copy[0] = 0;
  assert.ok(verifyFrame(frameBytes()));
});

test("rejects every one-bit change, every rotation, reversal and XOR collision", () => {
  for (let i = 0; i < 144; i++) {
    const altered = Buffer.from(canonical);
    altered[i >> 3] ^= 1 << (i % 8);
    assert.equal(verifyFrame(altered), false, "flipped bit " + i);
  }
  for (let i = 1; i < 144; i++) {
    assert.equal(verifyFrame(bytes(spec.bits.slice(i) + spec.bits.slice(0, i))), false, "rotation " + i);
  }
  const reverse = value => [...value].reverse().join("");
  const interleave = [...canonical.subarray(4, 9)].flatMap((byte, i) => [byte, canonical[i + 10]]);
  for (const variant of [
    bytes(reverse(spec.bits)), bytes(spec.bits.match(/.{8}/g).map(reverse).join("")),
    Buffer.from(canonical).reverse(), canonical.subarray(1), Buffer.concat([canonical, Buffer.of(0)]),
    Buffer.from("aa55ff01312d313d307e312b313d320400f0", "hex"),
    Buffer.from("aa55ff01312b313d327e312d312b300400f0", "hex"),
    Buffer.concat([canonical.subarray(0, 4), Buffer.from(interleave), canonical.subarray(15)]),
  ]) {
    assert.equal(verifyFrame(variant), false);
  }
  const collision = Buffer.from(canonical);
  for (const offset of [4, 7, 10, 13]) collision[offset] ^= 1;
  const xor = (data, offset) => data.subarray(offset, offset + 5).reduce((a, b) => a ^ b);
  for (const offset of [4, 10]) assert.equal(xor(collision, offset), xor(canonical, offset));
  assert.deepEqual([...collision.subarray(4, 9)].map((b, i) => b ^ collision[i + 10]), [0, 6, 0, 0, 2]);
  assert.equal(verifyFrame(collision), false);
});

test("HTTP gate checks raw bytes including chunked and oversized frames", async () => {
  const path = "/fixed-anchor/verify";
  const post = body => serveFixedAnchor(request(path, {
    method: "POST", headers: { "Content-Type": "application/octet-stream" }, body, duplex: "half",
  }), path);
  const chunked = new ReadableStream({
    start(controller) {
      controller.enqueue(canonical.subarray(0, 8));
      controller.enqueue(canonical.subarray(8));
      controller.close();
    },
  });
  for (const body of [canonical, chunked]) {
    const response = await post(body);
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { bit: 1 });
  }
  for (const body of [Buffer.alloc(0), Buffer.alloc(100_000), canonical.subarray(0, 17), spec.hex]) {
    const response = await post(body);
    assert.equal(response.status, 422);
    assert.equal((await response.json()).bit, 0);
  }
  assert.equal((await serveFixedAnchor(request(path), path)).status, 405);
  assert.equal((await serveFixedAnchor(request(path, { method: "POST", body: canonical }), path)).status, 415);
});

test("offers page, exact downloads and an independently recorded D1 handoff", async () => {
  const page = "/handoffs/fixed-anchor-binary";
  const binary = "/fixed-anchor/frame.bin";
  const diagram = "/fixed-anchor/diagram.svg";
  const receiptPath = "/api" + page;
  assert.match(await (await serveFixedAnchor(request(page), page)).text(), /Download diagram SVG/);
  assert.deepEqual(Buffer.from(await (await serveFixedAnchor(request(binary), binary)).arrayBuffer()), canonical);
  assert.equal((await serveFixedAnchor(request(binary, { method: "HEAD" }), binary)).headers.get("content-length"), "18");
  assert.match(await (await serveFixedAnchor(request(diagram), diagram)).text(), /00000110/);
  const revision = "a".repeat(40);
  const id = "handoff:fixed-anchor-binary:" + revision;
  const receipt = { id, sourceRevision: revision, state: "received", project: "fixed-anchor-binary", anchor: { hex: spec.hex } };
  const withRow = row => ({ prepare: () => ({ bind: () => ({ first: async () => row }) }) });
  const handle = ledger => serveFixedAnchor(request(receiptPath), receiptPath, ledger);
  assert.deepEqual(await (await handle(withRow({ event_id: id, details: JSON.stringify(receipt) }))).json(), receipt);
  assert.equal((await handle(withRow(null))).status, 404);
  assert.equal((await handle(withRow({ event_id: id, details: "{}" }))).status, 503);
  assert.equal(await serveFixedAnchor(request("/api/health"), "/api/health"), null);
});

test("Python gate agrees on the raw frame and failed inputs", () => {
  const python = fileURLToPath(new URL("./verify_144bit_anchor.py", import.meta.url));
  for (const [input, status] of [[canonical, 0], [canonical.subarray(0, 17), 1], [Buffer.alloc(19), 1]]) {
    const result = spawnSync("python3", [python], { input, encoding: "utf8" });
    assert.equal(result.status, status, result.stderr);
    assert.equal(result.stdout.trim(), String(1 - status));
  }
});
