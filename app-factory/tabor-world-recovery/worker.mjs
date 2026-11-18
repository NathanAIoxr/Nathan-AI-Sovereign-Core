import { collections, atlasModule, atlasSources, snapshot } from "./collections.mjs";

import { handleRuntime } from "./runtime-api.mjs";
import { fieldRequest } from "./field-api.mjs";

const recovery = "app-factory/tabor-world-recovery";
const localAssets = new Set(["index.html", "viewer.mjs", "collections.mjs", "federation.json", "runtime.html", "runtime-ui.mjs", "field.html", "field-ui.mjs"]);
const sourcePaths = new Set([...collections.map(([, path]) => path), atlasModule, ...Object.values(atlasSources)]);
const releaseId = /^[0-9a-f]{40}$/;
const rawRoot = "https://raw.githubusercontent.com/NathanAIoxr/Nathan-AI-Sovereign-Core/";

export async function handle(request, revision, fetcher = fetch, fieldScenarios = null) {
  const url = new URL(request.url);
  if (!releaseId.test(revision ?? "")) return new Response("Recovery revision is unconfigured", { status: 503 });
  if (url.pathname.startsWith("/api/field/")) return fieldRequest(request, fieldScenarios);
  if (url.pathname.startsWith("/api/runtime/")) {
    return handleRuntime(request, async path => {
      if (!sourcePaths.has(path)) throw new Error("Source path not allowed");
      const sha = path === recovery + "/federation.json" ? revision : snapshot;
      const response = await fetcher(rawRoot + sha + "/" + path, {
        redirect: "manual", signal: AbortSignal.timeout(9000),
      });
      if (!response.ok) {
        await response.body?.cancel();
        throw new Error("Pinned source unavailable");
      }
      return response.json();
    }, revision);
  }
  if (request.method !== "GET" && request.method !== "HEAD") {
    return new Response("Method not allowed", { status: 405, headers: { Allow: "GET, HEAD" } });
  }
  if (url.pathname === "/health") return Response.json({
    service: "tabor-world-recovery", sourceRevision: snapshot, viewerRevision: revision,
    collections: collections.length + 1,
  }, { headers: { "cache-control": "no-store" } });
  const path = url.pathname === "/" ? "index.html" :
    ["/runtime", "/runtime/"].includes(url.pathname) ? "runtime.html" :
    ["/field", "/field/"].includes(url.pathname) ? "field.html" : url.pathname.slice(1);
  const leaf = path.startsWith(recovery + "/") ? path.slice(recovery.length + 1) : path;
  const own = localAssets.has(leaf);
  if (!own && !sourcePaths.has(path)) return new Response("Not found", { status: 404 });
  const upstreamPath = own ? recovery + "/" + leaf : path;
  const sha = own ? revision : snapshot;
  const result = await fetcher(rawRoot + sha + "/" + upstreamPath, {
    method: request.method, redirect: "manual", signal: AbortSignal.timeout(10000),
  });
  if (!result.ok) {
    await result.body?.cancel();
    return new Response("Pinned public source unavailable", { status: 502 });
  }
  const type = path.endsWith(".mjs") ? "text/javascript" :
    path.endsWith(".json") ? "application/json" : "text/html";
  return new Response(request.method === "HEAD" ? null : result.body, {
    headers: {
      "content-type": type + "; charset=utf-8", "x-content-type-options": "nosniff",
      "cache-control": "public, max-age=3600",
      "content-security-policy": "default-src 'none'; script-src 'self'; style-src 'unsafe-inline'; connect-src 'self'; base-uri 'none'; frame-ancestors 'none'",
      "referrer-policy": "no-referrer",
    },
  });
}

export default { fetch(request, env) { return handle(request, env.RECOVERY_COMMIT, fetch, env.FIELD_SCENARIOS); } };
