import test from "node:test";
import assert from "node:assert/strict";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const output = resolve(process.env.MIND_BUILD_DIR ?? "build");
const get = async name => (await import(pathToFileURL(resolve(output, name + ".mjs")))).default;
const [registry, zero, one] = await Promise.all(["registry", "zero", "one"].map(get));
const release = "a".repeat(40);
const env = { RELEASE_SHA: release, PLATFORM: { get(worker) {
  if (worker === "tabor-mind-zero") return { fetch: request => zero.fetch(request instanceof Request ? request : new Request(request), env) };
  if (worker === "tabor-mind-one") return { fetch: request => one.fetch(request instanceof Request ? request : new Request(request), env) };
  assert.equal(worker, "nathan-ai-conductor");
  return { fetch: async () => Response.json({ service: worker, ready: true, release }) };
} } };
const fetch = (path, init) => registry.fetch(new Request("https://minds.example/sovereign-minds" + path, init), env);
const lasso = (path, id, quote) => fetch(path, {
  method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, quote }),
});

test("each binary Mind is served by a distinct Worker with its own facets and prompt", async () => {
  const [z, o] = await Promise.all(["zero", "one"].map(async id => (await fetch("/" + id + "/api/mind")).json()));
  assert.equal(z.id, "zero");
  assert.equal(o.id, "one");
  assert.equal(z.symbol, "0");
  assert.equal(o.symbol, "1");
  for (const entry of [z, o]) {
    assert.deepEqual(Object.keys(entry.facets), ["mind", "body", "eyes", "soul", "spirit", "shadow"]);
    assert.match(entry.prompt, /Lasso of Truth/);
  }
  for (const part of Object.keys(z.facets)) assert.notEqual(z.facets[part], o.facets[part]);
  assert.match(await (await fetch("/zero/prompt")).text(), /Sovereign box: zero/);
  assert.match(await (await fetch("/one/prompt")).text(), /Sovereign box: one/);
});

test("Lasso permits only exact approved language attributed to the creator", async () => {
  const direct = await (await lasso("/zero/lasso", "zero", "Zero will be its own mind")).json();
  assert.equal(direct.status, "exact-creator-source");
  assert.equal(direct.attributedTo, "Nathan Tabor");
  for (const text of ["zero will be its own mind", "Zero will be its own mind.", "one will be its own mind"]) {
    const proposed = await (await lasso("/zero/lasso", "zero", text)).json();
    assert.equal(proposed.status, "withheld-unverified");
    assert.equal(proposed.attributedTo, null);
    assert.equal(proposed.proposal, text);
  }
  assert.equal((await lasso("/zero/lasso", "one", "one will be its own mind")).status, 404);
  const quotation = "Blessed are the peacemakers: for they shall be called the children of God.";
  const passage = await (await lasso("/lasso", "atlas.textual.jesus", quotation)).json();
  assert.equal(passage.status, "exact-textual-attribution");
  assert.equal(passage.attributedTo, null);
  assert.match(passage.locator, /Matthew 5:9.*KJV/);
  const unrelated = await (await lasso("/lasso", "atlas.omni.opal-ai", quotation)).json();
  assert.equal(unrelated.status, "withheld-unverified");
});

test("public sources retain separate IDs, and private Box slots expose no private content", async () => {
  const status = await (await fetch("/health")).json();
  const result = await (await fetch("/api/minds?origin=atlas")).json();
  assert.ok(result.total >= 763);
  assert.ok(status.count >= 1572);
  assert.equal((await (await fetch("/api/minds?origin=council")).json()).total, 60);
  const opal = (await (await fetch("/api/minds?q=Opal")).json()).records.find(item => item.id === "atlas.omni.opal-ai");
  assert.ok(opal);
  const slot = await (await fetch("/api/minds/box.R101")).json();
  assert.equal(slot.name, "R101");
  assert.equal(slot.status, "reserved-private-concept");
  assert.match(slot.purpose, /^Private concept slot/);
  const withheld = await (await lasso("/lasso", opal.id, "A proposed attribution")).json();
  assert.equal(withheld.status, "withheld-unverified");
});

test("Conductor reads bounded health routes and reports the exact source release", async () => {
  const status = await (await fetch("/api/conductors")).json();
  assert.equal(status.gitHubRelease, release);
  assert.ok(status.master.ready && status.zero.ready && status.one.ready);
});
