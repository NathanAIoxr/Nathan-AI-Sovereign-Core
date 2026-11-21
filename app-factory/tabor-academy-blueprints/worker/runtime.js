import pages, { embedText, embeddingModel } from "./index.js";
import { canary, consumeGaps, mechanismText, refreshSnapshot, reviewPhotos } from "./closed_loop.js";
import { compare, consume, queueScheduled } from "./drafting.js";
export { ClassroomRoom } from "./rooms.js";

async function indexPublished(env) {
  const cursor = Number(await env.CACHE.get("published-index-cursor")) || 0;
  const { results } = await env.DB.prepare("SELECT * FROM blueprint_lessons WHERE id > ? ORDER BY id LIMIT 10").bind(cursor).all();
  if (!results.length) {
    if (cursor) await env.CACHE.delete("published-index-cursor");
    return;
  }
  const { data } = await env.AI.run(embeddingModel, { text: [...results.map(embedText), ...results.map(mechanismText)] });
  await env.VECTORIZE.upsert(results.map((row, index) => ({
    id: String(row.id), values: data[index], metadata: { tier: row.tier, domain: row.domain },
  })));
  await env.VECTORIZE.upsert(results.map((row, index) => ({
    id: "m-" + row.id, namespace: "mechanisms", values: data[index + results.length],
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
  queue(batch, env) {
    return batch.queue === "tabor-academy-curriculum-gaps" ? consumeGaps(batch, env) : consume(batch, env);
  },
  async scheduled(controller, env, ctx) {
    if (controller.cron === "*/15 * * * *") ctx.waitUntil(canary(env));
    if (controller.cron === "0 3 * * *") {
      ctx.waitUntil(indexPublished(env));
      ctx.waitUntil(queueScheduled(env));
    }
    if (controller.cron === "0 4 * * *") {
      ctx.waitUntil(refreshSnapshot(env));
      ctx.waitUntil(reviewPhotos(env));
    }
  },
};
