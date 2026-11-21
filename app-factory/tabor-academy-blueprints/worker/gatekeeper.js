import { COLUMNS, rowSha256, idempotencyKey, sha256 } from "../shared/merkle.js";

const tiers = new Set(["Tier 1: Kids", "Tier 2: Youth", "Tier 3: Adults"]);
const domains = new Set(["Biology", "Mechanics", "Physics", "Nature", "Energy"]);
const incomplete = /^(?:n\s*\/\s*a|tbd|unknown|not applicable)\.?$/iu;
const hedges = /\b(?:maybe|perhaps|it seems|sort of|might be|unknown|tbd)\b|(?:^|\s)n\s*\/\s*a(?=\s|\W|$)/iu;
const limits = { item_a_label: 100, item_b_label: 100, item_c_label: 100, clue_prompt: 500 };
const invalidCharacters = /[\p{Surrogate}\u0000-\u0008\u000b-\u001f\u007f]/u;

export function textPasses(value, max, generated = true) {
  return typeof value === "string" && value.length <= max && value.trim().length > 0 &&
    !invalidCharacters.test(value) &&
    (!generated || (!incomplete.test(value.trim()) && !hedges.test(value)));
}

export function gatekeeper(row, { generated = true } = {}) {
  if (!row || typeof row !== "object" || Array.isArray(row) ||
    Object.keys(row).length !== COLUMNS.length || !COLUMNS.every(key => Object.hasOwn(row, key)) ||
    !Number.isSafeInteger(row.id) || row.id <= 0 || !tiers.has(row.tier) || !domains.has(row.domain)) return 0;
  return Number(COLUMNS.slice(3).every(key =>
    (key === "item_c_label" && row[key] === null) || textPasses(row[key], limits[key] ?? 1200, generated)));
}

export async function matchesWriteKey(request, operation, payload, { legacy = false } = {}) {
  const supplied = request.headers.get("Idempotency-Key");
  if (supplied === null) return legacy;
  return supplied === await idempotencyKey(operation, "tabor-academy", payload);
}

export async function isEditor(request, env) {
  const provided = request.headers.get("Authorization") ?? "";
  if (!env.EDITOR_KEY || env.EDITOR_KEY.length < 32 || provided.length > 266) return false;
  const [actual, expected] = await Promise.all([sha256(provided), sha256("Bearer " + env.EDITOR_KEY)]);
  let difference = 0;
  for (let i = 0; i < actual.length; i++) difference |= actual.charCodeAt(i) ^ expected.charCodeAt(i);
  return difference === 0;
}

export async function verifyStoredRow(row, projected) {
  return gatekeeper(projected, { generated: false }) === 1 &&
    Number.isSafeInteger(row.version_int) && row.version_int >= 1 &&
    row.row_sha256 === await rowSha256(projected);
}

// SQLite serializes the transaction. An insert trigger reserves capacity only
// for the INSERT that wins, so retries also leave the daily counter unchanged.
export async function commitObservation(db, values) {
  const insert = db.prepare(`INSERT INTO blueprint_observations
    (id,fingerprint,lesson_id,object_name,second_object,note,photo_key) VALUES (?,?,?,?,?,?,?)
    ON CONFLICT(id) DO NOTHING`).bind(...values);
  const find = db.prepare("SELECT fingerprint,status FROM blueprint_observations WHERE id=?").bind(values[0]);
  const [write, read] = await db.batch([insert, find]);
  return { created: write.meta.changes === 1, row: read.results[0] ?? null };
}

export async function transitionBlueprint(db, { id, version, state, key }) {
  const allowed = "EXISTS (SELECT 1 FROM blueprint_lessons WHERE id=? AND version_int=?)";
  const [, , , receipt] = await db.batch([
    db.prepare(`INSERT INTO blueprint_write_receipts (key,lesson_id,version_int,state)
      SELECT ?,?,?+1,? WHERE ${allowed}
      AND COALESCE((SELECT state FROM blueprint_lifecycle WHERE lesson_id=?),'verified') != ?
      ON CONFLICT(key) DO NOTHING`).bind(key,id,version,state,id,version,id,state),
    db.prepare(`UPDATE blueprint_lessons SET version_int=version_int+1 WHERE id=? AND version_int=? AND changes()=1`).bind(id,version),
    db.prepare(`INSERT INTO blueprint_lifecycle (lesson_id,state,origin,verified_at)
      SELECT ?,?,'editor',CASE WHEN ?='verified' THEN unixepoch() END WHERE changes()=1
      ON CONFLICT(lesson_id) DO UPDATE SET state=excluded.state,origin=excluded.origin,
        verified_at=excluded.verified_at`).bind(id,state,state),
    db.prepare("SELECT lesson_id AS id,version_int,state FROM blueprint_write_receipts WHERE key=?").bind(key),
  ]);
  return receipt.results[0] ?? null;
}

export async function purgeBlueprint(db, { id, version, key }) {
  const [, , , receipt] = await db.batch([
    db.prepare(`INSERT INTO blueprint_write_receipts (key,lesson_id,version_int,state)
      SELECT ?,?,?+1,'purged' WHERE EXISTS (
        SELECT 1 FROM blueprint_lessons b JOIN blueprint_lifecycle s ON s.lesson_id=b.id
        WHERE b.id=? AND b.version_int=? AND s.state='quarantined')
      ON CONFLICT(key) DO NOTHING`).bind(key,id,version,id,version),
    db.prepare("DELETE FROM blueprint_lifecycle WHERE lesson_id=? AND changes()=1").bind(id),
    db.prepare("DELETE FROM blueprint_lessons WHERE id=? AND version_int=? AND changes()=1").bind(id,version),
    db.prepare("SELECT lesson_id AS id,version_int,state FROM blueprint_write_receipts WHERE key=?").bind(key),
  ]);
  return receipt.results[0] ?? null;
}
