const TTL = 2 * 60 * 60;
const codeFormat = /^[a-f0-9]{32}$/;

const now = () => Math.floor(Date.now() / 1000);
const json = (value, status = 200) => Response.json(value, {
  status, headers: { "Cache-Control": "no-store" },
});

async function roomKey(code) {
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(code));
  return Array.from(new Uint8Array(hash), value => value.toString(16).padStart(2, "0")).join("");
}

function publicState(row) {
  return { revision: row.revision, investigative: Boolean(row.investigative),
    lessonId: row.lesson_id, revealed: Boolean(row.revealed), expiresAt: row.expires_at };
}

async function hasLesson(db, id) {
  return (await db.prepare("SELECT 1 AS found FROM blueprint_lessons WHERE id = ?").bind(id).first()) !== null;
}

export async function classroom(request, env) {
  const code = request.headers.get("X-Room-Code");
  const creation = !code && request.method === "POST";
  if (!creation && !codeFormat.test(code ?? "")) return json({ error: "Enter a valid room code." }, 400);

  if (env.CLASSROOM) {
    const key = creation ? crypto.randomUUID().replace(/-/g, "") : code;
    const result = await env.CLASSROOM.getByName(await roomKey(key)).fetch(request);
    if (result.ok) return creation ? json({ ...(await result.json()), code: key }, 201) : result;
    // Pre-existing D1 room codes remain readable until their original expiration.
    if (creation || ![404,409].includes(result.status)) return result;
  }

  if (creation) {
    const key = crypto.randomUUID().replace(/-/g, "");
    const time = now();
    const [, created] = await env.DB.batch([
      env.DB.prepare(`DELETE FROM classroom_rooms WHERE room_hash IN (
        SELECT room_hash FROM classroom_rooms WHERE expires_at <= ? LIMIT 32)`).bind(time),
      env.DB.prepare(`INSERT INTO classroom_rooms (room_hash, expires_at)
        VALUES (?, ?) RETURNING *`).bind(await roomKey(key), time + TTL),
    ]);
    return json({ ...publicState(created.results[0]), code: key }, 201);
  }

  const hash = await roomKey(code);
  if (request.method === "GET") {
    const row = await env.DB.prepare("SELECT * FROM classroom_rooms WHERE room_hash = ? AND expires_at > ?")
      .bind(hash, now()).first();
    return row ? json(publicState(row)) : json({ error: "Room expired or unavailable." }, 404);
  }

  const next = await readState(request, env);
  if (!next) return json({ error: "Invalid room update." }, 400);
  const row = await env.DB.prepare(`UPDATE classroom_rooms SET revision = revision + 1,
    investigative = ?, lesson_id = ?, revealed = ? WHERE room_hash = ? AND revision = ? AND expires_at > ?
    RETURNING *`).bind(+next.investigative, next.lessonId, +next.revealed, hash, next.revision, now()).first();
  return row ? json(publicState(row)) : json({ error: "Room changed or expired. Reload its state." }, 409);
}

async function readState(request, env) {
  const body = await request.json().catch(() => null);
  if (!body || !Number.isSafeInteger(body.revision) || body.revision < 0 ||
    typeof body.investigative !== "boolean" || typeof body.revealed !== "boolean" ||
    (body.lessonId !== null && (!Number.isSafeInteger(body.lessonId) || !await hasLesson(env.DB, body.lessonId)))) {
    return null;
  }
  return { revision: body.revision, investigative: body.investigative,
    lessonId: body.lessonId, revealed: body.lessonId !== null && body.revealed };
}

// The standalone Worker supplies one SQLite-backed object for each room.
export class ClassroomRoom {
  constructor(ctx, env) {
    this.storage = ctx.storage;
    this.env = env;
    this.sql = ctx.storage.sql;
    this.sql.exec("CREATE TABLE IF NOT EXISTS state (id INTEGER PRIMARY KEY CHECK(id=1), data TEXT NOT NULL)");
  }

  async fetch(request) {
    const read = () => {
      const row = this.sql.exec("SELECT data FROM state WHERE id=1").toArray()[0];
      return row ? JSON.parse(row.data) : null;
    };
    if (!request.headers.has("X-Room-Code") && request.method === "POST") {
      const state = { revision: 0, investigative: true, lessonId: null, revealed: false, expiresAt: now() + TTL };
      await this.storage.setAlarm(state.expiresAt * 1000);
      this.sql.exec("INSERT OR IGNORE INTO state VALUES(1, ?)", JSON.stringify(state));
      return json(read(), 201);
    }
    if (request.method === "GET") {
      const state = read();
      return state?.expiresAt > now() ? json(state) : json({ error: "Room expired or unavailable." }, 404);
    }
    const next = await readState(request, this.env);
    if (!next) return json({ error: "Invalid room update." }, 400);
    const state = read();
    if (!state || state.expiresAt <= now() || state.revision !== next.revision) {
      return json({ error: "Room changed or expired. Reload its state." }, 409);
    }
    const updated = { ...next, revision: state.revision + 1, expiresAt: state.expiresAt };
    this.sql.exec("UPDATE state SET data = ? WHERE id=1", JSON.stringify(updated));
    return json(updated);
  }

  async alarm() {
    this.sql.exec("DELETE FROM state");
  }
}
