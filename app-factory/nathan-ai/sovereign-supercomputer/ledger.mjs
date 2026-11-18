import { sha256 } from "./compute.mjs";

export const ZONES = ["HIVE_ABOVE", "ANTHILL_MIDDLE", "CATACOMB_BELOW"];
export const addressSpace = { families: 172, clover: 1382, supernodes: 732000000, omni: 126000000000 };
export const AXIOMS = ["1+1=2", "1-1=0"];
const from = ["Will", "Wheel", "Way"];
const formatter = new Intl.Segmenter("und", { granularity: "grapheme" });
const radix = value => value.toString(12).toUpperCase();
const reverse = text => Array.from(formatter.segment(text), part => part.segment).reverse().join("");
const firstLetters = text => text.trim().split(/\s+/u).filter(Boolean)
  .map(word => formatter.segment(word).containing(0).segment).join("");
const validText = text => typeof text === "string" && text.isWellFormed() && Boolean(text.trim()) && text.length <= 8192;

export async function words(text) {
  if (!validText(text)) throw new RangeError("Enter between 1 and 8192 characters of well-formed text.");
  const sha = await sha256(text);
  const seed = Number.parseInt(sha.slice(0, 12), 16);
  return {
    exact_preserved: text, reverse_mirror: reverse(text), first_letter_extraction: firstLetters(text),
    sha256: sha, family_id: seed % addressSpace.families + 1, clover_node: seed % addressSpace.clover + 1,
    supernode_address: seed % addressSpace.supernodes + 1, omni_address: seed % addressSpace.omni + 1,
    duodecimal_id: radix(seed),
  };
}

export function willWheelWay(will, way) {
  if (!from.includes(will) || !from.includes(way)) throw new RangeError("Choose Will, Wheel, or Way for both endpoints.");
  const path = will === way ? [will] : [will, way];
  return { route: path, reverse: [...path].reverse(), identity: will === way };
}

export function cicadas(year, years) {
  if (!Number.isInteger(year) || year < 1000 || year > 9999 || !Number.isInteger(years) || years < 1 || years > 500) {
    throw new RangeError("Use an anchor year from 1000 to 9999 and a span of 1 to 500 years.");
  }
  const events = [];
  for (let n = 0; n <= years; n += 1) {
    const cycles = [13, 17].filter(period => n % period === 0);
    if (cycles.length) events.push({ year: year + n, cycles });
  }
  return { anchor_year: year, recurrence_years: 221, cadence: ["STOMP", "STOMP", "CLAP", "REST"],
    frame: "Nathan Tabor’s Mother Earth and heartbeat composition",
    stations: ["Gut", "Heart", "Soul", "Spirit"], events };
}

export async function intake(db, body) {
  const { text, zone = ZONES[0], locale = "en-US", operation = AXIOMS[0], noise = false } = body;
  if (!ZONES.includes(zone) || typeof locale !== "string" || !/^[A-Za-z0-9-]{2,35}$/.test(locale) ||
      !AXIOMS.includes(operation) || typeof noise !== "boolean") throw new RangeError("Invalid intake fields.");
  if (noise || operation === AXIOMS[1]) return { status: "CLEARED", gate: 0, writes: 0 };
  const result = await words(text);
  const change = await db.prepare(`INSERT INTO axis_dual_bus
    (zone, locale, payload, family_id, clover_node, duodecimal_id, sha256_hash, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT (zone, locale, sha256_hash) DO NOTHING`)
    .bind(zone, locale, text, result.family_id, result.clover_node, result.duodecimal_id,
      result.sha256, new Date().toISOString()).run();
  const row = await db.prepare("SELECT id, direction FROM axis_dual_bus WHERE zone = ? AND locale = ? AND sha256_hash = ?")
    .bind(zone, locale, result.sha256).first();
  return { ...row, status: change.meta.changes ? "QUEUED" : "EXISTING", gate: 1, ...result };
}

export async function auditSnapshot(db) {
  const { results } = await db.prepare(`SELECT id, zone, family_id, clover_node, sha256_hash, payload
    FROM axis_dual_bus WHERE direction = 'FORWARD' ORDER BY id LIMIT 32`).all();
  if (!results.length) return { status: "IDLE_ZERO_WRITES", verified: 0, quarantined: 0 };
  const entries = await Promise.all(results.map(async ({ payload, ...row }) => {
    const observed_hash = await sha256(payload);
    return { ...row, observed_hash, match: observed_hash === row.sha256_hash };
  }));
  const manifest = JSON.stringify(entries);
  const root_hash = await sha256(manifest);
  const snapshot_id = crypto.randomUUID();
  const ids = entries.map(row => row.id);
  const placeholders = ids.map(() => "?").join(",");
  const now = new Date().toISOString();
  const create = db.prepare(`INSERT INTO database_snapshots
    (snapshot_id, row_count, root_hash, manifest, created_at)
    SELECT ?, ?, ?, ?, ? WHERE (SELECT count(*) FROM axis_dual_bus
      WHERE direction = 'FORWARD' AND id IN (${placeholders})) = ?`)
    .bind(snapshot_id, ids.length, root_hash, manifest, now, ...ids, ids.length);
  const apply = entries.map(row => db.prepare(`UPDATE axis_dual_bus SET direction = ?, updated_at = ?
    WHERE id = ? AND EXISTS (SELECT 1 FROM database_snapshots WHERE snapshot_id = ?)`)
    .bind(row.match ? "MIRROR_VERIFIED" : "QUARANTINED", now, row.id, snapshot_id));
  const [claimed] = await db.batch([create, ...apply]);
  if (!claimed.meta.changes) return { status: "CONCURRENT_AUDIT", verified: 0, quarantined: 0 };
  const verified = entries.filter(row => row.match).length;
  return { status: "AUDITED", snapshot_id, root_hash, verified, quarantined: ids.length - verified };
}

export async function archiveSnapshot(db, bucket, id) {
  if (!bucket) return { status: "R2_UNAVAILABLE" };
  const snapshot = await db.prepare("SELECT * FROM database_snapshots WHERE snapshot_id = ?").bind(id).first();
  if (!snapshot) return { status: "SNAPSHOT_UNKNOWN" };
  if (await sha256(snapshot.manifest) !== snapshot.root_hash) throw new Error("Snapshot integrity check failed");
  const r2_key = `snapshots/${id}.json`;
  await bucket.put(r2_key, JSON.stringify({ ...snapshot, r2_key }), { httpMetadata: { contentType: "application/json" } });
  await db.prepare("UPDATE database_snapshots SET r2_key = ? WHERE snapshot_id = ?").bind(r2_key, id).run();
  return { status: "ARCHIVED", r2_key };
}

export async function catalog(db) {
  const [families, clover, apps, council, supernodes] = await db.batch([
    db.prepare("SELECT * FROM worker_families ORDER BY family_id"),
    db.prepare("SELECT count(*) as nodes FROM clover_matrix"),
    db.prepare("SELECT * FROM factory_101_apps ORDER BY app_id"),
    db.prepare("SELECT * FROM council_archetypes ORDER BY archetype_id"),
    db.prepare("SELECT count(*) as nodes FROM supernode_registry"),
  ]);
  return {
    families: families.results, clover_nodes: clover.results[0].nodes,
    apps: apps.results, council: council.results, registered_logical_nodes: supernodes.results[0].nodes,
    registry_capacity: addressSpace, app_slots: 101,
  };
}

export async function claimSupernode(db, recordId) {
  if (!Number.isSafeInteger(recordId) || recordId < 1) throw new RangeError("Provide a valid record ID.");
  const row = await db.prepare(`SELECT id, sha256_hash, clover_node, family_id FROM axis_dual_bus
    WHERE id = ? AND direction = 'MIRROR_VERIFIED'`).bind(recordId).first();
  if (!row) return { status: "VERIFIED_RECORD_REQUIRED" };
  const address = Number.parseInt(row.sha256_hash.slice(0, 12), 16) % addressSpace.supernodes + 1;
  await db.prepare("INSERT OR IGNORE INTO supernode_registry VALUES (?, ?, ?, ?, ?, ?)")
    .bind(address, row.id, row.clover_node, row.family_id, radix(address), row.sha256_hash).run();
  const result = await db.prepare("SELECT * FROM supernode_registry WHERE source_record = ?").bind(recordId).first();
  return result ? { status: "REGISTERED", ...result } : { status: "ADDRESS_COLLISION" };
}
