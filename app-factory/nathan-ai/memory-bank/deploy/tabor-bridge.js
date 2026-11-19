const mounts = new Map([
  ['/memory-bank', 'nathan-ai-memory-bank'],
  ['/worker-registry', 'nathan-ai-worker-registry']
]);

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const mount = '/' + url.pathname.split('/')[1];
    if (mounts.has(mount) && url.pathname === mount) {
      url.pathname = mount + '/';
      return Response.redirect(url, 308);
    }
    if (mounts.has(mount)) {
      url.pathname = url.pathname.slice(mount.length);
      try {
        return await env.MEMORY_PLATFORM.get(mounts.get(mount)).fetch(new Request(url, request));
      } catch {
        return Response.json({ error: 'The requested app is temporarily unavailable.' }, {
          status: 503,
          headers: { 'Cache-Control': 'no-store' }
        });
      }
    }
    console.info({ message: 'Hello World Worker received a request!' });
    return new Response('Hello World!');
  }
};
