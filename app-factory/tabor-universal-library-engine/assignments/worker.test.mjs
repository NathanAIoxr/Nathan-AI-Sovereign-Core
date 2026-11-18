import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {DatabaseSync} from "node:sqlite";
import test from "node:test";
import worker, {assign, assess, review, roster, run, status} from "./worker.mjs";

const next = Object.keys(roster).map(id => ({id, title: id}));
const fixture = {current: "2026-11-17.4", next};
const limits = {standaloneGames: 101, bookPages: 94, websiteRecords: 1, databaseBindings: 25, trackerCatalog: 101, runnable: 18};
const data = {
  world: {counts: limits}, library: {entries: 101},
  connections: {totals: {ready: 25}, providers: [{title: "Notion", state: "D1 snapshot"}]},
  standalone: {counts: {games: 101, books: 94}},
  inventory: {items: [{id: "site", type: "sites", path: "/sites/site/"}]},
  atlas: {id: "066", title: "Alice in Wonderland"},
  devices: {viewport: true, manifest: {scope: "/games/atlas-066/", start_url: "/games/atlas-066/"}},
};

function bindings() {
  const db = new DatabaseSync(":memory:");
  db.exec(readFileSync(new URL("./migration.sql", import.meta.url), "utf8"));
  const service = paths => ({fetch(request) {
    const value = paths[new URL(request).pathname];
    return typeof value === "string" ? new Response(value) : Response.json(value ?? {});
  }});
  return {
    db,
    env: {
      WORLD: service({"/api/releases": fixture, "/api/health": data.world, "/library/api/health": data.library,
        "/library/api/connections": data.connections, "/library/api/entries/066": data.atlas}),
      STANDALONE: service({"/api/health": data.standalone, "/api/catalog": data.inventory,
        "/games/atlas-066/": '<meta name="viewport">', "/games/atlas-066/manifest.webmanifest": data.devices.manifest}),
      RECEIPTS: {prepare(sql) {
        const statement = db.prepare(sql);
        return {bind: (...params) => ({run: () => statement.run(...params)}), first: () => statement.get()};
      }},
    },
  };
}

test("every open item has a bot and an agent, with a fallback for future entries", () => {
  const tasks = assign({...fixture, next: [...next, {id: "new-task", title: "New task"}]});
  assert.equal(tasks.length, 6);
  assert.equal(new Set(tasks.map(t => t.bot)).size, 6);
  assert.equal(new Set(tasks.map(t => t.agent)).size, 6);
  assert.equal(tasks[5].bot, "Release Triage Bee");
  assert.throws(() => assign({...fixture, next: [next[0], next[0]]}), /duplicate/);
});

test("checks distinguish live coverage from device and access work", () => {
  for (const task of next) assert.ok(assess(task.id, data).every(c => c.pass));
  assert.equal(review("phone-qa", assess("phone-qa", data)).state, "manual-device-check");
  assert.equal(review("provider-credentials", assess("provider-credentials", data)).state, "provider-review");
  assert.equal(review("app-inventory", assess("app-inventory", {...data, inventory: null})).state, "attention");
});

test("a scheduled run persists real receipts and retry writes stay idempotent", async () => {
  const {db, env} = bindings();
  const now = Date.parse("2026-11-18T02:00:00Z");
  assert.equal((await status(env)).checkedAt, null);
  assert.equal(await run(env, now), 5);
  await run(env, now + 1000);
  const receipt = await status(env);
  assert.equal(receipt.checkedAt, new Date(now).toISOString());
  assert.ok(receipt.tasks.every(task => task.checks.every(check => check.pass)));
  assert.ok(receipt.tasks.every(task => task.workState === "open"));
  assert.equal(db.prepare("select count(*) AS total from tabor_library_assignment_runs").get().total, 1);
  assert.equal((await worker.fetch(new Request("https://test/api/assignments"), env)).status, 200);
  assert.equal((await worker.fetch(new Request("https://test/api/assignments", {method: "POST"}), env)).status, 405);
  db.close();
});
