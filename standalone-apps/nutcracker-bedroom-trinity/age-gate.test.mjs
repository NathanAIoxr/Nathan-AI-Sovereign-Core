import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

for (const id of ["solomon", "cleopatra", "virgin-mary"]) {
  const product = JSON.parse(await readFile(new URL(`products/${id}.json`, import.meta.url), "utf8"));
  const { default: worker } = await import(`./dist/${product.worker}.mjs`);
  const origin = "https://unified-operations-cockpit.nathantaboract.workers.dev";
  const mount = `/18-plus/bronze-hands/${product.worker}`;
  const request = (path, options) => worker.fetch(new Request(origin + mount + path, options));
  const post = (path, body, cookie) => request(path, {
    method: "POST",
    body: new URLSearchParams(body),
    headers: { Origin: origin, ...(cookie ? { Cookie: cookie } : {}) }
  });

  test(`${id} keeps adult copy behind age confirmation and supports exiting`, async () => {
    const landing = await request("/");
    assert.equal((await request("")).headers.get("Location"), mount + "/");
    const before = await landing.text();
    assert.match(before, /Are you 18 or older/);
    assert.ok(!before.includes(product.name));
    assert.doesNotMatch(before, /silicone-material-study\.webp|bronze-hands\.webp/);
    assert.match(landing.headers.get("Cache-Control"), /no-store/);

    const denied = await post("/age", { answer: "no" });
    assert.equal(denied.headers.get("Location"), mount + "/declined");
    assert.match(denied.headers.get("Set-Cookie"), /Max-Age=0/);
    assert.match(await (await request("/declined")).text(), /You must be 18 or older/);

    const confirmation = await post("/age", { answer: "yes" });
    assert.equal(confirmation.status, 303);
    const setCookie = confirmation.headers.get("Set-Cookie");
    assert.match(setCookie, /HttpOnly; Secure; SameSite=Strict/);
    assert.ok(setCookie.startsWith(`__Host-bronze-hands-18-${id}=`));
    assert.equal(confirmation.headers.get("Location"), mount + "/");
    assert.doesNotMatch(setCookie, /Domain=/);
    const cookie = setCookie.split(";")[0];
    const after = await (await request("/", { headers: { Cookie: cookie } })).text();
    assert.ok(after.includes(product.name));
    assert.ok(after.includes(product.attribution));
    assert.match(after, /Matte silicone/);
    assert.ok(after.includes(product.color));
    assert.match(after, /silicone-material-study\.webp\?v=[a-f0-9]{12}/);
    assert.match(after, /Product artwork is pending/);
    assert.doesNotMatch(after, /bronze-hands\.webp|concept\.webp/);
    const study = await request("/silicone-material-study.webp?v=test", { headers: { Cookie: cookie } });
    assert.equal(study.headers.get("Content-Type"), "image/webp");
    assert.match(study.headers.get("Cache-Control"), /no-store/);
    assert.deepEqual(Buffer.from(await study.arrayBuffer()), await readFile(new URL("assets/silicone-material-study.webp", import.meta.url)));
    assert.ok(after.includes("Approved by Humanity and the KJV. Bible"));
    assert.ok(after.includes("OH MY GOD LORD JESUS CHRIST"));
    assert.equal(after.includes("Let her breasts satisfy thee at all times."), id === "solomon");

    const exit = await post("/leave", {}, cookie);
    assert.equal(exit.headers.get("Location"), mount + "/");
    assert.match(exit.headers.get("Set-Cookie"), /Max-Age=0/);
    assert.equal(await (await request("/health")).text(), "ok");
  });

  test(`${id} serves resources and rejects off-site confirmation`, async () => {
    const response = await request("/age", {
      method: "POST",
      body: new URLSearchParams({ answer: "yes" }),
      headers: { Origin: "https://example.com" }
    });
    assert.equal(response.status, 403);
    assert.equal(response.headers.get("Set-Cookie"), null);

    assert.equal((await request("/bronze-hands.webp")).status, 404);
    assert.equal((await request("/concept.webp")).status, 404);
    assert.equal((await request("/silicone-material-study.webp")).status, 404);
    assert.equal((await request("/instrument-serif.woff2")).headers.get("Content-Type"), "font/woff2");
    assert.equal((await request("/unknown")).status, 404);
    assert.equal(await (await request("/", { method: "HEAD" })).text(), "");
  });
}

test("shared ingress routes only the designated 18+ paths to the independent Workers", async () => {
  const { dispatchTaborApp } = await import("../tabor-app-runtime/tabor-app-dispatch.mjs");
  const origin = "https://unified-operations-cockpit.nathantaboract.workers.dev";
  const calls = [];
  const platforms = { get(name) {
    return { fetch(request) {
      calls.push({ name, path: new URL(request.url).pathname, method: request.method });
      return new Response("forwarded");
    } };
  } };

  const prefix = "/18-plus/bronze-hands/";
  const name = "cleopatra-bronze-hands";
  const routed = await dispatchTaborApp(new Request(origin + prefix + name + "/age", { method: "POST" }), platforms);
  assert.equal(await routed.text(), "forwarded");
  assert.deepEqual(calls.shift(), { name, method: "POST", path: prefix + name + "/age" });
  assert.equal((await dispatchTaborApp(new Request(origin + prefix + "unknown/"), platforms)).status, 404);
  assert.equal(await dispatchTaborApp(new Request(origin + "/unrelated"), platforms), null);

  const directory = await dispatchTaborApp(new Request(origin + "/tabor-apps/"), platforms);
  const html = await directory.text();
  assert.match(html, /Tabor Apps/);
  assert.doesNotMatch(html, /bronze-hands/);
  assert.equal(calls.length, 0);
});

test("Conductor receipt links to each age-gated site and lists pending artwork", async () => {
  const { serveNutcrackerBedroomHandoff } = await import("../../deployments/conductor/handoffs/nutcracker-bedroom.mjs");
  const route = "/api/handoffs/nutcracker-bedroom";
  const url = "https://example.test" + route;
  const response = serveNutcrackerBedroomHandoff(new Request(url), route);
  const release = await response.json();
  assert.equal(release.materialDirection, "Matte silicone");
  assert.equal(release.sites.length, 3);
  assert.equal(new Set(release.sites.map(({ url }) => url)).size, 3);
  assert.match(release.artwork.pending, /Three distinct/);
  assert.equal(serveNutcrackerBedroomHandoff(new Request(url, { method: "POST" }), route).status, 405);
  assert.equal(serveNutcrackerBedroomHandoff(new Request(url), "/api/health"), null);
});
