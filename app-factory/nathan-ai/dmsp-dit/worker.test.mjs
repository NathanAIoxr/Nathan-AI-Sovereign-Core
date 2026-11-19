import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const source = await readFile(new URL("./worker.js", import.meta.url), "utf8");
const { default: worker } = await import("data:text/javascript;base64," + Buffer.from(source).toString("base64"));
const DB = {
  prepare(sql) {
    return {
      async first() { return { ok: 1 }; },
      async all() {
        if (sql.includes("dmsp_departments")) return { results: [{ id: "helpdesk", title: "Digital Help Desk", scope: "Support", requires_human_review: 0 }] };
        return { results: [] };
      }
    };
  }
};
const send = (path, env = { DB }, method = "GET") => worker.fetch(new Request("https://example.test" + path, { method }), env);

test("public home is an informational HTML page with CSP", async () => {
  const r = await send("/");
  assert.equal(r.status, 200);
  assert.match(r.headers.get("content-security-policy"), /default-src 'none'/);
  assert.match(await r.text(), /DMSP \+ DIT/);
});
test("read-only public service catalog contains 28 services", async () => {
  const r = await send("/api/public/services");
  assert.equal(r.status, 200);
  const b = await r.json();
  assert.equal(b.count, 28);
  assert.equal(b.services[0].id, "helpdesk");
});
test("improvement catalog publishes 16 verified priorities", async () => {
  const r = await send("/api/public/gaps");
  assert.equal(r.status, 200);
  assert.equal((await r.json()).count, 16);
});
test("departments come from D1 binding and count is computed", async () => {
  const r = await send("/api/public/departments");
  assert.equal(r.status, 200);
  assert.equal((await r.json()).count, 1);
});
test("health reports private API locked rather than healthy customer ops", async () => {
  const r = await send("/healthz");
  assert.equal(r.status, 200);
  const b = await r.json();
  assert.equal(b.database, "reachable");
  assert.equal(b.private_api, "not_configured");
  assert.equal(b.customer_monitoring, "not_configured");
});
test("missing database is a degraded health state", async () => {
  const r = await send("/healthz", {});
  assert.equal(r.status, 503);
});
test("private API fails closed without administrator secret", async () => {
  const r = await send("/api/tenants");
  assert.equal(r.status, 503);
  assert.equal((await r.json()).error, "not_configured");
});
test("private writes cannot run without auth configuration", async () => {
  const r = await send("/api/tickets", { DB }, "POST");
  assert.equal(r.status, 503);
});
test("comparison endpoint identifies all three generations", async () => {
  const r = await send("/api/public/comparison");
  const data = await r.json();
  assert.equal(data.models.length, 3);
  assert.match(data.dmsp_dit, /governance/);
});
