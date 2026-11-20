const headers = {
  "cache-control": "no-store",
  "x-robots-tag": "noindex, nofollow",
  "x-content-type-options": "nosniff",
  "referrer-policy": "no-referrer",
  "content-security-policy": "default-src 'none'; script-src 'self'; style-src 'self'; form-action 'none'; frame-ancestors 'none'; base-uri 'none'"
};

const files = {
  "/": ["index.html", "text/html; charset=utf-8"],
  "/app.css": ["app.css", "text/css; charset=utf-8"],
  "/app.js": ["app.js", "text/javascript; charset=utf-8"]
};

export class ZoneState {
  constructor(state) {
    this.state = state;
  }

  async fetch(request) {
    if (request.method !== "GET" || new URL(request.url).pathname !== "/health") {
      return new Response(null, {status: 404});
    }
    return Response.json({storageReady: (await this.state.storage.get("staging-disabled")) !== true});
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.hostname !== env.STAGING_ALIAS || !["GET","HEAD"].includes(request.method)) {
      return new Response(null, {status: 404, headers});
    }

    const row = await env.ZONE_DB.prepare(
      "SELECT project_id, launch_status FROM staged_app WHERE project_id = ?"
    ).bind(env.PROJECT_ID).first();
    const mode = await env.ZONE_CONFIG.get("launch-mode");
    if (mode !== "HOLDING" || row?.launch_status !== "HOLDING") {
      return new Response(null, {status: 404, headers});
    }

    if (url.pathname === "/health") {
      const entry = await env.ZONE_ASSETS.get("staging/zone-app.json");
      const marker = entry && await entry.json();
      const state = env.ZONE_STATE.get(env.ZONE_STATE.idFromName(env.PROJECT_ID));
      const response = await state.fetch("https://zone-state.invalid/health");
      const storage = response.ok && await response.json();
      const ready = marker?.projectId === env.PROJECT_ID &&
        marker.alias === env.STAGING_ALIAS && storage?.storageReady === true && Boolean(env.ZONE_JOBS);
      if (request.method === "HEAD") return new Response(null, {status: ready ? 200 : 503, headers});
      return Response.json({projectId: env.PROJECT_ID, mode, ready}, {status: ready ? 200 : 503, headers});
    }

    const asset = Object.hasOwn(files,url.pathname) && files[url.pathname];
    if (!asset) return new Response(null, {status: 404, headers});

    const object = request.method === "HEAD" ?
      await env.ZONE_ASSETS.head("staging/web/" + asset[0]) :
      await env.ZONE_ASSETS.get("staging/web/" + asset[0]);
    if (!object) return new Response(null, {status: 404, headers});
    return new Response(request.method === "HEAD" ? null : object.body, {
      headers: {...headers, "content-type": asset[1]}
    });
  }
};
