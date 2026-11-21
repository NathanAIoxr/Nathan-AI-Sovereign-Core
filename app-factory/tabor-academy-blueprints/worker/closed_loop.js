import { rankedLessons } from "../public/explorers.js";

const MODEL = "@cf/baai/bge-base-en-v1.5";
const VISION = "@cf/qwen/qwen3.8-27b";
const SNAPSHOT = "tabor-academy:published-snapshot";
const idPattern = /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
export const COLUMNS = ["id", "tier", "domain", "item_a_label", "item_b_label", "item_c_label",
  "clue_prompt", "core_parts", "operations", "traits_attributes", "scale_medium", "input_output",
  "flow_direction", "modification_exemption", "blind_spot_note"];
const TIERS = ["Tier 1: Kids", "Tier 2: Youth", "Tier 3: Adults"];
const DOMAINS = ["Biology", "Mechanics", "Physics", "Nature", "Energy"];
const response = (data, status = 200) => Response.json(data, { status, headers: { "Cache-Control": "no-store" } });

function string(value, size, required = true) {
  return typeof value === "string" && value.length <= size && !value.includes("\0") &&
    (!required || value.trim().length > 0);
}

async function fingerprint(entry) {
  const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(JSON.stringify(entry)));
  return Array.from(new Uint8Array(bytes), byte => byte.toString(16).padStart(2, "0")).join("");
}

export async function editorAllowed(request, env) {
  const value = request.headers.get("Authorization")?.match(/^Bearer (.+)$/)?.[1];
  if (!string(value, 256) || !string(env.EDITOR_KEY, 256)) return false;
  const [actual, expected] = await Promise.all([fingerprint(value), fingerprint(env.EDITOR_KEY)]);
  let difference = 0;
  for (let index = 0; index < actual.length; index++) difference |= actual.charCodeAt(index) ^ expected.charCodeAt(index);
  return difference === 0;
}

export async function reviewSighting(request, env) {
  if (!await editorAllowed(request, env)) return response({ error: "Editor authorization required." }, 401);
  if (request.method === "GET") {
    const { results } = await env.DB.prepare(`SELECT id,lesson_id,object_name,second_object,note,
      photo_key IS NOT NULL AS has_photo,vision_suggestion FROM blueprint_observations
      WHERE status='pending_verify' ORDER BY created_at LIMIT 25`).all();
    return response(results);
  }
  if (request.method !== "POST") return response({ error: "Use GET or POST." }, 405);
  const { id, decision, publishPhoto } = await request.json().catch(() => ({}));
  if (!idPattern.test(id ?? "") || !["published", "archived"].includes(decision)) {
    return response({ error: "Invalid review decision." }, 400);
  }
  const decisionPhoto = decision === "published" && publishPhoto === true ? 1 : 0;
  const update = await env.DB.prepare(`UPDATE blueprint_observations
    SET status=?,photo_public=? WHERE id=? AND (status='pending_verify' OR (?='archived' AND status='published'))
    AND (?!='published' OR lesson_id IS NOT NULL)`).bind(decision, decisionPhoto, id, decision, decision).run();
  if (!update.meta.changes) return response({ error: "No field sighting matches the review request." }, 404);
  return response({ id, status: decision });
}

async function intake(request, env) {
  if (request.headers.get("Sec-Fetch-Site") === "cross-site") return response({ error: "Use this site." }, 403);
  if (!request.headers.get("Content-Type")?.startsWith("application/json")) return response({ error: "Use JSON." }, 415);
  const reader = request.body?.getReader();
  if (!reader) return response({ error: "Supply an observation." }, 400);
  let size = 0;
  const decoder = new TextDecoder();
  let input = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > 500_000) {
      await reader.cancel();
      return response({ error: "Observation exceeds the size limit." }, 413);
    }
    input += decoder.decode(value, { stream: true });
  }
  let data;
  try { data = JSON.parse(input + decoder.decode()); } catch { return response({ error: "Invalid JSON." }, 400); }

  const { id, lessonId, objectName, secondObject, note, photo } = data ?? {};
  if (!idPattern.test(id ?? "") || !string(objectName, 100) || !string(note, 800, false) ||
    (lessonId === null ? !string(secondObject, 100) : !Number.isSafeInteger(lessonId) || lessonId <= 0)) {
    return response({ error: "Supply a valid field observation." }, 400);
  }
  if (lessonId !== null && !await env.DB.prepare("SELECT id FROM blueprint_lessons WHERE id=?").bind(lessonId).first()) {
    return response({ error: "This field card is unavailable." }, 404);
  }
  let photoBytes = null;
  if (photo !== null && photo !== undefined) {
    if (!env.VAULT) return response({ error: "Photo storage is temporarily unavailable." }, 503);
    if (!string(photo, 480_000) || !/^[A-Za-z0-9+/]+={0,2}$/.test(photo)) return response({ error: "Invalid JPEG." }, 415);
    try { photoBytes = Uint8Array.from(atob(photo), byte => byte.charCodeAt(0)); } catch {
      return response({ error: "Invalid JPEG." }, 415);
    }
    if (photoBytes[0] !== 255 || photoBytes[1] !== 216 || photoBytes.at(-2) !== 255 || photoBytes.at(-1) !== 217) {
      return response({ error: "Invalid JPEG." }, 415);
    }
  }
  const normalized = [lessonId, objectName.trim(), lessonId === null ? secondObject.trim() : null, note.trim(), photo ?? null];
  const hash = await fingerprint(normalized);
  const insert = await env.DB.prepare(`INSERT OR IGNORE INTO blueprint_observations
    (id,fingerprint,lesson_id,object_name,second_object,note) VALUES (?,?,?,?,?,?)`)
    .bind(id, hash, ...normalized.slice(0, 4)).run();
  if (!insert.meta.changes) {
    const saved = await env.DB.prepare("SELECT fingerprint,photo_key FROM blueprint_observations WHERE id=?").bind(id).first();
    if (saved?.fingerprint !== hash) return response({ error: "This submission ID is already in use." }, 409);
    if (!photoBytes || saved.photo_key) return response({ id, status: "received" });
  }
  if (photoBytes) {
    const key = `field-pending/${id}.jpg`;
    await env.VAULT.put(key, photoBytes, { httpMetadata: { contentType: "image/jpeg" } });
    await env.DB.prepare("UPDATE blueprint_observations SET photo_key=? WHERE id=?").bind(key, id).run();
  }
  return response({ id, status: "pending_verify" }, 202);
}

export async function sightings(request, env, params) {
  if (request.method === "POST") return intake(request, env);
  if (request.method !== "GET") return response({ error: "Use GET or POST." }, 405);
  const id = Number(params.get("lesson"));
  if (!Number.isSafeInteger(id) || id <= 0) return response({ error: "Choose a field card." }, 400);
  const { results } = await env.DB.prepare(`SELECT id,object_name,note,CASE WHEN photo_public=1 THEN photo_key END AS photo_key FROM blueprint_observations
    WHERE lesson_id=? AND status='published' ORDER BY created_at DESC LIMIT 30`).bind(id).all();
  return response(results.map(({ id: observationId, object_name, note, photo_key }) =>
    ({ object_name, note, photoUrl: photo_key ? `/api/sighting-photo/${observationId}` : null })));
}

export async function sightingPhoto(env, id) {
  if (!env.VAULT || !idPattern.test(id)) return response({ error: "Photo unavailable." }, 404);
  const row = await env.DB.prepare("SELECT photo_key FROM blueprint_observations WHERE id=? AND status='published' AND photo_public=1").bind(id).first();
  const photo = row?.photo_key && await env.VAULT.get(row.photo_key);
  return photo ? new Response(photo.body, { headers: { "Content-Type": "image/jpeg", "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff" } }) : response({ error: "Photo unavailable." }, 404);
}

export function mechanismText(row) {
  return [row.core_parts, row.operations, row.modification_exemption].join(". ").slice(0, 1500);
}

export async function deduplicate(env, draftId, draft) {
  if (!env.VECTORIZE || !env.AI) return null;
  const { data } = await env.AI.run(MODEL, { text: [mechanismText(draft)] });
  const { matches } = await env.VECTORIZE.query(data[0], { topK: 3, namespace: "mechanisms" });
  const match = matches.find(candidate => candidate.score > 0.94);
  if (!match) return null;
  const id = Number(match.id.replace(/^m-/, ""));
  if (!Number.isSafeInteger(id)) return null;
  const row = await env.DB.prepare("SELECT id FROM blueprint_lessons WHERE id=?").bind(id).first();
  if (!row) return null;
  await env.DB.prepare(`INSERT OR IGNORE INTO blueprint_alias_candidates
    (draft_id,candidate_label,matched_lesson,similarity) VALUES (?,?,?,?)`)
    .bind(draftId, `${draft.item_a_label} / ${draft.item_b_label}`, id, match.score).run();
  return { lessonId: id, similarity: match.score };
}

const gapTerms = {
  hydrodynamics: "fluid movement",
  capillarity: "fluid movement",
  buoyancy: "fluid movement",
  hinge: "hinges",
  ratchet: "hinges",
  leverage: "levers",
  torque: "levers",
  resonance: "waves",
  impedance: "waves",
};

export async function recordGap(env, query) {
  if (!env.GAP_QUEUE) return;
  const topic = Object.hasOwn(gapTerms, query.toLowerCase().trim()) && gapTerms[query.toLowerCase().trim()];
  if (topic) await env.GAP_QUEUE.send({ topic });
}

export async function consumeGaps(batch, env) {
  for (const message of batch.messages) {
    const topic = message.body?.topic;
    if (!Object.values(gapTerms).includes(topic)) { message.ack(); continue; }
    try {
      await env.DB.prepare(`INSERT INTO blueprint_curriculum_gaps (topic) VALUES (?)
        ON CONFLICT(topic) DO UPDATE SET topic_count=topic_count+1,updated_at=unixepoch()`).bind(topic).run();
      message.ack();
    } catch {
      message.retry();
    }
  }
}

export async function reviewPhotos(env) {
  if (env.VISION_ENABLED !== "true" || !env.VAULT || !env.AI) return;
  const { results } = await env.DB.prepare(`SELECT obs.id,obs.photo_key,lesson.core_parts,lesson.operations
    FROM blueprint_observations obs JOIN blueprint_lessons lesson ON lesson.id=obs.lesson_id
    WHERE obs.status='pending_verify' AND obs.photo_key IS NOT NULL AND obs.vision_suggestion IS NULL
    ORDER BY obs.created_at LIMIT 3`).all();
  for (const row of results) {
    const photo = await env.VAULT.get(row.photo_key);
    if (!photo) continue;
    const bytes = new Uint8Array(await photo.arrayBuffer());
    let binary = "";
    for (let start = 0; start < bytes.length; start += 4096) binary += String.fromCharCode(...bytes.subarray(start, start + 4096));
    const result = await env.AI.run(VISION, {
      messages: [{ role: "user", content: [
        { type: "text", text: "For editorial review, describe visible object parts that support or contradict the mechanism. Do not identify people or infer forces or motion that cannot be seen. If there is not enough evidence, say so. Mechanism: " +
          JSON.stringify({ parts: row.core_parts, movement: row.operations }) },
        { type: "image_url", image_url: { url: "data:image/jpeg;base64," + btoa(binary) } },
      ] }],
      reasoning_effort: "low", max_tokens: 300,
    });
    const note = result.response ?? result.choices?.[0]?.message?.content;
    if (string(note, 4000)) await env.DB.prepare("UPDATE blueprint_observations SET vision_suggestion=? WHERE id=?")
      .bind(note, row.id).run();
  }
}

function validRow(row) {
  return row && Object.keys(row).length === COLUMNS.length && COLUMNS.every(key => Object.hasOwn(row, key)) &&
    Number.isSafeInteger(row.id) && row.id > 0 && TIERS.includes(row.tier) && DOMAINS.includes(row.domain) &&
    COLUMNS.slice(3).every(key => key === "item_c_label" && row[key] === null || string(row[key], 20_000));
}

export async function refreshSnapshot(env) {
  const columns = (await env.DB.prepare("PRAGMA table_info(blueprint_lessons)").all()).results;
  if (columns.map(column => column.name).join() !== COLUMNS.join()) throw new Error("D1 schema drift");
  const { results } = await env.DB.prepare("SELECT * FROM blueprint_lessons ORDER BY id").all();
  const malformed = results.filter(row => !validRow(row));
  if (malformed.length) {
    for (const row of malformed.slice(0, 30)) {
      await env.DB.prepare(`INSERT INTO blueprint_audit (record_key,reason) VALUES (?,?)
        ON CONFLICT(record_key) DO UPDATE SET reason=excluded.reason,last_seen=unixepoch()`)
        .bind("lesson:" + row.id, "Schema mismatch").run();
    }
    throw new Error("D1 contains malformed lessons");
  }
  if (!results.length) throw new Error("D1 curriculum is empty");
  if (env.CACHE) await env.CACHE.put(SNAPSHOT, JSON.stringify(results));
  return results.length;
}

export async function snapshotLessons(env, params) {
  const rows = await env.CACHE?.get(SNAPSHOT, "json");
  if (!Array.isArray(rows) || !rows.length) return null;
  const tier = params.get("tier");
  const query = params.get("q")?.trim();
  if ((tier !== null && !TIERS.includes(tier)) || (query?.length ?? 0) > 160) return null;
  const view = tier ? rows.filter(row => row.tier === tier) : rows;
  return Response.json(query ? rankedLessons(view, query) : view, { headers: { "Cache-Control": "no-store",
    "X-Curriculum-Source": "kv-snapshot", ...(query ? { "X-Search-Method": "keyword" } : {}) } });
}

export async function canary(env) {
  const origin = env.PUBLIC_ORIGIN || "https://tabor-academy-blueprints.pages.dev";
  const cases = [
    ["curriculum", "/api/lessons", async result => Array.isArray(await result.json()) && !result.headers.has("X-Curriculum-Source")],
    ["semantic", "/api/lessons?q=electric%20motor%20and%20generator", async result => result.headers.get("X-Search-Method") === "hybrid"],
    ["media", "/api/diagram/19", async result => result.headers.get("Content-Type") === "image/png"],
  ];
  const failures = [];
  for (const [name, path, check] of cases) {
    const start = Date.now();
    try {
      const result = await fetch(origin + path, { signal: AbortSignal.timeout(10_000) });
      if (!result.ok || !await check(result) || Date.now() - start > 8000) failures.push(name + ":" + result.status);
    } catch {
      failures.push(name + ":unavailable");
    }
  }
  if (!failures.length) return;
  await env.DB.prepare(`INSERT INTO blueprint_audit (record_key,reason) VALUES ('canary',?)
    ON CONFLICT(record_key) DO UPDATE SET reason=excluded.reason,last_seen=unixepoch()`).bind(failures.join(", ")).run();
  throw new Error(failures.join(", "));
}
