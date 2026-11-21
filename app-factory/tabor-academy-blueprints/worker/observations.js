const json = (body, status = 200) => Response.json(body, {
  status, headers: { "Cache-Control": "no-store" },
});
const uuid = /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/;
const safe = (value, max) => typeof value === "string" && !/\p{Cc}/u.test(value) && value.length <= max;
const encoder = new TextEncoder();

async function sha(value) {
  const bytes = await crypto.subtle.digest("SHA-256", encoder.encode(value));
  return Array.from(new Uint8Array(bytes), v => v.toString(16).padStart(2, "0")).join("");
}

async function input(request) {
  if (request.headers.get("Sec-Fetch-Site") === "cross-site" ||
      !request.headers.get("Content-Type")?.startsWith("application/json")) return null;
  const reader = request.body?.getReader();
  if (!reader) return null;
  const parts = [];
  let length = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    length += value.byteLength;
    if (length > 490_000) { await reader.cancel(); return null; }
    parts.push(value);
  }
  try { return JSON.parse(await new Blob(parts).text()); } catch { return null; }
}

async function isReviewEditor(request, env) {
  const raw = request.headers.get("Authorization") ?? "";
  if (!env.EDITOR_KEY || env.EDITOR_KEY.length < 32 || raw.length > 266) return false;
  const [provided, actual] = await Promise.all([sha(raw), sha("Bearer " + env.EDITOR_KEY)]);
  let diff = 0;
  for (let i=0; i<actual.length; i++) diff |= actual.charCodeAt(i) ^ provided.charCodeAt(i);
  return diff === 0;
}

export async function sightings(request, env, url) {
  if (request.method === "GET") {
    const id = Number(url.searchParams.get("lesson"));
    if (!Number.isSafeInteger(id) || id < 1) return json({ error: "Select a lesson." }, 400);
    const rows = await env.DB.prepare(`SELECT object_name,note,created_at FROM blueprint_observations
      WHERE lesson_id=? AND status='published' ORDER BY created_at DESC,id LIMIT 75`).bind(id).all();
    return json(rows.results);
  }
  if (request.method !== "POST") return json({ error: "Use GET or POST." }, 405);
  const data = await input(request);
  if (!data || !uuid.test(data.id ?? "") || !safe(data.objectName,100) || !data.objectName.trim() ||
      !safe(data.note ?? "",800) || !(data.secondObject == null || safe(data.secondObject,100))) {
    return json({ error: "Enter valid object names and a short note." }, 400);
  }
  const name = data.objectName.trim(), second = data.secondObject?.trim() || null;
  const id = data.lessonId ?? null;
  if (id === null && !second) return json({ error: "Enter the second object." }, 400);
  if (id !== null && (!Number.isSafeInteger(id) ||
      !await env.DB.prepare("SELECT 1 FROM blueprint_lessons WHERE id=?").bind(id).first())) {
    return json({ error: "Unknown lesson." }, 404);
  }
  const note = data.note ?? "";
  const fingerprint = await sha(JSON.stringify([id,name,second,note,data.photo ?? null]));
  const existing = await env.DB.prepare("SELECT fingerprint,status FROM blueprint_observations WHERE id=?").bind(data.id).first();
  if (existing) return existing.fingerprint === fingerprint
    ? json({ id:data.id, status:existing.status })
    : json({ error: "This observation ID has already been used." }, 409);
  const allowed = await env.DB.prepare(`INSERT INTO blueprint_usage VALUES (date('now'),'field',1)
    ON CONFLICT(day,action) DO UPDATE SET count=count+1 WHERE count<150 RETURNING count`).first();
  if (!allowed) return json({ error: "Daily queue is full. Your device can retry." }, 429);
  let key = null;
  // A private review copy is kept apart from public diagrams.
  if (data.photo != null) {
    if (!env.VAULT || typeof data.photo !== "string" || data.photo.length > 480000) {
      return json({ error: "Photo upload unavailable. You can submit the observation without a photo." }, 415);
    }
    let bytes;
    try { bytes = Uint8Array.from(atob(data.photo), ch => ch.charCodeAt(0)); } catch {
      return json({ error: "Use a valid JPEG." }, 415);
    }
    if (bytes[0] !== 255 || bytes[1] !== 216 || bytes[2] !== 255) return json({ error: "Use a valid JPEG." }, 415);
    key = "observations/private/" + fingerprint + ".jpg";
    await env.VAULT.put(key, bytes, { httpMetadata: { contentType: "image/jpeg" } });
  }
  await env.DB.prepare(`INSERT OR IGNORE INTO blueprint_observations
    (id,fingerprint,lesson_id,object_name,second_object,note,photo_key) VALUES (?,?,?,?,?,?,?)`)
    .bind(data.id,fingerprint,id,name,second,note,key).run();
  const saved = await env.DB.prepare("SELECT fingerprint,status FROM blueprint_observations WHERE id=?").bind(data.id).first();
  return saved?.fingerprint === fingerprint ? json({id:data.id,status:saved.status},202)
    : json({error:"Observation ID collision."},409);
}

export async function reviewSighting(request, env) {
  if (request.method !== "POST" || !await isReviewEditor(request, env)) return json({ error: "Not found." },404);
  const data = await input(request);
  if (!uuid.test(data?.id ?? "") || typeof data.publish !== "boolean") return json({ error: "Choose a review result." },400);
  const state = data.publish ? "published" : "archived";
  // Text can be approved for the public lesson log. Photo keys stay internal.
  const write = await env.DB.prepare(`UPDATE blueprint_observations SET status=?
    WHERE id=? AND status='pending_verify' AND (?='archived' OR lesson_id IS NOT NULL)
    RETURNING id,status`).bind(state,data.id,state).first();
  return write ? json(write) : json({ error:"Pending observation not found." },404);
}
