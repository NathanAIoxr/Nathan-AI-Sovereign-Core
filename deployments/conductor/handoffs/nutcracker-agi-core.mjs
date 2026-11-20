export function createNutcrackerAgi(fleet) {
  const label = /^[A-Za-z0-9][A-Za-z0-9._:/-]{0,95}$/;
  const encoder = new TextEncoder();
  const candidateLimit = 24;

  function sourceText(bytes) {
    try { return new TextDecoder("utf-8", { fatal: true, ignoreBOM: true }).decode(bytes); }
    catch { throw new Error("Claim extraction needs a UTF-8 source or a transcription."); }
  }

  function literalClaims(text) {
    const claims = [];
    for (const quote of text.split(/\r?\n/)) {
      const fields = /^CLAIM[ \t]+([^|]+)\|([^|]+)\|([^|]+)\|(.+)$/.exec(quote);
      if (!fields) continue;
      const [, subject, predicate, scope, raw] = fields.map(value => value.trim());
      let value;
      try { value = JSON.parse(raw); } catch { value = raw; }
      claims.push({ subject, predicate, scope, value, quote });
    }
    return claims;
  }

  function usable(candidate) {
    return candidate && [candidate.subject, candidate.predicate, candidate.scope].every(
      field => typeof field === "string" && label.test(field)
    ) && (typeof candidate.value === "boolean" ||
      (typeof candidate.value === "number" && Number.isFinite(candidate.value)) ||
      (typeof candidate.value === "string" && candidate.value.length <= 256))
      && typeof candidate.quote === "string" && candidate.quote.trim().length >= 4
      && candidate.quote.length <= 1_024;
  }

  async function draft(bytes, proposals = null, origin = "imported-llm") {
    const sourceSha256 = await fleet.digestSource(bytes);
    const text = sourceText(bytes);
    const claims = [];
    const skipped = [];
    const seen = new Set();
    const locals = literalClaims(text);
    const modelClaims = Array.isArray(proposals?.claims) ? proposals.claims : [];
    if (proposals !== null && !Array.isArray(proposals?.claims)) skipped.push({ origin, reason: "missing-claims-array" });
    if (locals.length > candidateLimit || modelClaims.length > candidateLimit) {
      skipped.push({ reason: "candidate-limit-exceeded" });
    }
    const sources = [
      ...locals.slice(0, candidateLimit).map(candidate => ({ candidate, kind: "literal" })),
      ...modelClaims.slice(0, candidateLimit).map(candidate => ({ candidate, kind: origin }))
    ];
    const normalize = value => typeof value === "string" ? value.trim().toLowerCase().replace(/[ _]+/g, "-") : value;
    for (const { candidate: proposed, kind } of sources) {
      const candidate = kind !== "literal" && proposed && typeof proposed === "object" ? {
        ...proposed,
        subject: normalize(proposed.subject), predicate: normalize(proposed.predicate), scope: normalize(proposed.scope)
      } : proposed;
      if (!usable(candidate)) {
        skipped.push({ origin: kind, reason: "invalid-claim" });
        continue;
      }
      const { subject, predicate, scope, value, quote } = candidate;
      const index = text.indexOf(quote);
      if (index < 0 || text.indexOf(quote, index + 1) >= 0) {
        skipped.push({ origin: kind, reason: index < 0 ? "quote-not-in-source" : "quote-ambiguous" });
        continue;
      }
      const start = encoder.encode(text.slice(0, index)).length;
      const quotedBytes = encoder.encode(quote);
      const key = JSON.stringify([subject, predicate, scope, value, start, quotedBytes.length]);
      if (seen.has(key)) continue;
      seen.add(key);
      const evidenceSha256 = await fleet.digestSource(quotedBytes);
      const identityBytes = encoder.encode(key);
      const id = "claim-" + (await fleet.digestSource(identityBytes)).slice(0, 24);
      claims.push({
        id, subject, predicate, scope, value, quote, origin: kind,
        range: [start, start + quotedBytes.length], evidenceSha256
      });
    }
    return {
      sourceSha256, nutcracker: fleet.assign(sourceSha256),
      binary: Array.from(bytes.subarray(0, 12), byte => byte.toString(2).padStart(8, "0")).join(" "),
      claims, skipped
    };
  }

  function prepareManifest(draft, input = {}) {
    const current = input && typeof input === "object" && !Array.isArray(input) ? input : {};
    const matchingProtection = current.protection?.sourceSha256 === draft.sourceSha256;
    const review = matchingProtection ? current.protection : {};
    const sameSource = current.claimReview?.sourceSha256 === draft.sourceSha256;
    const previous = sameSource && typeof current.claimReview?.decisions === "object"
      ? current.claimReview.decisions : {};
    return {
      protection: {
        sourceSha256: draft.sourceSha256, reviewRef: "", consent: "unresolved",
        privacy: "unresolved", exploitation: "unresolved", ...review
      },
      claimReview: {
        sourceSha256: draft.sourceSha256, decisions: Object.fromEntries(draft.claims
          .filter(claim => claim.origin !== "literal")
          .map(claim => [claim.id, previous?.[claim.id] ?? { decision: "pending", reviewRef: "" }]))
      },
      parts: matchingProtection && Array.isArray(current.parts) ? current.parts : []
    };
  }

  function assess(draft, manifest, sourceSha256, medium) {
    if (sourceSha256 !== draft.sourceSha256) throw new Error("The source changed. Draft claims again.");
    const holds = [];
    const decisions = [];
    const chosen = [];
    const review = manifest?.claimReview;
    if (manifest?.parts !== undefined && !Array.isArray(manifest.parts)) holds.push("Supply additional parts as a JSON array.");
    if (!draft.claims.length) holds.push("Provide at least one source-grounded claim.");
    if (draft.skipped.some(entry => entry.origin === "literal" || !entry.origin)) {
      holds.push("Resolve the skipped literal claims or the candidate limit before release.");
    }
    for (const claim of draft.claims) {
      let decision = "literal";
      let reviewRef;
      if (claim.origin !== "literal") {
        const record = review?.sourceSha256 === sourceSha256 ? review.decisions?.[claim.id] : null;
        const checked = record && typeof record.reviewRef === "string" && label.test(record.reviewRef) &&
          ["accept", "dismiss"].includes(record.decision);
        decision = checked ? record.decision : "pending";
        reviewRef = checked ? record.reviewRef : undefined;
        if (!checked) holds.push(`Review the meaning of draft ${claim.id} against its source quote.`);
      }
      decisions.push({ id: claim.id, origin: claim.origin, decision, reviewRef, range: claim.range, evidenceSha256: claim.evidenceSha256 });
      if (decision !== "literal" && decision !== "accept") continue;
      const { id, subject, predicate, scope, value, range } = claim;
      const supplied = Array.isArray(manifest?.parts)
        ? manifest.parts.find(part => part?.id === id)
        : undefined;
      chosen.push({ id, subject, predicate, scope, value, range, reuseReview: supplied?.reuseReview });
    }
    if (!chosen.length && draft.claims.length && !holds.length) holds.push("Accept or add source-grounded evidence before release.");
    const drafted = new Set(draft.claims.map(claim => claim.id));
    const effective = {
      protection: manifest?.protection,
      parts: Array.isArray(manifest?.parts)
        ? [...chosen, ...manifest.parts.filter(part => !drafted.has(part?.id))]
        : chosen
    };
    const report = fleet.review(effective, sourceSha256, medium);
    report.holds.push(...holds);
    if (holds.length) {
      if (report.disposition === "cleared") report.disposition = "held";
      report.reuse = [];
    }
    report.reasoning = {
      stages: ["intake", "claim-draft", "source-verification", "evidence-review", "fleet-decision"],
      rejectedDrafts: draft.skipped, evidence: decisions
    };
    return { report, effective };
  }

  return { sourceText, draft, prepareManifest, assess };
}
