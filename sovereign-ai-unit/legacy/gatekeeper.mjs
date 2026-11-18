var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// shared/protocol.ts
var clearingEquation = "1 - 1 = 0";
var requestIdPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
function json(data, status = 200, headers = {}) {
  return Response.json(data, {
    status,
    headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff", ...headers }
  });
}
__name(json, "json");
function cleared(error, status, headers) {
  return json({ box: 0, equation: clearingEquation, error }, status, headers);
}
__name(cleared, "cleared");
async function digest(text) {
  return crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
}
__name(digest, "digest");
async function sha256(text) {
  return Array.from(new Uint8Array(await digest(text)), (byte) => byte.toString(16).padStart(2, "0")).join("");
}
__name(sha256, "sha256");

// box-0-zero/thermal-purge.ts
var tempNamespace = "sovereign:compute:v1:";
var cacheLifetimeSeconds = 86400;
function tempKey(requestId) {
  return tempNamespace + requestId;
}
__name(tempKey, "tempKey");
async function purgeExpiredLeases(compute2) {
  const response = await compute2.fetch("https://box-one/maintenance", { method: "POST" });
  if (!response.ok) throw new Error(`Expired lease purge failed (${response.status})`);
}
__name(purgeExpiredLeases, "purgeExpiredLeases");

// box-0-zero/gatekeeper.ts
var maxBodyBytes = 16384;
var maxInputLength = 4e3;
async function authorized(supplied, expected) {
  if (!supplied || supplied.length > 256) return false;
  const [actual, secret] = await Promise.all([digest(supplied), digest(expected)]);
  return crypto.subtle.timingSafeEqual(actual, secret);
}
__name(authorized, "authorized");
async function readInput(request) {
  const contentType = request.headers.get("content-type")?.split(";")[0].trim().toLowerCase();
  if (contentType !== "application/json") return cleared("Expected application/json.", 415);
  if (Number(request.headers.get("content-length")) > maxBodyBytes) return cleared("Request body is too large.", 413);
  if (!request.body) return cleared("Input is required.", 400);
  const reader = request.body.getReader();
  const decoder = new TextDecoder("utf-8", { fatal: true, ignoreBOM: false });
  let size = 0;
  let raw = "";
  try {
    for (; ; ) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maxBodyBytes) {
        await reader.cancel();
        return cleared("Request body is too large.", 413);
      }
      raw += decoder.decode(value, { stream: true });
    }
    raw += decoder.decode();
    const body = JSON.parse(raw);
    const input = body && typeof body === "object" && "input" in body && typeof body.input === "string" ? body.input.trim() : "";
    return input && input.length <= maxInputLength ? input : cleared("Input must contain 1 to 4,000 UTF-16 code units after trimming.", 400);
  } catch {
    return cleared("Invalid JSON request body.", 400);
  } finally {
    reader.releaseLock();
  }
}
__name(readInput, "readInput");
async function compute(request, env) {
  const requestId = request.headers.get("idempotency-key")?.toLowerCase() ?? "";
  if (!requestIdPattern.test(requestId)) return cleared("Idempotency-Key must be a UUID.", 400);
  const input = await readInput(request);
  if (input instanceof Response) return input;
  const key = tempKey(requestId);
  const hash = await sha256(input);
  try {
    const cached = await env.BOX_0_TEMP.get(key, "json");
    if (cached?.request_id === requestId && cached.input_hash === hash) {
      return json({ ...cached, source: "temporary-cache" });
    }
  } catch {
    console.warn(JSON.stringify({ event: "temporary_cache_read_failed", request_id: requestId }));
  }
  const result = await env.BOX_ONE.fetch("https://box-one/compute", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ requestId, input })
  });
  if (result.status === 201) {
    try {
      await env.BOX_0_TEMP.put(key, await result.clone().text(), { expirationTtl: cacheLifetimeSeconds });
    } catch {
      console.warn(JSON.stringify({ event: "temporary_cache_write_failed", request_id: requestId }));
    }
  }
  return result;
}
__name(compute, "compute");
var gatekeeper_default = {
  async fetch(request, env) {
    const url = new URL(request.url);
    try {
      if (request.method === "GET" && url.pathname === "/health") {
        const check = await env.BOX_ONE.fetch("https://box-one/health");
        return json({
          service: "Sovereign AI Unit by Nathan Tabor",
          status: check.ok ? "ready" : "degraded",
          authentication_configured: Boolean(env.SOVEREIGN_KEY)
        }, check.ok ? 200 : 503);
      }
      if (!env.SOVEREIGN_KEY) return cleared("Authentication is not configured.", 503);
      if (!await authorized(request.headers.get("x-sovereign-key"), env.SOVEREIGN_KEY)) {
        return cleared("Unauthorized.", 403);
      }
      if (url.pathname === "/compute" && request.method === "POST") {
        const { success } = await env.COMPUTE_LIMIT.limit({ key: "sovereign-compute" });
        if (!success) return cleared("Compute rate limit exceeded.", 429, { "Retry-After": "60" });
        return await compute(request, env);
      }
      if (url.pathname === "/zero" && request.method === "DELETE") {
        const requestId = url.searchParams.get("key")?.toLowerCase() ?? "";
        if (!requestIdPattern.test(requestId)) return cleared("key must be a compute request UUID.", 400);
        await env.BOX_0_TEMP.delete(tempKey(requestId));
        return json({ box: 0, equation: clearingEquation, status: "CLEARED", request_id: requestId });
      }
      return cleared("Route not found.", 404);
    } catch {
      console.error(JSON.stringify({ event: "gate_request_failed", method: request.method }));
      return cleared("Service unavailable.", 503);
    }
  },
  async scheduled(_controller, env) {
    await purgeExpiredLeases(env.BOX_ONE);
  }
};
export {
  gatekeeper_default as default
};

