import { branchFor, BRANCH_COUNT, COLUMNS, HASH_PATTERN, identifySnapshot, merkleRoot } from "../shared/merkle.js";

function validManifest(manifest) {
  return manifest?.version === 1 && HASH_PATTERN.test(manifest.root) &&
    Array.isArray(manifest.branches) && manifest.branches.length === BRANCH_COUNT &&
    manifest.branches.every(branch => HASH_PATTERN.test(branch)) &&
    Number.isSafeInteger(manifest.count) && manifest.count >= 0;
}

export async function syncCurriculum(local, fetcher, signal) {
  const remembered = validManifest(local?.manifest) && Array.isArray(local.rows) ? local : null;
  const headers = remembered ? { "If-None-Match": '"' + remembered.manifest.root + '"' } : {};
  for (let attempt = 0; attempt < 3; attempt++) {
    const response = await fetcher("/api/integrity", { headers, signal });
    if (response.status === 404) return null;
    if (response.status === 304 && remembered) {
      const actual = await identifySnapshot(remembered.rows);
      if (actual.root !== remembered.manifest.root) throw new Error("Offline integrity check failed");
      return remembered;
    }
    if (!response.ok) throw new Error("Published curriculum could not be verified");
    const manifest = await response.json();
    if (!validManifest(manifest) || await merkleRoot(manifest.branches) !== manifest.root) {
      throw new Error("Invalid curriculum manifest");
    }
    const prior = remembered ? await identifySnapshot(remembered.rows) : await identifySnapshot([]);
    const changed = manifest.branches.flatMap((hash, i) => hash === prior.branches[i] ? [] : [i]);
    let copies = [];
    if (changed.length) {
      const result = await fetcher(`/api/integrity?branches=${changed.join(",")}&root=${manifest.root}`, { signal });
      if (result.status === 409) continue;
      if (!result.ok) throw new Error("Curriculum branches could not be loaded");
      const packet = await result.json();
      if (packet.root !== manifest.root || !packet.branches || Object.keys(packet.branches).length !== changed.length) {
        throw new Error("Invalid curriculum branches");
      }
      copies = changed.map(branch => {
        const rows = packet.branches[branch];
        if (!Array.isArray(rows) || rows.some(row => !row || Object.keys(row).length !== COLUMNS.length ||
          !COLUMNS.every(key => Object.hasOwn(row, key)) || branchFor(row.id) !== branch)) {
          throw new Error("Invalid curriculum branch");
        }
        return rows;
      });
    }
    const replaced = new Set(changed);
    const unchanged = remembered?.rows.filter(row => !replaced.has(branchFor(row.id))) ?? [];
    const rows = [...unchanged, ...copies.flat()].sort((a, b) => a.id - b.id);
    const actual = await identifySnapshot(rows);
    if (actual.root !== manifest.root || rows.length !== manifest.count) throw new Error("Curriculum root mismatch");
    return { manifest, rows };
  }
  throw new Error("Curriculum changed during each synchronization attempt");
}
