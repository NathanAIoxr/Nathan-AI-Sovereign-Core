export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method !== 'GET') return new Response('Not found', { status: 404 });
    try {
      if (url.pathname === '/health') {
        const result = await env.DB.prepare('SELECT COUNT(*) AS count FROM app_registry').first();
        return Response.json({ status: 'ok', service: 'nathan-ai-orchestration-core', registered_apps: result?.count ?? 0 });
      }
      if (url.pathname === '/fleet/status') {
        const result = await env.FLEET_DB.prepare(`SELECT
          (SELECT COUNT(*) FROM fleet_entry) AS fleet_entries,
          (SELECT COUNT(*) FROM owned_runtime_registry) AS owned_runtimes,
          (SELECT COUNT(*) FROM virtual_app_v1) AS virtual_apps`).first();
        return Response.json({ status: 'ok', registry: 'tabor-fleet-registry', ...result, note: 'Logical records do not increase Cloudflare deployed Worker script limits.' });
      }
    } catch (_) {
      return Response.json({ status: 'unhealthy', reason: 'database_unavailable' }, { status: 503 });
    }
    return new Response('Not found', { status: 404 });
  }
};
