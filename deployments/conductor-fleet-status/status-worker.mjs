const STATUS_PATH = "/conductor";
const CRON_MAX_AGE_MS = 12 * 60 * 1000;
const STATES = new Set(["reachable", "unreachable", "check_required"]);
const LABELS = {
  reachable: "The public gateway responded",
  unreachable: "The public gateway could not be reached",
  check_required: "The gateway returned an unexpected response",
  unknown: "Waiting for a fresh gateway check",
};
const ROLES = new Set(["primary", "standby"]);

function usable(snapshot, now = Date.now()) {
  return STATES.has(snapshot?.state) && ROLES.has(snapshot?.probe)
    && Number.isSafeInteger(snapshot?.checked_at)
    && snapshot.checked_at <= now + 10000 && now - snapshot.checked_at < CRON_MAX_AGE_MS;
}

export async function checkGateway(fetcher, url) {
  try {
    const response = await fetcher(url, {
      method: "GET", redirect: "manual", signal: AbortSignal.timeout(5000),
      headers: { "cache-control": "no-cache", accept: "application/json" },
    });
    await response.body?.cancel().catch(() => {});
    if (response.status === 401) return "reachable";
    if (response.status >= 500) return "unreachable";
    return "check_required";
  } catch {
    return "unreachable";
  }
}

async function ownReading(env) {
  try {
    const snapshot = await env.STATUS.get("latest", "json");
    return usable(snapshot) ? snapshot : null;
  } catch {
    return null;
  }
}

async function peerReading(env) {
  try {
    const response = await fetch(new URL(STATUS_PATH + "/snapshot", env.PEER_URL), {
      redirect: "manual", signal: AbortSignal.timeout(1800),
    });
    if (!response.ok) {
      await response.body?.cancel().catch(() => {});
      return null;
    }
    const snapshot = await response.json();
    const expectedPeer = env.ROLE === "primary" ? "standby" : "primary";
    return usable(snapshot) && snapshot.probe === expectedPeer ? snapshot : null;
  } catch {
    return null;
  }
}

function headers(csp = false) {
  return {
    "cache-control": "no-store",
    "x-content-type-options": "nosniff",
    "referrer-policy": "no-referrer",
    ...(csp ? {
      "content-type": "text/html; charset=utf-8",
      "content-security-policy": "default-src 'none'; style-src 'unsafe-inline'; frame-ancestors 'none'; base-uri 'none'",
    } : {}),
  };
}

function dashboard(reading, env) {
  const label = LABELS[reading?.state ?? "unknown"];
  const time = reading ? new Date(reading.checked_at).toISOString() : "—";
  const peer = env.ROLE === "primary" ? "standby" : "primary";
  return new Response(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Nathan AI Conductor status</title><style>body{font:1rem/1.55 system-ui,sans-serif;margin:0;color:#182332;background:#f5f7fa}main{max-width:42rem;margin:10vh auto;padding:1.5rem}h1{font-size:clamp(2rem,7vw,3.5rem);line-height:1.1}section{background:#fff;border:1px solid #ccd5df;padding:1rem 1.3rem;border-radius:.6rem}dt{font-weight:650}dd{margin:0 0 .7rem}a{color:#143f79}</style></head><body><main><h1>Nathan AI Conductor status</h1><section aria-label="Gateway status"><strong>${label}</strong><dl><dt>Last check (UTC)</dt><dd>${time}</dd><dt>Reading from</dt><dd>${reading?.probe ?? "—"}</dd><dt>Page served by</dt><dd>${env.ROLE}</dd></dl></section><p>This public check measures gateway reachability. Job and queue health are checked privately.</p><p><a href="${new URL(STATUS_PATH, env.PEER_URL).href}">Open the ${peer} status page</a> · <a href="/conductor/status">JSON status</a> · <a href="/conductor/fleet">Fleet counts</a></p></main></body></html>`, { headers: headers(true) });
}

export default {
  async scheduled(controller, env) {
    const state = await checkGateway(fetch, env.HEALTH_URL);
    const checked_at = Date.now();
    await env.STATUS.put("latest", JSON.stringify({ state, checked_at, probe: env.ROLE }), { expirationTtl: 3600 });
    console.log(JSON.stringify({ event: "gateway_check", state, probe: env.ROLE }));
  },

  async fetch(request, env) {
    if (request.method !== "GET") return new Response("Method not allowed", { status: 405, headers: { allow: "GET" } });
    const path = new URL(request.url).pathname.slice(STATUS_PATH.length) || "/";
    if (path !== "/" && path !== "/status" && path !== "/snapshot") return new Response("Not found", { status: 404 });
    const own = await ownReading(env);
    const reading = own ?? (path === "/snapshot" ? null : await peerReading(env));
    if (path === "/") return dashboard(reading, env);
    if (!reading) return Response.json({ state: "unknown", served_by: env.ROLE }, { status: 503, headers: headers() });
    return Response.json({ state: reading.state, checked_at: reading.checked_at, probe: reading.probe, served_by: env.ROLE }, { headers: headers() });
  },
};
