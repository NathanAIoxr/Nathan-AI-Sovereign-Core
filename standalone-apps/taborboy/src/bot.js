import appWorker from "./index.js";

const id = "taborboy";
const worker = "taborboy-worker";
const version = "2026-11-19.2";
const appUrl = "https://taborboy.pages.dev/app/";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.hostname !== "station.internal") return new Response(null,{status:404});
    if (url.pathname === "/__hub/refresh" && request.method === "POST") {
      try {
        await appWorker.scheduled({},env);
        return Response.json({id,worker,version,verified:true});
      } catch (error) {
        console.error(id + " archive verification failed",error.message);
        return Response.json({id,worker,version,verified:false},{status:503});
      }
    }
    if (!["GET","HEAD"].includes(request.method)) return new Response(null,{status:405});
    const base = "/work/" + id;
    const path = url.pathname.startsWith(base + "/") ? url.pathname.slice(base.length) : url.pathname;
    if (path === "/" || path === "/app" || path === "/app/") return Response.redirect(appUrl,302);
    if (path !== "/healthz") return new Response(null,{status:404});
    const health = await appWorker.fetch(new Request("https://station.internal/health"),env);
    const payload = health.ok ? await health.json() : {};
    const ready = health.ok && payload.entity === id.toUpperCase();
    const headers = {"cache-control":"no-store","content-type":"application/json"};
    const body = {id,worker,version,ready,last_verified_at:payload.last_verified_at ?? null};
    return new Response(request.method === "HEAD" ? null : JSON.stringify(body),{status:ready ? 200 : 503,headers});
  },
};
