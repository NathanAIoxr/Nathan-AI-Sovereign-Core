const FRESH_MS = 12 * 60 * 1000;
const MAX_AGE_MS = 24 * 60 * 60 * 1000;
const SOURCES = {
  worker_catalog: {
    binding: "WORKER_CATALOG",
    keys: ["worker_definitions"],
    sql: "SELECT COUNT(*) AS worker_definitions FROM workers",
  },
  fleet_registry: {
    binding: "FLEET_REGISTRY",
    keys: ["observed_worker_records", "declared_agents", "declared_bots", "repository_references",
      "execution_evidence_rows", "logical_node_slots", "verified_telemetry_nodes"],
    sql: `SELECT
      (SELECT COUNT(*) FROM owned_runtime_registry WHERE kind='worker' AND state='observed') AS observed_worker_records,
      (SELECT COUNT(*) FROM owned_runtime_registry WHERE kind='agent' AND state='declared') AS declared_agents,
      (SELECT COUNT(*) FROM owned_runtime_registry WHERE kind='bot' AND state='declared') AS declared_bots,
      (SELECT COUNT(*) FROM fleet_public_agent_projects_v1) AS repository_references,
      (SELECT COUNT(*) FROM fleet_execution_evidence_v1) AS execution_evidence_rows,
      (SELECT COUNT(*) FROM virtual_supercomputer_slot_v1) AS logical_node_slots,
      (SELECT COUNT(DISTINCT node_id) FROM sovereign_node_telemetry_v1 WHERE verified_identity=1) AS verified_telemetry_nodes`,
  },
};

function clean(name, value, now) {
  if (!Number.isSafeInteger(value?.checked_at) || value.checked_at > now + 10000
      || now - value.checked_at >= MAX_AGE_MS) return null;
  const counts = {};
  for (const key of SOURCES[name].keys) {
    if (!Number.isSafeInteger(value.counts?.[key]) || value.counts[key] < 0) return null;
    counts[key] = value.counts[key];
  }
  return { checked_at: value.checked_at, fresh: now - value.checked_at < FRESH_MS, counts };
}

export async function captureFleet(env) {
  await Promise.allSettled(Object.entries(SOURCES).map(async ([name, cfg]) => {
    try {
      const counts = await env[cfg.binding].prepare(cfg.sql).first();
      const now = Date.now();
      const reading = clean(name, { checked_at: now, counts }, now);
      if (!reading) throw new Error("Invalid source totals");
      await env.STATUS.put("fleet:" + name, JSON.stringify(reading), { expirationTtl: 86400 });
    } catch {
      console.warn(JSON.stringify({ event: "fleet_source_check_failed", source: name, probe: env.ROLE }));
    }
  }));
}

export async function publicFleet(env, peerAllowed, fetcher = fetch) {
  const now = Date.now();
  const names = Object.keys(SOURCES);
  const pairs = await Promise.all(names.map(async (name) => {
    try {
      return [name, clean(name, await env.STATUS.get("fleet:" + name, "json"), now)];
    } catch {
      return [name, null];
    }
  }));
  const sources = Object.fromEntries(pairs);
  if (peerAllowed && names.some(name => !sources[name]?.fresh)) {
    try {
      const peer = await fetcher(new URL("/conductor/fleet-snapshot", env.PEER_URL),
        { redirect: "manual", signal: AbortSignal.timeout(1800) });
      if (peer.ok) {
        const remote = await peer.json();
        const expectedPeer = env.ROLE === "primary" ? "standby" : "primary";
        if (remote.served_by === expectedPeer) {
          for (const name of names) {
            const reading = clean(name, remote.sources?.[name], now);
            if (reading && reading.checked_at > (sources[name]?.checked_at ?? 0)) sources[name] = reading;
          }
        }
      } else {
        await peer.body?.cancel().catch(() => {});
      }
    } catch {
      // Retain any local readings when the peer is unavailable.
    }
  }
  const available = names.some(name => sources[name] !== null);
  const complete = names.every(name => sources[name]?.fresh === true);
  return Response.json({ state: complete ? "current" : available ? "partial_or_stale" : "unavailable",
    served_by: env.ROLE, sources }, { status: available ? 200 : 503, headers: {
    "cache-control": "no-store", "x-content-type-options": "nosniff", "referrer-policy": "no-referrer",
  } });
}
