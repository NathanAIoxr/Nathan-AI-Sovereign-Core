import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { withProtection } from "./releases.mjs";
import world from "../tabor-universal-library-engine/world-gateway/worker.mjs";

const host = "https://example.invalid";
const html = () => new Response("<main></main>", {
  headers: { "content-type": "text/html; charset=utf-8", "etag": '"old"', "content-length": "13", "x-original": "present" },
});
function mock() {
  const calls = [];
  class Rewriter {
    on(selector, handler) {
      handler.element({
        prepend(text, options) { calls.push([selector, "prepend", text, options]); },
        before(text, options) { calls.push([selector, "before", text, options]); },
      });
    }
    transform(response) { return response; }
  }
  return { calls, Rewriter };
}

test("Bible Topia presents the purpose and consent above existing features", async () => {
  const {calls, Rewriter} = mock();
  const original = { async fetch() { return html(); } };
  const response = await withProtection(original, "bibletopia", Rewriter).fetch(new Request(host));
  assert.equal(calls.length, 2);
  assert.deepEqual(calls.map(x => x.slice(0, 2)), [["main", "prepend"], ["#accord-form", "before"]]);
  assert.match(calls[0][2], /no missing children/);
  assert.match(calls[0][2], /James 1:27.*Romans 13:7/);
  assert.match(calls[1][2], /consent and autonomy/);
  assert.equal(response.headers.get("x-original"), "present");
  assert.equal(response.headers.get("etag"), null);
  assert.equal(response.headers.get("x-tabor-protection-release"), "1");
});

test("HTML-only overlays preserve original requests, responses and scheduled handler", async () => {
  const {calls, Rewriter} = mock();
  const response = new Response("original", { status: 404 });
  const env = {};
  const ctx = {};
  const fetches = [];
  const runtime = {
    scheduled() {},
    fetch(req, input, execution) { fetches.push([req, input, execution]); return response; },
  };
  const wrapped = withProtection(runtime, "library-of-tabor", Rewriter);
  for (const [path, method] of [["/library/", "HEAD"], ["/library/api/connections", "GET"], ["/library/", "GET"]]) {
    const req = new Request(host + path, {method});
    assert.equal(await wrapped.fetch(req, env, ctx), response);
    assert.deepEqual(fetches.at(-1), [req, env, ctx]);
  }
  assert.equal(wrapped.scheduled, runtime.scheduled);
  assert.equal(calls.length, 0);
  await withProtection({ fetch: html }, "library-of-tabor", Rewriter).fetch(new Request(host + "/library/"));
  assert.deepEqual(calls.map(x => x.slice(0, 2)), [["#connections-status", "before"]]);
});

test("Tabor World reproduces all eight source principles in its opening protection section", async () => {
  const registry = JSON.parse(readFileSync(new URL("../one/tabor-recovered/Tabor_Accords_Recovery_Registry_2026-11-01.json", import.meta.url)));
  const response = await world.fetch(new Request(host));
  const body = await response.text();
  const section = body.match(/<section id="protect-innocence"[^>]*>(.*?)<\/section>/s)?.[1];
  assert(section);
  assert.match(section, /Protect Innocence/);
  const actual = [...section.matchAll(/<li>(.*?)<\/li>/g)].map(match => match[1]);
  assert.deepEqual(actual, registry.connected_topics.ethical_governance);
  assert.match(section, /#protect-innocence/);
});
