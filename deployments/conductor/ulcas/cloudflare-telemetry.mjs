// Wrap a registered origin handler. Telemetry never substitutes for its response.
export function withUlcasTelemetry(origin) {
  return async (request, env, ctx) => {
    const start = Date.now();
    const response = await origin(request, env, ctx);
    const rate = Number(env.ULCAS_SAMPLE_RATE ?? "0.01");
    const colo = request.cf?.colo;
    if (env.ULCAS_EDGE_TOKEN && env.ULCAS_EDGE_INGRESS &&
        /^[A-Z]{3}$/.test(colo ?? "") && rate > 0 && rate <= 1 && Math.random() < rate) {
      const headers = {
        authorization: `Bearer ${env.ULCAS_EDGE_TOKEN}`,
        "content-type": "application/json",
      };
      if (env.ULCAS_ACCESS_ID && env.ULCAS_ACCESS_SECRET) {
        headers["CF-Access-Client-Id"] = env.ULCAS_ACCESS_ID;
        headers["CF-Access-Client-Secret"] = env.ULCAS_ACCESS_SECRET;
      }
      const event = {
        event_id: crypto.randomUUID(),
        data: { colo, status: response.status, duration_ms: Date.now() - start },
      };
      ctx.waitUntil(fetch(env.ULCAS_EDGE_INGRESS, {
        method: "POST", headers, body: JSON.stringify(event), redirect: "error",
        signal: AbortSignal.timeout(5000),
      }).then(async result => {
        await result.body?.cancel();
        if (!result.ok) console.error("ULCAS telemetry rejected", result.status);
      }).catch(() => console.error("ULCAS telemetry delivery failed")));
    }
    return response;
  };
}
