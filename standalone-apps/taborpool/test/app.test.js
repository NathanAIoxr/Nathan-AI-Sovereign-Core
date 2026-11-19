import assert from "node:assert/strict";
import test from "node:test";
import { Script } from "node:vm";
import worker from "../src/index.js";

const app = path => worker.fetch(new Request("https://taborpool.test" + path),{});

test("advertises its own app and serves a scoped standalone manifest",async () => {
  assert.match(await (await app("/")).text(), /href="\/app\/">Open app/);
  assert.equal((await app("/app")).status,308);
  const page = await app("/app/");
  assert.match(page.headers.get("content-security-policy"), /script-src 'self'/);
  assert.match(await page.text(), /id="ledger-form"/);
  const manifest = await (await app("/app/manifest.webmanifest")).json();
  assert.equal(manifest.name,"TABORPOOL");
  assert.equal(manifest.scope,"/app/");
  assert.equal(manifest.display,"standalone");
  for (const icon of manifest.icons) {
    const response = await app(icon.src);
    assert.equal(response.headers.get("content-type"),"image/png");
    const view = new DataView(await response.arrayBuffer());
    assert.equal(view.getUint32(16),Number(icon.sizes.split("x")[0]));
    assert.equal(view.getUint32(20),Number(icon.sizes.split("x")[1]));
  }
});

test("ships runnable client assets and keeps private endpoints outside the offline shell",async () => {
  const source = await (await app("/app/main.js")).text();
  new Script(source);
  assert.match(source,/subtle.digest\("SHA-256"/);
  assert.match(source,/taborpool-simulation-ledger\.csv/);
  const sw = await (await app("/app/sw.js")).text();
  new Script(sw);
  assert.doesNotMatch(sw,/\/ops\/|\/sources\/|\/ledger"/);
  assert.equal((await app("/app/unknown")).status,404);
});
