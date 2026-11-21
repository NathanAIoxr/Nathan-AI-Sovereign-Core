import pages, { embedText, embeddingModel } from "./index.js";
import { compare, consume, queueScheduled } from "./drafting.js";
export { ClassroomRoom } from "./rooms.js";

async function indexPublished(env) {
  const cursor = Number(await env.CACHE.get("published-index-cursor")) || 0;
  const { results } = await env.DB.prepare("SELECT * FROM blueprint_lessons WHERE id > ? ORDER BY id LIMIT 10").bind(cursor).all();
  if (!results.length) {
    if (cursor) await env.CACHE.delete("published-index-cursor");
    return;
  }
  const { data } = await env.AI.run(embeddingModel, { text: results.map(embedText) });
  await env.VECTORIZE.upsert(results.map((row, index) => ({
    id: String(row.id), values: data[index], metadata: { tier: row.tier, domain: row.domain },
  })));
  await env.CACHE.put("published-index-cursor", String(results.at(-1).id));
}

export default {
  fetch(request, env, ctx) {
    const path = new URL(request.url).pathname;
    if (path === "/api/compare") return env.GENERATION ? env.GENERATION.fetch(request) : compare(request, env);
    if (path === "/api/lessons" && env.SEARCH) return env.SEARCH.fetch(request);
    if (path.startsWith("/api/diagram/") && env.MEDIA) return env.MEDIA.fetch(request);
    return pages.fetch(request, env, ctx);
  },
  queue: consume,
  async scheduled(controller, env, ctx) {
    ctx.waitUntil(indexPublished(env));
    ctx.waitUntil(queueScheduled(env));
  },
};
