const encoder = new TextEncoder();
const addressPattern = /^0x[0-9a-fA-F]{40}$/;
const identifierPattern = /^[a-z0-9][a-z0-9._-]{0,79}$/;
const edgeKinds = new Set(["webhook", "queue-delivery"]);
const archiveKinds = new Set(["failed-transaction", "expired-mempool-record", "orphaned-index", "obsolete-build-artifact"]);
const evidenceKinds = new Set(["voluntary-burn", "curtailed-energy", "idle-compute", "waste-heat"]);

function requireValue(condition, message) {
  if (!condition) throw new TypeError(message);
}

function bytes(value) {
  return encoder.encode(JSON.stringify(value)).length;
}

export async function sha256(value) {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(JSON.stringify(value)));
  return "0x" + Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, "0")).join("");
}

function filterEdge(events) {
  const accepted = [];
  const identities = new Set();
  let duplicates = 0;
  let discarded = 0;
  for (const event of events) {
    if (typeof event?.id !== "string" || !identifierPattern.test(event.id) || !edgeKinds.has(event.kind)) {
      discarded++;
      continue;
    }
    const eventKey = JSON.stringify([event.kind, event.id]);
    if (identities.has(eventKey)) {
      duplicates++;
      continue;
    }
    identities.add(eventKey);
    accepted.push({ id: event.id, kind: event.kind });
  }
  return { accepted, duplicates, discarded };
}

function refineArchive(records) {
  const retained = [];
  const reclaimed = [];
  const ids = new Set();
  for (const record of records) {
    requireValue(typeof record?.id === "string" && identifierPattern.test(record.id) && !ids.has(record.id), "Archive IDs must be valid and unique");
    ids.add(record.id);
    if (archiveKinds.has(record.kind) && record.retention === "expired" && record.hold === false) {
      reclaimed.push(record);
    } else {
      retained.push(record);
    }
  }
  const before = bytes(records);
  const after = bytes(retained);
  return { retained, reclaimed, before, after };
}

export async function refineBatch(job, input) {
  for (const key of ["id", "resource", "window"]) {
    requireValue(typeof job?.[key] === "string" && identifierPattern.test(job[key]), "Invalid approved job scope");
  }
  requireValue(typeof job.wallet === "string" && addressPattern.test(job.wallet) && !/^0x0{40}$/.test(job.wallet), "Invalid wallet");
  for (const key of ["eventsPerCoin", "bytesPerCoin", "maxCoins"]) {
    requireValue(Number.isSafeInteger(job[key]) && job[key] > 0, "Invalid approved payout rule");
  }
  for (const key of ["events", "archive", "evidence"]) {
    requireValue(Array.isArray(input?.[key]) && input[key].length <= 1000, "Invalid or oversized batch");
  }
  requireValue(input.resource === job.resource && input.window === job.window, "Feedstock is outside the approved resource or window");

  const edge = filterEdge(input.events);
  const archive = refineArchive(input.archive);
  const evidence = input.evidence.map(record => {
    requireValue(evidenceKinds.has(record?.kind) && typeof record.ref === "string" && identifierPattern.test(record.ref), "Invalid evidence reference");
    return { kind: record.kind, ref: record.ref };
  });
  const archiveBytes = archive.before - archive.after;
  const candidateCoins = Math.min(job.maxCoins,
    Math.floor(edge.duplicates / job.eventsPerCoin) + Math.floor(archiveBytes / job.bytesPerCoin));
  const receipt = {
    version: 1,
    jobKey: await sha256(["cryptocurrency-pooper/v1", job.resource, job.window]),
    job: job.id,
    resource: job.resource,
    window: job.window,
    wallet: job.wallet.toLowerCase(),
    inputHash: await sha256([input.events, input.archive, evidence]),
    outputHash: await sha256([edge.accepted, archive.retained]),
    rate: { eventsPerCoin: job.eventsPerCoin, bytesPerCoin: job.bytesPerCoin, maxCoins: job.maxCoins },
    edge: { forwarded: edge.accepted.length, duplicates: edge.duplicates, discarded: edge.discarded },
    archive: { retired: archive.reclaimed.map(record => record.id), before: archive.before, after: archive.after, reclaimedBytes: archiveBytes },
    evidence,
    candidateCoins
  };

  return { receipt, receiptHash: await sha256(receipt), forwarded: edge.accepted, retained: archive.retained };
}

export const demoJob = {
  id: "first-refining-run",
  resource: "pooper-demo",
  window: "sample-001",
  wallet: "0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc",
  eventsPerCoin: 2,
  bytesPerCoin: 64,
  maxCoins: 12
};

export const demoFeedstock = {
  resource: demoJob.resource,
  window: demoJob.window,
  events: [
    { id: "event-1", kind: "webhook" },
    { id: "event-1", kind: "webhook" },
    { id: "event-1", kind: "webhook" },
    { id: "event-2", kind: "queue-delivery" },
    { id: "spam-1", kind: "spam" },
    { id: "flood-1", kind: "blocked-traffic" }
  ],
  archive: [
    { id: "tx-failed", kind: "failed-transaction", retention: "expired", hold: false },
    { id: "mempool-expired", kind: "expired-mempool-record", retention: "expired", hold: false },
    { id: "orphaned-index", kind: "orphaned-index", retention: "expired", hold: false },
    { id: "old-build", kind: "obsolete-build-artifact", retention: "expired", hold: false },
    { id: "held-build", kind: "obsolete-build-artifact", retention: "expired", hold: true },
    { id: "pending-tx", kind: "transaction", retention: "active", hold: false }
  ],
  evidence: [
    { kind: "voluntary-burn", ref: "sample-burn-receipt" },
    { kind: "curtailed-energy", ref: "sample-meter-reading" },
    { kind: "idle-compute", ref: "sample-compute-reading" },
    { kind: "waste-heat", ref: "sample-heat-reading" }
  ]
};
