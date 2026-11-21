const MODEL = "@cf/baai/bge-base-en-v1.5";
const VISION = "@cf/qwen/qwen3.8-27b";
export const COLUMNS = ["id", "tier", "domain", "item_a_label", "item_b_label", "item_c_label",
  "clue_prompt", "core_parts", "operations", "traits_attributes", "scale_medium", "input_output",
  "flow_direction", "modification_exemption", "blind_spot_note"];
const TIERS = ["Tier 1: Kids", "Tier 2: Youth", "Tier 3: Adults"];
const DOMAINS = ["Biology", "Mechanics", "Physics", "Nature", "Energy"];

function string(value, size, required = true) {
  return typeof value === "string" && value.length <= size && !value.includes("\0") &&
    (!required || value.trim().length > 0);
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
  const topic = Object.hasOwn(gapTerms, query.toLowerCase().trim()) && gapTerms[query.toLowerCase().trim()];
  if (!topic) return;
  if (env.GAP_QUEUE) await env.GAP_QUEUE.send({ topic });
  else await saveGap(env, topic);
}

function saveGap(env, topic) {
  return env.DB.prepare(`INSERT INTO blueprint_curriculum_gaps (topic) VALUES (?)
    ON CONFLICT(topic) DO UPDATE SET topic_count=topic_count+1,updated_at=unixepoch()`).bind(topic).run();
}

export async function consumeGaps(batch, env) {
  for (const message of batch.messages) {
    const topic = message.body?.topic;
    if (!Object.values(gapTerms).includes(topic)) { message.ack(); continue; }
    try {
      await saveGap(env, topic);
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
      reasoning_effort: "low", max_completion_tokens: 400,
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

export async function auditPublishedRows(env, rows) {
  const columns = (await env.DB.prepare("PRAGMA table_info(blueprint_lessons)").all()).results;
  if (columns.map(column => column.name).join() !== COLUMNS.join()) throw new Error("D1 schema drift");
  const malformed = rows.filter(row => !validRow(row));
  for (const row of malformed.slice(0, 30)) {
    await env.DB.prepare(`INSERT INTO blueprint_audit (record_key,reason) VALUES (?,?)
      ON CONFLICT(record_key) DO UPDATE SET reason=excluded.reason,last_seen=unixepoch()`)
      .bind("lesson:" + row.id, "Schema mismatch").run();
  }
  if (malformed.length || !rows.length) throw new Error("D1 curriculum failed publication checks");
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
