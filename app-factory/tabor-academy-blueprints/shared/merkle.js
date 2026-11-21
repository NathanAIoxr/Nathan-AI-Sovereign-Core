export const COLUMNS = [
  "id", "tier", "domain", "item_a_label", "item_b_label", "item_c_label",
  "clue_prompt", "core_parts", "operations", "traits_attributes", "scale_medium",
  "input_output", "flow_direction", "modification_exemption", "blind_spot_note",
];
export const MECHANICS = COLUMNS.slice(7, 14);
export const HASH_PATTERN = /^[0-9a-f]{64}$/;
const encoder = new TextEncoder();
export const BRANCH_COUNT = 32;

export async function sha256(text) {
  const buffer = await globalThis.crypto.subtle.digest("SHA-256", encoder.encode(text));
  return Array.from(new Uint8Array(buffer), byte => byte.toString(16).padStart(2, "0")).join("");
}

export function rowSha256(row) {
  return sha256(JSON.stringify(["academy-mechanics-v1",
    ...MECHANICS.map(key => row[key].normalize("NFC").trim())]));
}

export function contentSha256(row) {
  if (!row || Object.keys(row).length !== COLUMNS.length ||
    COLUMNS.some(key => !Object.hasOwn(row, key) || row[key] === undefined)) {
    throw new Error("Invalid curriculum row shape");
  }
  return sha256(JSON.stringify(["academy-row-v1", ...COLUMNS.map(key => row[key])]));
}

export async function merkleRoot(hashes) {
  if (!hashes.every(hash => HASH_PATTERN.test(hash))) throw new Error("Invalid Merkle hash");
  if (!hashes.length) return sha256("academy-empty-v1");
  let level = await Promise.all(hashes.map(hash => sha256("academy-leaf-v1:" + hash)));
  while (level.length > 1) {
    const pairs = [];
    for (let i = 0; i < level.length; i += 2) {
      const right = level[i + 1];
      pairs.push(sha256(right === undefined
        ? "academy-single-v1:" + level[i]
        : "academy-pair-v1:" + level[i] + right));
    }
    level = await Promise.all(pairs);
  }
  return level[0];
}

export function branchFor(id) {
  if (!Number.isSafeInteger(id) || id < 1) throw new Error("Invalid lesson ID");
  return id % BRANCH_COUNT;
}

export function columnProjection(row) {
  return Object.fromEntries(COLUMNS.map(key => [key, row[key]]));
}

export async function identifySnapshot(rows) {
  const ordered = [...rows].sort((a, b) => a.id - b.id);
  const groups = Array.from({ length: BRANCH_COUNT }, () => []);
  const content = await Promise.all(ordered.map(contentSha256));
  for (let i = 0; i < ordered.length; i++) {
    if (i && ordered[i - 1].id === ordered[i].id) throw new Error("Duplicate lesson ID");
    groups[branchFor(ordered[i].id)].push(content[i]);
  }
  const branches = await Promise.all(groups.map(merkleRoot));
  return { version: 1, root: await merkleRoot(branches), branches, count: rows.length };
}

export async function mechanicsRoot(rows) {
  return merkleRoot((await Promise.all(rows.map(rowSha256))).sort());
}

export function idempotencyKey(operation, origin, payload) {
  return sha256(JSON.stringify(["academy-write-v1", operation, origin, payload]));
}

export function observationPayload(row) {
  return [row.id, row.lessonId ?? null, row.objectName.trim(),
    row.secondObject?.trim() || null, row.note ?? "", row.photo ?? null];
}
