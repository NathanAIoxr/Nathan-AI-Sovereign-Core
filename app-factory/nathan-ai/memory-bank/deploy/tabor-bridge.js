const mount = '/memory-bank';
const memoryWorker = 'nathan-ai-memory-bank';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === mount) {
      url.pathname = mount + '/';
      return Response.redirect(url, 308);
    }
    if (url.pathname.startsWith(mount + '/')) {
      url.pathname = url.pathname.slice(mount.length);
      try {
        return await env.MEMORY_PLATFORM.get(memoryWorker).fetch(new Request(url, request));
      } catch {
        return Response.json({ error: 'The Memory Bank is temporarily unavailable.' }, {
          status: 503,
          headers: { 'Cache-Control': 'no-store' }
        });
      }
    }
    console.info({ message: 'Hello World Worker received a request!' });
    return new Response('Hello World!');
  }
};
