import { verifyRows, sha256 } from "./merkle.js";

export const SNAPSHOT_KEY = "blueprint-integrity-snapshot-v7";
export const ALGORITHM = "TaborAcademy:answers-nfc-json-sha256+sorted-merkle:v1";

export async function makeSnapshot(rows) {
  if (!Array.isArray(rows) || !rows.length) throw new Error("Empty Academy snapshot");
  const seen = new Set();
  for (const row of rows) {
    if (!Number.isSafeInteger(row.id) || row.id < 1 || seen.has(row.id) || row.state !== 1 ||
        !Number.isSafeInteger(row.version) || row.version < 1 || Object.keys(row).length !== 19) {
      throw new Error("Invalid Academy snapshot row");
    }
    seen.add(row.id);
  }
  return { algorithm:ALGORITHM, rows:rows.length, merkle_root:await verifyRows(rows),
    verified_export_sha256:await sha256(JSON.stringify(rows)) };
}

export async function checkSnapshot(snapshot, expected = snapshot?.proof) {
  if (!snapshot || !expected) throw new Error("Missing Academy integrity receipt");
  const computed = await makeSnapshot(snapshot.rows);
  if (Object.keys(computed).some(key => expected[key] !== computed[key])) {
    throw new Error("Academy snapshot integrity mismatch");
  }
  return snapshot.rows;
}

export function lessonProjection({row_sha256,version,state,r2_diagram_key,...row}) {
  return { ...row, item_c_label:row.item_c_label === "N/A — Two-Item Pair" ? null : row.item_c_label };
}
