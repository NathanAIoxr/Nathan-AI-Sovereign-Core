import { languageTarget, namespace, owner, platforms } from "./platforms.mjs";
import { escape, json, page } from "./view.mjs";
import { isShardId, shardCount, shardId } from "./shard-routes.mjs";

const routes = new Map(platforms.map((platform) => [platform.id, platform]));

function home() {
  return page("Nathan Tabor Hyper Supercomputer Federation", `
<h1>Nathan Tabor Hyper Supercomputer Federation</h1>
<p>One federation of independently deployed platforms. Each platform keeps its own data and release, and connects to the rest through its published routes.</p>
<p><a href="/api/platforms">Platform directory API</a> · <a href="/p/languages/catalog">Explore languages</a> · <a href="/api/shards">Language shard directory</a></p>
<div class="grid">${platforms.map(({ title, route, purpose }) => `<article><h2><a href="${route}">${escape(title)}</a></h2><p>${escape(purpose)}</p></article>`).join("")}</div>`);
}

export default {
  async fetch(request, env) {
    if (request.method !== "GET") return json({ error: "Method not allowed" }, 405);
    const url = new URL(request.url);
    if (url.pathname === "/") return home();
    if (url.pathname === "/api/platforms") return json({ owner, namespace, languageTarget, platforms });
    if (url.pathname === "/health") return json({
      status: "ok", owner, namespace, registered: platforms.length,
      languageShards: shardCount, configuredSlots: platforms.length + shardCount
    });
    if (url.pathname === "/api/shards") {
      const start = Number(url.searchParams.get("start") || "1");
      if (!Number.isSafeInteger(start) || start < 1 || start > shardCount) return json({ error: "Invalid shard start" }, 400);
      const size = Math.min(50, shardCount - start + 1);
      const shards = Array.from({ length: size }, (_, index) => {
        const id = shardId(start + index);
        return { id, route: "/p/" + id + "/" };
      });
      return json({ owner, total: shardCount, shards, nextStart: start + size <= shardCount ? start + size : null });
    }
    const route = /^\/p\/([a-z0-9-]+)(\/.*)?$/.exec(url.pathname);
    const id = route?.[1];
    const platform = routes.get(id) ?? (id && isShardId(id) ? { id, limits: { cpuMs: 20, subRequests: 1 } } : null);
    if (!platform) return json({ error: "Platform not found" }, 404);
    try {
      const worker = env.PLATFORMS.get(platform.id, {}, { limits: platform.limits });
      // Only forward the public, read-only URL. Browser credentials stay at the edge.
      return await worker.fetch(new Request(url.toString()));
    } catch {
      return json({ error: "Platform temporarily unavailable", platform: platform.id }, 503);
    }
  }
};
