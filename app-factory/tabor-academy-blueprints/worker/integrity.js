import { branchFor, BRANCH_COUNT, COLUMNS, columnProjection, identifySnapshot,
  mechanicsRoot, HASH_PATTERN } from "../shared/merkle.js";
import { isEditor, matchesWriteKey, purgeBlueprint, transitionBlueprint, verifyStoredRow } from "./gatekeeper.js";

export async function readVerified(db, tier = null) {
  const sql = `SELECT ${COLUMNS.map(key => "b." + key).join(",")},
    b.row_sha256,b.version_int FROM blueprint_lessons b
    LEFT JOIN blueprint_lifecycle s ON s.lesson_id=b.id
    WHERE COALESCE(s.state,'verified')='verified'`;
  const statement = tier === null ? db.prepare(sql + " ORDER BY b.id")
    : db.prepare(sql + " AND b.tier=? ORDER BY b.id").bind(tier);
  const { results } = await statement.all();
  const rows = results.map(columnProjection);
  const checks = await Promise.all(results.map((row, i) => verifyStoredRow(row, rows[i])));
  const invalid = checks.indexOf(false);
  if (invalid !== -1) throw new Error(`Integrity check failed for lesson ${rows[invalid].id}`);
  return rows;
}

export async function curriculumProof(request, env, params) {
  if (request.method !== "GET") return Response.json({ error: "Use GET." }, { status: 405 });
  const rows = await readVerified(env.DB);
  const manifest = await identifySnapshot(rows);
  const tag = '"' + manifest.root + '"';
  const headers = { ETag: tag, "Cache-Control": "no-store" };
  if (!params.has("branches")) {
    if (request.headers.get("If-None-Match") === tag) return new Response(null, { status: 304, headers });
    return Response.json({ ...manifest, mechanicsRoot: await mechanicsRoot(rows) }, { headers });
  }
  const indices = params.get("branches").split(",");
  if (indices.length > BRANCH_COUNT || indices.some(value => !/^\d{1,2}$/.test(value) || Number(value) >= BRANCH_COUNT) ||
    !HASH_PATTERN.test(params.get("root") ?? "")) {
    return Response.json({ error: "Supply valid branches and root." }, { status: 400, headers });
  }
  if (params.get("root") !== manifest.root) {
    return Response.json({ error: "Curriculum changed during synchronization." }, { status: 409, headers });
  }
  const wanted = new Set(indices.map(Number));
  const branches = Object.fromEntries([...wanted].map(index => [index, []]));
  for (const row of rows) {
    const branch = branchFor(row.id);
    if (wanted.has(branch)) branches[branch].push(row);
  }
  return Response.json({ root: manifest.root, branches }, { headers });
}

export async function setBlueprintState(request, env) {
  const json = (data, status = 200) => Response.json(data, { status, headers: { "Cache-Control": "no-store" } });
  if (request.method !== "PUT" || !await isEditor(request, env)) return json({ error: "Not found." }, 404);
  const raw = await request.text();
  if (raw.length > 256) return json({ error: "Invalid transition." }, 400);
  let body;
  try { body = JSON.parse(raw); } catch { return json({ error: "Invalid transition." }, 400); }
  const { id, version, state } = body ?? {};
  if (!Number.isSafeInteger(id) || id < 1 || !Number.isSafeInteger(version) || version < 1 ||
    !["verified", "quarantined", "purged"].includes(state) ||
    !await matchesWriteKey(request, "blueprint-state", [id, version, state])) {
    return json({ error: "Valid version, state and idempotency key required." }, 400);
  }
  // Restoring also checks the current stored integrity at the exact version.
  if (state === "verified") {
    const row = await env.DB.prepare("SELECT * FROM blueprint_lessons WHERE id=? AND version_int=?").bind(id, version).first();
    const receipt = await env.DB.prepare(`SELECT lesson_id AS id,version_int,state FROM blueprint_write_receipts WHERE key=?`)
      .bind(request.headers.get("Idempotency-Key")).first();
    if (receipt) return json(receipt);
    if (!row || !await verifyStoredRow(row, columnProjection(row))) return json({ error: "Row failed restoration checks." }, 409);
  }
  const change = state === "purged" ? purgeBlueprint : transitionBlueprint;
  let receipt;
  try {
    receipt = await change(env.DB, { id, version, state, key: request.headers.get("Idempotency-Key") });
  } catch (failure) {
    if (state === "purged" && String(failure).includes("FOREIGN KEY")) return json({ error: "Lesson has dependent records." }, 409);
    throw failure;
  }
  return receipt ? json(receipt) : json({ error: "Lesson version or state changed." }, 409);
}
