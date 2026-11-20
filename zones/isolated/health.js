export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const headers = { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow' };
    if (url.hostname !== env.STAGING_ALIAS || url.pathname !== '/health' || request.method !== 'GET') {
      return new Response(null, { status: 404, headers });
    }
    const [project, mode, manifest] = await Promise.all([
      env.ZONE_DB.prepare('SELECT project_id, launch_status FROM zones_registry WHERE project_id = ?')
        .bind(env.PROJECT_ID).first(),
      env.ZONE_CONFIG.get('launch-mode'),
      env.ZONE_ASSETS.get('staging/zone.json'),
    ]);
    const identity = manifest && await manifest.json();
    const ready = project?.project_id === env.PROJECT_ID && project.launch_status === 'HOLDING' &&
      mode === 'HOLDING' && identity?.projectId === env.PROJECT_ID && identity?.alias === env.STAGING_ALIAS &&
      identity?.mode === 'HOLDING' && Boolean(env.ZONE_JOBS && env.ZONE_STATE);
    return Response.json({ projectId: env.PROJECT_ID, mode: 'HOLDING', ready }, {
      status: ready ? 200 : 503, headers,
    });
  },
};
