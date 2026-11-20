export default {
  async fetch(request, env) {
    if (request.method !== "GET" || new URL(request.url).pathname !== "/health") {
      return new Response(null, { status: 404 });
    }
    try {
      const row = await env.DB.prepare(
        "SELECT project, phase FROM zone_manifest WHERE project = ?"
      ).bind(env.ZONE_PROJECT).first();
      if (row?.phase === "REHEARSAL" && row.project === env.ZONE_PROJECT) {
        return Response.json({ project: row.project, phase: row.phase, release: env.ZONE_RELEASE });
      }
    } catch {
      console.error("Zone manifest check failed");
    }
    return new Response(null, { status: 503 });
  }
};
