import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { release } from "./build.mjs";

const revision = process.argv[2];
assert.match(revision ?? "", /^[0-9a-f]{40}$/u);
const origin = process.env.MINDS_ORIGIN ?? "https://tabor-bridge.nathantaboract.workers.dev/tabor-academy/minds/";
const get = async path => {
  const response = await fetch(new URL(path, origin), {
    cache: "no-store",
    signal: AbortSignal.timeout(20_000)
  });
  assert.equal(response.status, 200, path);
  assert.equal(response.headers.get("x-tabor-minds-release"), release, path);
  return response;
};

const health = await (await get("healthz")).json();
assert.equal(health.service, "tabor-academy-minds");
assert.equal(health.ready, true);
assert.equal(health.revision, revision);
assert.equal(health.release, release);

const root = new URL("../../nathan-ai/minds-chat/", import.meta.url);
for (const file of ["engine.js", "app.js", "style.css", "sources.json"]) {
  const [remote, local] = await Promise.all([get(file), readFile(new URL(file, root), "utf8")]);
  assert.equal(await remote.text(), local, file);
  if (file === "sources.json") assert.equal(health.records, JSON.parse(local).lassoTruth.records.length);
}
assert.match(await (await get("?mind=author.nathan-tabor")).text(), /data-minds-chat/u);
console.log(JSON.stringify(health));
