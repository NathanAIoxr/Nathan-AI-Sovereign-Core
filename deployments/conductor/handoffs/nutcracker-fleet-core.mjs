export function createNutcrackerFleet() {
  const fleetCount = 69;
  const unitsPerFleet = 1_000;
  const total = fleetCount * unitsPerFleet;
  const sourceLimit = 256 * 1024;
  const protectionChecks = ["consent", "privacy", "exploitation"];
  const identifier = /^[A-Za-z0-9][A-Za-z0-9._:/-]{0,95}$/;
  const digestPattern = /^[a-f0-9]{64}$/;

  function unitAt(ordinal) {
    if (!Number.isInteger(ordinal) || ordinal < 1 || ordinal > total) {
      throw new RangeError("Nutcracker number is outside the fleet.");
    }
    const fleet = Math.floor((ordinal - 1) / unitsPerFleet) + 1;
    const unit = (ordinal - 1) % unitsPerFleet + 1;
    return {
      ordinal, fleet, unit,
      id: `NC-${String(fleet).padStart(2, "0")}-${String(unit).padStart(4, "0")}`
    };
  }

  function assign(digest) {
    if (!digestPattern.test(digest)) throw new TypeError("A SHA-256 source digest is required.");
    return unitAt(Number(BigInt(`0x${digest}`) % BigInt(total)) + 1);
  }

  function claims(parts) {
    const byId = new Map();
    const byClaim = new Map();
    const conflicted = new Set();
    const contradictions = [];
    let malformed = 0;
    for (const part of parts) {
      if (!part || ![part.id, part.subject, part.predicate, part.scope]
        .every(value => typeof value === "string" && identifier.test(value)) ||
        !["boolean", "string", "number"].includes(typeof part.value) ||
        (typeof part.value === "number" && !Number.isFinite(part.value)) ||
        (typeof part.value === "string" && part.value.length > 256)) {
        malformed++;
        continue;
      }

      if (byId.has(part.id)) {
        conflicted.add(part.id);
        contradictions.push({ type: "duplicate-part-id", parts: [part.id] });
      } else {
        byId.set(part.id, part);
      }

      const key = JSON.stringify([part.subject, part.predicate, part.scope]);
      if (!byClaim.has(key)) byClaim.set(key, { values: new Set(), ids: [] });
      const group = byClaim.get(key);
      group.values.add(JSON.stringify(part.value));
      group.ids.push(part.id);
    }
    for (const { values, ids } of byClaim.values()) {
      if (values.size < 2) continue;
      for (const id of ids) conflicted.add(id);
      contradictions.push({ type: "conflicting-claims", parts: [...new Set(ids)] });
    }
    return { byId, conflicted, contradictions, malformed };
  }

  function review(manifest, digest, medium) {
    const nutcracker = assign(digest);
    const report = {
      version: 1,
      nutcracker,
      source: { sha256: digest, medium },
      disposition: "held",
      failures: [],
      holds: [],
      contradictions: [],
      reuse: []
    };
    if (!["digital", "paper"].includes(medium)) {
      report.holds.push("Select digital or paper intake.");
      return report;
    }
    if (!manifest || typeof manifest !== "object" || Array.isArray(manifest)) {
      report.holds.push("A structured review manifest is required.");
      return report;
    }

    const reviewRef = manifest.protection?.reviewRef;
    const sourceBound = manifest.protection?.sourceSha256 === digest;
    if (!sourceBound || typeof reviewRef !== "string" || !identifier.test(reviewRef)) {
      report.holds.push("Record a reviewer reference tied to this source SHA-256.");
    }
    for (const check of protectionChecks) {
      const result = manifest.protection?.[check];
      if (result === "fail") report.failures.push(`Innocence protection failed: ${check}.`);
      else if (result !== "pass") report.holds.push(`Innocence protection is unresolved: ${check}.`);
    }
    if (!Array.isArray(manifest.parts) || manifest.parts.length > 500) {
      report.holds.push("Provide a parts array of at most 500 entries.");
    } else {
      const { byId, conflicted, contradictions, malformed } = claims(manifest.parts);
      report.contradictions = contradictions;
      if (malformed) report.holds.push(`${malformed} part entries have invalid identifiers or values.`);
      if (sourceBound) {
        for (const [id, part] of byId) {
          const evidence = part.reuseReview;
          if (conflicted.has(id) || evidence?.status !== "approved" ||
            evidence.sourceSha256 !== digest || typeof evidence.ref !== "string" ||
            !identifier.test(evidence.ref) || evidence.ref === reviewRef) continue;
          report.reuse.push({ part: id, reviewRef: evidence.ref });
        }
      }
    }

    if (report.failures.length || report.contradictions.length) report.disposition = "crushed";
    else if (!report.holds.length) report.disposition = "cleared";
    if (report.disposition !== "crushed" || report.holds.length) report.reuse = [];
    return report;
  }

  async function digestSource(bytes) {
    if (!(bytes instanceof Uint8Array) || !bytes.length || bytes.length > sourceLimit) {
      throw new RangeError("Supply 1 to 262,144 bytes of source material.");
    }
    const hash = await globalThis.crypto.subtle.digest("SHA-256", bytes);
    return Array.from(new Uint8Array(hash), byte => byte.toString(16).padStart(2, "0")).join("");
  }

  async function reuseBundle(bytes, manifest, medium) {
    const sourceSha256 = await digestSource(bytes);
    const report = review(manifest, sourceSha256, medium);
    const approvedParts = [];
    if (!report.reuse.length) return { sourceSha256, approvedParts };
    const parts = new Map(manifest.parts.map(part => [part?.id, part]));
    let exportedBytes = 0;
    for (const receipt of report.reuse) {
      const { range, reuseReview } = parts.get(receipt.part);
      const partHash = reuseReview.partSha256;
      if (range === undefined && partHash === undefined) {
        approvedParts.push(receipt);
        continue;
      }
      if (!Array.isArray(range) || range.length !== 2 ||
        !range.every(Number.isInteger) || !digestPattern.test(partHash ?? "")) continue;
      const [start, end] = range;
      if (start < 0 || end <= start || end > bytes.length) continue;
      const slice = bytes.subarray(start, end);
      if (await digestSource(slice) !== partHash) continue;
      exportedBytes += slice.length;
      if (exportedBytes > sourceLimit) throw new RangeError("Approved parts exceed the 256 KiB export budget.");
      let binary = "";
      for (const byte of slice) binary += String.fromCharCode(byte);
      approvedParts.push({ ...receipt, range, sha256: partHash, bytesBase64: btoa(binary) });
    }
    return { sourceSha256, approvedParts };
  }

  function parseManifest(text) {
    const manifest = JSON.parse(text);
    const containers = [];
    const tokens = /"(?:[^"\\]|\\.)*"\s*:?|[{}\[\]]/gs;
    for (const [token] of text.matchAll(tokens)) {
      if (token === "{" || token === "[") containers.push(new Set());
      else if (token === "}" || token === "]") containers.pop();
      else if (token.endsWith(":")) {
        const key = JSON.parse(token.slice(0, -1));
        const keys = containers.at(-1);
        if (keys.has(key)) throw new SyntaxError("The manifest contains a duplicate JSON field.");
        keys.add(key);
      }
    }
    return manifest;
  }

  return { fleetCount, unitsPerFleet, total, sourceLimit, unitAt, assign, review, digestSource, parseManifest, reuseBundle };
}
