import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createWorker } from "./runtime.mjs";

const apps = JSON.parse(await readFile(new URL("./apps.json", import.meta.url), "utf8"));
const selected = process.env.TEST_APP;
const makeContext = (email = "owner@example.com", aud = "audience") => ({
  access: { aud, getIdentity: async () => ({ email }) },
});
const makeRequest = (path, init) => new Request("https://edition.example" + path, init);

test("independent app IDs and deployment targets are unique", () => {
  assert.equal(new Set(apps.map((app) => app.id)).size, apps.length);
  assert.equal(new Set(apps.map((app) => app.worker)).size, apps.length);
});
for (const app of apps.filter(({ id }) => !selected || selected === id)) {
  test(app.id + " source, book, game and owner checks", async () => {
    const source = { name: "source.md", key: "release-v1/edition/source.md", size: 15, sha256: "verified" };
    const text = "<script>original source</script>";
    const env = { OWNER_AUDIENCE: "audience", OWNER_EMAIL: "owner@example.com", BACKUP_KEY: "fixture",
      SOURCES: { get: async (key) => {
        assert.equal(key, source.key);
        return { body: text, text: async () => text, size: text.length, customMetadata: { sha256: "verified" } };
      } } };
    const worker = createWorker(app, { sources: [source], references: [], links: [], book: source.name, indexUrl: "https://index.example" });
    const get = (path, context = makeContext()) => worker.fetch(makeRequest(path), env, context);

    const manifest = JSON.parse(await readFile(new URL("./" + app.id + "/app.json", import.meta.url), "utf8"));
    assert.deepEqual(app, manifest);
    for (const path of ["/", "/book", "/game", "/original/source.md", "/api/sources", "/backup-key"]) {
      assert.equal((await get(path, {})).status, 403);
      assert.equal((await get(path, makeContext("other@example.com"))).status, 403);
      assert.equal((await get(path, makeContext("owner@example.com", "wrong"))).status, 403);
    }
    assert.match(await (await get("/")).text(), /Nathan Tabor/);
    assert.match(await (await get("/book")).text(), /&lt;script&gt;original source/);
    assert.equal(await (await get("/original/source.md")).text(), text);
    assert.equal((await get("/original/source.md")).headers.get("X-Source-SHA256"), "verified");
    assert.equal((await get("/original/unknown.md")).status, 404);
    assert.equal((await get("/backup-key")).status, app.id === "index" ? 200 : 404);
    assert.equal((await worker.fetch(makeRequest("/", { method: "POST" }), env, makeContext())).status, 405);
    assert.equal((await get("/healthz", {})).status, 200);
    assert.doesNotMatch(await (await get("/healthz", {})).text(), /source\.md/);
    if (app.quiz.length) assert.match(await (await get("/game")).text(), /data-answer="yes"/);
    assert.equal((await worker.fetch(makeRequest("/", { method: "HEAD" }), env, makeContext())).body, null);
  });
}
