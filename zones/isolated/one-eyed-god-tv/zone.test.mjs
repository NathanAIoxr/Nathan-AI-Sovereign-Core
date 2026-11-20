import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { Script } from "node:vm";
import worker, { ZoneState } from "./worker.mjs";

const read = (name) => readFileSync(new URL(name, import.meta.url), "utf8");
const manifest = JSON.parse(read("./app.json"));

test("the browser entry and bundle are present", () => {
  const page = read("./web/index.html");
  assert.ok(page.includes(manifest.title));
  assert.ok(page.includes('./app.js'));
  assert.ok(page.includes('./app.css'));
  new Script(read("./web/app.js"));
});

const env = {
  PROJECT_ID: manifest.projectId,
  STAGING_ALIAS: manifest.alias,
  ZONE_DB: {prepare: () => ({bind: () => ({first: async () => ({launch_status: "HOLDING"})})})},
  ZONE_CONFIG: {get: async () => "HOLDING"},
  ZONE_ASSETS: {
    get: async (key) => key === "staging/zone-app.json" ? {json: async () => manifest} : {body: read("./web/index.html")},
    head: async () => ({})
  },
  ZONE_JOBS: {},
  ZONE_STATE: {idFromName: (id) => id, get: () => ({fetch: async () => Response.json({storageReady:true})})}
};

test("an unrelated hostname and write requests miss the holding zone", async () => {
  assert.equal((await worker.fetch(new Request("https://wrong.test/"), env)).status, 404);
  assert.equal((await worker.fetch(new Request("https://" + manifest.alias + "/", {method:"POST"}), env)).status, 404);
});

test("only the synthetic holding state serves the package and health check", async () => {
  const url = "https://" + manifest.alias;
  assert.equal((await worker.fetch(new Request(url + "/"), env)).status, 200);
  assert.equal((await worker.fetch(new Request(url + "/", {method:"HEAD"}), env)).status, 200);
  const ready = await worker.fetch(new Request(url + "/health"), env);
  assert.equal(ready.status, 200);
  assert.equal((await ready.json()).ready, true);
  const blocked = {...env, ZONE_CONFIG:{get: async () => null}};
  assert.equal((await worker.fetch(new Request(url + "/"), blocked)).status, 404);
});

test("Durable Object reports the storage gate", async () => {
  const isolated = new ZoneState({storage: {get: async () => true}});
  const response = await isolated.fetch(new Request("https://zone-state.invalid/health"));
  assert.equal((await response.json()).storageReady, false);
});
