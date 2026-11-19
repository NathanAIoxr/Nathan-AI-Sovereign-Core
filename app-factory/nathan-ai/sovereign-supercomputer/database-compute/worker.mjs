import { DurableObject } from "cloudflare:workers";

const SQL = "SELECT 1 AS ok";
export class ComputeContainer extends DurableObject {
  async fetch(request) {
    if (request.method !== "POST" || new URL(request.url).pathname !== "/probe") return new Response(null, { status: 404 });
    return this.ctx.blockConcurrencyWhile(async () => {
      const container = this.ctx.container;
      if (!container) return Response.json({ error: "compute pool not configured" }, { status: 503 });
      try {
        if (!container.running) container.start({ enableInternet: false });
        for (let attempt = 0; attempt < 16; attempt++) {
          try {
            const response = await container.getTcpPort(8080).fetch("http://container/probe", {
              signal: AbortSignal.timeout(1000),
            });
            return Response.json(await response.json(), { status: response.status });
          } catch {
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        }
        return Response.json({ error: "compute container unavailable" }, { status: 503 });
      } finally {
        if (container.running) await container.destroy();
      }
    });
  }
}
export class HighCapacityContainer extends ComputeContainer {}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === "GET" && url.pathname === "/healthz") {
      return Response.json({ status: "ok", databases: Object.keys(env.DATABASES).length, placementsPerDatabase: 4 });
    }
    if (request.method !== "POST" || url.pathname !== "/probe") return new Response(null, { status: 404 });
    const db = url.searchParams.get("db");
    const slot = url.searchParams.get("slot");
    if (!Object.hasOwn(env.DATABASES, db) || !["compute-1","compute-2","higher-1","higher-2"].includes(slot)) {
      return Response.json({ error: "unknown placement" }, { status: 400 });
    }
    const check = await env[env.DATABASES[db]].prepare(SQL).first("ok");
    if (check !== 1) return Response.json({ error: "database readiness failed" }, { status: 503 });
    const pool = slot.startsWith("compute") ? env.COMPUTE : env.HIGHER;
    const target = pool.getByName(db + "/" + slot);
    return target.fetch("http://internal/probe", { method: "POST" });
  }
};
