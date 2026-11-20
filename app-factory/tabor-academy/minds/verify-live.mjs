import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { release } from "./build.mjs";

const base = "https://tabor-bridge.nathantaboract.workers.dev/tabor-academy/minds/";
const pages = "https://nathanaioxr.github.io/Nathan-AI-Sovereign-Core/app-factory/nathan-ai/minds-chat/";
const namedAssets = ["app.js", "engine.js", "lasso-evidence.json", "lasso-prompts.json"];

async function get(url) {
  const response = await fetch(url, { cache: "no-store", redirect: "error", signal: AbortSignal.timeout(20_000) });
  if (!response.ok) throw new Error("HTTP " + response.status + " at " + url);
  return response;
}
async function compareAssets(root) {
  await Promise.all(namedAssets.map(async file => {
    const expected = await readFile(new URL("../../nathan-ai/minds-chat/" + file, import.meta.url), "utf8");
    const response = await get(root + file);
    assert.equal(await response.text(), expected, file + " differs at " + root);
    if (root === base) assert.equal(response.headers.get("x-tabor-minds-release"), release);
  }));
}
const mode = process.argv[2];
if (mode !== "--pages") {
  const response = await get(base);
  assert.equal(response.headers.get("x-tabor-minds-release"), release);
  assert.match(await response.text(), /data-minds-chat/);
  await compareAssets(base);
  console.log("Cloudflare Minds release " + release + " verified");
}
if (mode !== "--edge") {
  await compareAssets(pages);
  const response = await get(new URL("../hop-in/chatbox/", pages).href);
  assert.match(await response.text(), /id="open-minds"/);
  console.log("HOP IN and Lasso assets verified");
}
