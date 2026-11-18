import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { assembleAtlas, atlasSources, collections, snapshot, sourceRows } from "./collections.mjs";
import { handle } from "./worker.mjs";

const root = new URL("../../", import.meta.url);
const load = async name => JSON.parse(await readFile(new URL(name, root), "utf8"));

test("original roster counts and the two independent 101-entry editions remain intact", async () => {
  const expected = new Map([
    ["Mind of Minds", 763], ["Worker Bot Families v21", 21], ["Worker Bot Families v40", 40],
    ["Figurative Families v48", 48], ["Literal Families v56", 56], ["Family 65–75 definitions", 11],
    ["Family 65–75 numbered members", 99], ["Continuity v496 · positions 164–496", 333],
    ["Full Stack · Technology 108", 108], ["Dimensions 0–69", 70], ["Dimensional units", 630],
    ["Creator Teams", 10], ["Specialist Bees", 25], ["Tabor World World Engine · 101 Applications", 101],
  ]);
  const rows = [];
  for (const [name, path, key] of collections) {
    const selected = sourceRows(await load(path), key);
    if (expected.has(name)) assert.equal(selected.length, expected.get(name), name);
    rows.push(...selected);
  }
  assert.ok(rows.length > 3000);
  const sourceLibrary = await load(atlasSources.library);
  const library = await load("app-factory/tabor-universal-library-engine/public/library/catalog.json");
  assert.equal(library.entries.length, 101);
  assert.notEqual(library.entries[0].title, sourceLibrary.cartridges[0].title);
});

test("the unchanged Atlas factory reconstructs all 832 rows and source cross-links", async () => {
  const atlas = await assembleAtlas(load, name => import(new URL(name, root)));
  assert.equal(atlas.rows.length, 832);
  assert.equal(atlas.rows.filter(row => row.kind === "Chemical element").length, 118);
  assert.equal(new Set(atlas.rows.map(row => row.id)).size, 832);
  assert.ok(atlas.rows.some(row => row.connections?.length));
});

test("edge only serves the pinned verified public allowlist", async () => {
  const revision = "f".repeat(40);
  const visited = [];
  const fetcher = async (url, init) => {
    visited.push({ url, method: init.method, redirect: init.redirect });
    return new Response("source body");
  };
  const route = path => new Request("https://tabor-world-recovery.example" + path);
  const health = await handle(route("/health"), revision, fetcher);
  assert.deepEqual(await health.json(), { service: "tabor-world-recovery", collections: 31,
    sourceRevision: snapshot, viewerRevision: revision });
  assert.equal((await handle(route("/"), revision, fetcher)).status, 200);
  await handle(route("/" + atlasSources.library + "?ref=main"), revision, fetcher);
  assert.match(visited[0].url, new RegExp("/" + revision + "/"));
  assert.match(visited[1].url, new RegExp("/" + snapshot + "/"));
  assert.ok(visited.every(item => item.redirect === "manual"));
  assert.equal((await handle(route("/.git/config"), revision, fetcher)).status, 404);
  assert.equal((await handle(route("/owner-manuscript.json"), revision, fetcher)).status, 404);
  assert.equal(visited.length, 2);
});
