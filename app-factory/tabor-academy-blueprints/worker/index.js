import { rankedLessons } from "../public/explorers.js";
import { recordGap } from "./closed_loop.js";
import { curriculumProof, readVerified, setBlueprintState } from "./integrity.js";
import { classroom } from "./rooms.js";
import { reviewSighting, sightings } from "./observations.js";

export const tiers = new Set(["Tier 1: Kids", "Tier 2: Youth", "Tier 3: Adults"]);
export const domains = new Set(["Biology", "Mechanics", "Physics", "Nature", "Energy"]);
export const embeddingModel = "@cf/baai/bge-base-en-v1.5";

export function embedText(row) {
  return Object.entries(row).filter(([name, value]) => name !== "id" && value)
    .map(([, value]) => value).join(". ").slice(0, 1750);
}

function error(message, status, headers) {
  return Response.json({ error: message }, { status, headers });
}

export function track(env, type, detail = "-") {
  env.ANALYTICS?.writeDataPoint({ indexes: [type], blobs: [detail] });
}

async function lessons(env, params, ctx) {
  const tier = params.get("tier");
  const query = params.get("q")?.trim();
  if (tier !== null && !tiers.has(tier)) {
    return Response.json({ error: "Choose a valid tier.", tiers: [...tiers] }, { status: 400 });
  }
  if (query?.length > 160) return error("Use a search of up to 160 characters.", 400);
  const results = await readVerified(env.DB, tier);
  if (!query) return Response.json(results, { headers: { "Cache-Control": "no-store" } });

  let rows = rankedLessons(results, query);
  try {
    const { results: aliases } = await env.DB.prepare("SELECT lesson_id FROM blueprint_aliases WHERE lower(label)=lower(?) LIMIT 12")
      .bind(query).all();
    const byId = new Map(results.map(row => [row.id, row]));
    rows = [...new Set([...aliases.map(row => byId.get(row.lesson_id)).filter(Boolean), ...rows])].slice(0, 12);
  } catch {
    // Keep snapshot search usable when D1 is unavailable.
  }
  let method = "keyword";
  if (env.AI && env.VECTORIZE) {
    try {
      const { data } = await env.AI.run(embeddingModel, { text: [query] });
      const found = await env.VECTORIZE.query(data[0], { topK: 20 });
      const byId = new Map(results.map(row => [String(row.id), row]));
      const semantic = found.matches.filter(match => match.score >= 0.55)
        .map(match => byId.get(match.id.replace(/^blueprint-/, ""))).filter(Boolean);
      if (semantic.length) {
        rows = [...new Set([...semantic, ...rows])].slice(0, 12);
        method = "hybrid";
      }
    } catch (failure) {
      console.warn("Semantic search fell back to keywords", String(failure));
    }
  }
  if (!rows.length) {
    track(env, "search_zero");
    ctx?.waitUntil(recordGap(env, query).catch(failure => console.warn("Curriculum gap could not be stored", String(failure))));
  }
  return Response.json(rows, { headers: { "Cache-Control": "no-store", "X-Search-Method": method } });
}

async function telemetry(request, env) {
  const body = await request.json().catch(() => null);
  const fields = { mode: ["instant", "investigative"], mystery: ["opened"], print: ["printed"] };
  if (body?.type === "lesson" && Number.isSafeInteger(body.lessonId) && body.lessonId > 0) {
    const lesson = await env.DB.prepare("SELECT id FROM blueprint_lessons WHERE id = ?").bind(body.lessonId).first();
    if (lesson) track(env, "lesson", String(lesson.id));
  } else if (Object.hasOwn(fields, body?.type) && fields[body.type].includes(body.detail)) {
    track(env, body.type, body.detail);
  } else {
    return error("Unknown event.", 400);
  }
  return new Response(null, { status: 204 });
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const { pathname, searchParams } = url;
    const method = request.method;
    try {
      if (pathname === "/api/integrity") return await curriculumProof(request, env, searchParams);
      if (pathname === "/api/admin/blueprint-state") return await setBlueprintState(request, env);
      if (pathname === "/api/lessons") {
        if (method !== "GET") return error("Use GET.", 405, { Allow: "GET" });
        return await lessons(env, searchParams, ctx);
      }
      if (pathname === "/api/sightings" || pathname === "/api/propose") {
        if (pathname === "/api/propose" && method !== "POST") return error("Use POST.", 405, { Allow: "POST" });
        return await sightings(request, env, url);
      }
      if (pathname === "/api/admin/review-sighting") return await reviewSighting(request, env);
      if (pathname === "/api/healthz" && method === "GET") {
        const row = await env.DB.prepare("SELECT checked_at,healthy,detail FROM blueprint_health WHERE id=1").first();
        if (!row && env.ACADEMY_MAINTENANCE) await env.ACADEMY_MAINTENANCE.getByName("production").start();
        return Response.json({ service:"tabor-academy-blueprints", d1:true, canary:row ?? null },
          { headers: { "Cache-Control": "no-store" } });
      }
      if (pathname === "/api/classroom") {
        if (!["GET", "POST"].includes(method)) return error("Use GET or POST.", 405, { Allow: "GET, POST" });
        if (request.headers.get("Sec-Fetch-Site") === "cross-site") return error("Use this site.", 403);
        return await classroom(request, env);
      }
      if (pathname === "/api/events") {
        if (method !== "POST") return error("Use POST.", 405, { Allow: "POST" });
        if (request.headers.get("Sec-Fetch-Site") === "cross-site") return error("Use this site.", 403);
        return await telemetry(request, env);
      }
      if (pathname === "/api/compare") {
        if (method !== "POST") return error("Use POST.", 405, { Allow: "POST" });
        return env.GENERATION ? env.GENERATION.fetch(request) : error("The drafting service is unavailable.", 503);
      }
      if (pathname === "/api/diagrams" && method === "GET") {
        const rows = env.VAULT ? (await env.DB.prepare("SELECT m.lesson_id,m.alt_text FROM blueprint_media m LEFT JOIN blueprint_lifecycle s ON s.lesson_id=m.lesson_id WHERE COALESCE(s.state,'verified')='verified' ORDER BY m.lesson_id").all()).results : [];
        return Response.json(rows, { headers: { "Cache-Control": "public, max-age=60" } });
      }
      const media = pathname.match(/^\/api\/diagram\/(\d+)$/);
      if (media && method === "GET" && env.VAULT) {
        const id = Number(media[1]);
        if (!Number.isSafeInteger(id)) return error("Unknown diagram.", 404);
        const record = await env.DB.prepare("SELECT m.object_key FROM blueprint_media m LEFT JOIN blueprint_lifecycle s ON s.lesson_id=m.lesson_id WHERE m.lesson_id=? AND COALESCE(s.state,'verified')='verified'").bind(id).first();
        const image = record && await env.VAULT.get(record.object_key);
        if (!image) return error("Unknown diagram.", 404);
        return new Response(image.body, { headers: { "Content-Type": "image/png", "Cache-Control": "public, max-age=3600",
          "X-Content-Type-Options": "nosniff" } });
      }
      if (pathname === "/api" || pathname.startsWith("/api/")) return error("API route not found.", 404);
      if (env.ASSETS) return env.ASSETS.fetch(request);
      return new Response(null, { status: 404 });
    } catch (failure) {
      console.error("Blueprint request failed", { route: pathname, error: String(failure) });
      return error("The request could not be completed.", 503);
    }
  },
};
