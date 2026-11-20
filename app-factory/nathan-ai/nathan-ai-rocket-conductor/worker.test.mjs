import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import worker, { accountFetch, collect, links } from "./worker.mjs";

const policy = await readFile(new URL("bitcoin-fleet-policy.json", import.meta.url), "utf8");
const genesis = "01000000" + "00".repeat(32) +
  "3ba3edfd7a7b12b27ac72c3e67768f617fc81bc3888a51323a9fb8aa4b1e5e4a29ab5f49ffff001d1dac2b7c";
const blockHash = "000000000019d6689c085ae165831e934ff763ae46a2a6c172b3f1b60a8ce26f";
const observed = {
  [links.policy]: policy,
  [links.cloudflare + "/api/health"]: JSON.stringify({ service: "nathan-ai-conductor", ready: true, release: "a".repeat(40) }),
  [links.goldenGoose + "api/health"]: JSON.stringify({ project: "modern-day-real-life-golden-goose", mode: "cleanup-lab" }),
  [links.bitcoin]: JSON.stringify({ network: "bitcoin-mainnet", header: genesis, blockHash }),
};
const fake = async (url, options) => {
  assert.equal(options.redirect, "manual");
  assert.ok(Object.hasOwn(observed, url));
  return new Response(observed[url]);
};
const db = (registered = 0) => ({ prepare(sql) {
  assert.match(sql, /^SELECT/);
  return { first: async () => ({ registered, heartbeats: 0, plannedHardwareClasses: 6 }) };
} });

test("GitHub policy, Cloudflare readiness, separate Golden Goose, and valid public Bitcoin proof", async () => {
  const result = await collect(db(), fake);
  assert.equal(result.integrationsReady, true);
  assert.equal(result.observed.github.sha256.length, 64);
  assert.equal(result.observed.bitcoin.blockHash, blockHash);
  assert.equal(result.mining.state, "awaiting-enrolled-hardware");
  assert.equal(result.mining.verified, false);
  assert.equal(result.mining.poolAcceptedShares, null);
  assert.equal(result.mining.payoutsVerified, null);
});

test("an altered header and unavailable policy produce separate failed checks", async () => {
  const result = await collect(db(1), async (url, options) => {
    if (url === links.bitcoin) return Response.json({ network: "bitcoin-mainnet", header: genesis.slice(0, -2) + "00", blockHash });
    if (url === links.policy) return new Response("Moved", { status: 302 });
    return fake(url, options);
  });
  assert.equal(result.integrationsReady, false);
  assert.equal(result.observed.bitcoin.ok, false);
  assert.equal(result.observed.github.ok, false);
  assert.equal(result.observed.goldenGoose.ok, true);
  assert.equal(result.mining.state, "awaiting-pool-verification");
});

test("registry failure stays distinct from an empty fleet", async () => {
  const result = await collect(null, fake);
  assert.equal(result.observed.fleet.ok, false);
  assert.equal(result.mining.state, "registry-unavailable");
});

test("account routes use fixed Cloudflare Worker bindings", async () => {
  const bind = name => ({ fetch: async url => ({ name, path: new URL(url).pathname }) });
  const env = { MINING_LAB: bind("mining-lab"), PLATFORM: { get: bind } };
  assert.deepEqual(await accountFetch(env, links.cloudflare + "/api/health"), {
    name: "nathan-ai-conductor", path: "/api/health",
  });
  assert.deepEqual(await accountFetch(env, links.goldenGoose + "api/health"), {
    name: "modern-day-real-life-golden-goose", path: "/api/health",
  });
  assert.deepEqual(await accountFetch(env, links.bitcoin), { name: "mining-lab", path: "/api/bitcoin-mainnet" });
});

test("public interface handles GET and has no execution routes", async () => {
  const result = await worker.fetch(new Request("https://conductor.test/health"), { RELEASE_SHA: "a".repeat(40) });
  assert.equal((await result.json()).conductor, "Nathan AI Rocket 🚀");
  for (const path of ["/api/status", "/api/start", "/api/shares"]) {
    const request = new Request("https://conductor.test" + path, { method: "POST" });
    assert.equal((await worker.fetch(request, {})).status, 405);
  }
});
