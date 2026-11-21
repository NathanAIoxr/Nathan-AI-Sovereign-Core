import { checkSnapshot, makeSnapshot, SNAPSHOT_KEY } from "../shared/snapshot.js";

export async function currentSnapshot(db) {
  const sql = "SELECT * FROM blueprint_lessons_v7 WHERE state=1 ORDER BY id";
  const { results:rows } = await db.prepare(sql).all();
  const expected = await db.prepare(`SELECT count(*) AS n FROM blueprint_lessons b
    LEFT JOIN blueprint_lifecycle l ON l.lesson_id=b.id
    LEFT JOIN blueprint_integrity i ON i.lesson_id=b.id
    WHERE COALESCE(l.state,'verified')='verified' AND COALESCE(i.state, 1)=1`).first();
  if (rows.length !== expected.n) throw new Error("Blueprint integrity coverage is incomplete.");
  return { proof:await makeSnapshot(rows), rows };
}

export const snapshotObject = proof => "exports/v7/" + proof.verified_export_sha256 + ".json";

export async function readSnapshot(cache) {
  const snapshot = await cache?.get(SNAPSHOT_KEY,"json");
  await checkSnapshot(snapshot);
  return snapshot;
}

export async function publishSnapshot(env, snapshot) {
  await checkSnapshot(snapshot);
  const text = JSON.stringify(snapshot);
  const key = snapshotObject(snapshot.proof);
  await env.VAULT.put(key, text, { httpMetadata:{contentType:"application/json"} });
  await env.CACHE.put(SNAPSHOT_KEY,text);
  return key;
}
