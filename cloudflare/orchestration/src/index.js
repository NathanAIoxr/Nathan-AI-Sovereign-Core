export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method !== 'GET' || url.pathname !== '/health') {
      return new Response('Not found', { status: 404 });
    }
    try {
      const result = await env.DB.prepare('SELECT COUNT(*) AS count FROM app_registry').first();
      return Response.json({ status: 'ok', service: 'nathan-ai-orchestration-core', registered_apps: result?.count ?? 0 });
    } catch (_) {
      return Response.json({ status: 'unhealthy', reason: 'database_unavailable' }, { status: 503 });
    }
  }
};
