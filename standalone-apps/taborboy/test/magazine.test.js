import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { Script } from "node:vm";
import test from "node:test";
import { magazineResponse } from "../../magazine-runtime.mjs";
import { MAGAZINE as site } from "../src/magazine.js";

const origin = "https://example.test";
const dispatch = (path,env={},options={}) => magazineResponse(new Request(origin+path,options),env,site);

test("magazine home, reader and all cover files are present and independently identified",async () => {
  const home = await dispatch("/");
  const html = await home.text();
  assert.match(html,/Find an issue/);
  assert.match(html,/Collyn Tabor and Nathan Tabor/);
  const response = await dispatch("/api/magazine");
  const catalog = await response.json();
  assert.equal(catalog.name,site.name);
  assert.equal(catalog.issues.length,3);
  const manifest = JSON.parse(await readFile(new URL("../covers/manifest.json",import.meta.url),"utf8"));
  for (const issue of site.issues) {
    const cover = await readFile(new URL("../covers/"+issue.cover+".webp",import.meta.url));
    const row = manifest.find(record=>record.file===issue.cover+".webp");
    assert.equal(createHash("sha256").update(cover).digest("hex"),row.sha256);
    const reader = await dispatch("/magazine/issues/"+issue.id);
    assert.equal(reader.status,200);
  }
});

test("game, manifest and service worker ship, and cover lookup is isolated",async () => {
  const game = await dispatch("/magazine/play");
  assert.match(await game.text(),/id="board"/);
  new Script(await (await dispatch("/magazine/game.js")).text());
  new Script(await (await dispatch("/magazine/reader.js")).text());
  const serviceWorker = await (await dispatch("/magazine/sw.js")).text();
  new Script(serviceWorker);
  assert.doesNotMatch(serviceWorker,/\/ops\/|\/sources\//);
  const manifest = await (await dispatch("/magazine/manifest.webmanifest")).json();
  assert.equal(manifest.display,"standalone");
  assert.equal(manifest.scope,"/magazine/");
  const binding = {[site.binding]:{get:async key=>({body:key,httpEtag:'"edition"'})}};
  const asset = "/magazine/covers/"+site.issues[0].cover+".webp";
  const cover = await dispatch(asset,binding);
  assert.equal(cover.headers.get("content-type"),"image/webp");
  assert.equal(await cover.text(),asset.slice(1));
  assert.equal((await dispatch("/magazine/covers/other-site.webp",binding)).status,404);
  assert.equal(await dispatch("/sources/private.txt",binding),null);
  assert.equal((await dispatch(asset,binding,{headers:{"if-none-match":'"edition"'}})).status,304);
});
