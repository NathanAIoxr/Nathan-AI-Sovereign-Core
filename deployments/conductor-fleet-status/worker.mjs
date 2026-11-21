import original from "./original.mjs";
import conductor from "./status-worker.mjs";
import { captureFleet, publicFleet } from "./fleet-summary.mjs";

export default {
  async fetch(request, env, ctx) {
    const { pathname, hostname } = new URL(request.url);
    if (pathname === "/conductor/fleet" || pathname === "/conductor/fleet-snapshot") {
      if (request.method !== "GET") return new Response("Method not allowed", { status: 405, headers: { allow: "GET" } });
      return publicFleet(env, pathname === "/conductor/fleet");
    }
    if (pathname === "/conductor" || pathname.startsWith("/conductor/")) {
      return conductor.fetch(request, env, ctx);
    }
    if (env.ROLE === "standby" && hostname === "tabor-ext-100-uptime-probe.nathantaboract.workers.dev") {
      return new Response("Not found", { status: 404 });
    }
    return original.fetch(request, env, ctx);
  },
  async scheduled(controller, env, ctx) {
    await Promise.all([conductor.scheduled(controller, env, ctx), captureFleet(env)]);
  },
};
