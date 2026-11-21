export const answerKeys = Object.freeze([
  "core_parts", "operations", "traits_attributes", "scale_medium", "input_output",
  "flow_direction", "modification_exemption", "blind_spot_note",
]);
const hexHash = /^[0-9a-f]{64}$/;
const utf8 = new TextEncoder();

export async function sha256(value) {
  const bytes = await crypto.subtle.digest("SHA-256", utf8.encode(value));
  return Array.from(new Uint8Array(bytes), byte => byte.toString(16).padStart(2, "0")).join("");
}

export function canonicalAnswers(row) {
  return JSON.stringify(answerKeys.map(key => {
    if (typeof row?.[key] !== "string") throw new TypeError("Answer must be text: " + key);
    const value = row[key].normalize("NFC").replace(/\r\n?/g, "\n").trim();
    if (!value) throw new TypeError("Answer is empty: " + key);
    return value;
  }));
}

export const rowHash = async row => sha256(canonicalAnswers(row));

export async function merkleRoot(hashes) {
  let level = [...hashes].sort();
  if (level.some(hash => !hexHash.test(hash))) throw new TypeError("Invalid row hash");
  if (!level.length) return sha256("TaborAcademy:empty:v1");
  while (level.length > 1) {
    const parents = [];
    for (let i = 0; i < level.length; i += 2) {
      parents.push(sha256("TaborAcademy:node:v1:" + level[i] + (level[i+1] ?? level[i])));
    }
    level = await Promise.all(parents);
  }
  return level[0];
}

export async function verifyRows(rows) {
  const seen = new Set();
  const hashes = await Promise.all(rows.map(async row => [row.id, await rowHash(row), row.row_sha256]));
  for (const [id, actual, expected] of hashes) {
    if (actual !== expected || seen.has(actual)) throw new Error("Invalid or duplicate answer hash for row " + id);
    seen.add(actual);
  }
  return merkleRoot(seen);
}
