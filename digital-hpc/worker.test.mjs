import assert from "node:assert/strict";
import test from "node:test";
import { gzipSync } from "node:zlib";
import worker from "./worker.mjs";
import executor from "./executor.mjs";
import { digest, fixture, systems } from "./model.mjs";

const req = (path, init) => new Request("https://test.invalid" + path, init);
const db = (codec, body) => ({ prepare() { return { bind() { return { first: async () => ({ codec, body }) }; } }; } });
const env = {
  EXECUTOR: { fetch: (url) => executor.fetch(new Request(url)) },
  CHECKPOINTS: db("json", fixture),
  ARCHIVE: db("gzip-base64", gzipSync(fixture).toString("base64")),
  WARM_OBJECTS: { get: async () => ({ text: async () => fixture, storageClass: "Standard" }) },
  COLD_OBJECTS: { get: async () => ({ arrayBuffer: async () => gzipSync(fixture), storageClass: "InfrequentAccess" }) }
};

test("ten verified shards perform 10x as many FP64 dot product terms", async () => {
  const response = await worker.fetch(req("/api/compare?system=" + systems[0].id), env);
  assert.equal(response.status, 200);
  const { timingMs, sha256, ...receipt } = await response.json();
  assert.equal(receipt.baseline.terms, 4096);
  assert.equal(receipt.expanded.terms, 40960);
  assert.equal(receipt.expanded.algorithmOperations, 81920);
  assert.equal(receipt.expanded.parts.length, 10);
  assert.equal(receipt.workFactor, 10);
  assert.equal(sha256, await digest(JSON.stringify(receipt)));
});

test("archive restore and bit-flip recovery detect and handle bad data", async () => {
  const response = await worker.fetch(req("/api/restore"), env);
  assert.equal(response.status, 200);
  const restored = await response.json();
  assert.equal(restored.sha256, await digest(fixture));
  assert.equal(restored.classes.archive, "InfrequentAccess");
  assert.equal((await worker.fetch(req("/api/restore?storage=d1"), env)).status, 200);
  const badArchive = { ...env, ARCHIVE: db("gzip-base64", gzipSync("different").toString("base64")) };
  assert.equal((await worker.fetch(req("/api/restore?storage=d1"), badArchive)).status, 503);
  assert.equal((await (await worker.fetch(req("/api/fault"), env)).json()).verified, true);
  assert.equal((await worker.fetch(req("/api/compare?system=elsewhere"), env)).status, 400);
});
