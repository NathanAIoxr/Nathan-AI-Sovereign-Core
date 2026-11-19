const mounts = new Map([
  ['/memory-bank', 'nathan-ai-memory-bank'],
  ['/worker-registry', 'nathan-ai-worker-registry'],
  ['/global-bounties', 'nathan-ai-bounties-db'],
  ['/edge-operations', 'tabor-edge-operations']
]);

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const mount = '/' + url.pathname.split('/')[1];
    if (mounts.has(mount) && url.pathname === mount) {
      url.pathname = mount + '/';
      return Response.redirect(url, 308);
    }
    if (url.pathname === '/edge-operations/api/diagnostics' && request.method === 'GET') {
      const cf = request.cf ?? {};
      return Response.json({
        colo: cf.colo ?? null,
        protocol: cf.httpProtocol ?? null,
        tls: cf.tlsVersion ?? null,
        country: cf.country ?? null,
        region: cf.region ?? null,
        city: cf.city ?? null,
        postalCode: cf.postalCode ?? null,
        latitude: cf.latitude ?? null,
        longitude: cf.longitude ?? null,
        asn: cf.asn ?? null,
        network: cf.asOrganization ?? null
      }, { headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } });
    }
    if (mounts.has(mount)) {
      url.pathname = url.pathname.slice(mount.length);
      try {
        const target = env.MEMORY_PLATFORM.get(mounts.get(mount));
        if (mount === '/edge-operations' && url.pathname === '/api/health' && request.method === 'GET') {
          const encoder = new TextEncoder();
          const secret = await env.EDGE_HEALTH_KEY.get();
          const key = await crypto.subtle.importKey('raw', encoder.encode(secret),
            { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
          const time = String(Date.now());
          const signature = await crypto.subtle.sign('HMAC', key, encoder.encode('edge-health:' + time));
          const forwarded = new Request(url, request);
          forwarded.headers.set('x-tabor-edge-time', time);
          forwarded.headers.set('x-tabor-edge-health', Array.from(new Uint8Array(signature), byte => byte.toString(16).padStart(2, '0')).join(''));
          return await target.fetch(forwarded);
        }
        if (mount === '/edge-operations' && url.pathname === '/image' && request.method === 'GET') {
          const cache = globalThis.caches?.default;
          if (cache && ctx) {
            const cacheUrl = new URL(request.url);
            cacheUrl.search = new URLSearchParams({
              width: cacheUrl.searchParams.get('width') ?? '320',
              format: cacheUrl.searchParams.get('format') ?? 'webp',
              version: '1'
            });
            const cacheKey = new Request(cacheUrl);
            const hit = await cache.match(cacheKey).catch(() => undefined);
            if (hit) {
              const response = new Response(hit.body, hit);
              response.headers.set('X-Tabor-Cache', 'HIT');
              return response;
            }
            const response = await target.fetch(new Request(url, request));
            if (response.ok && response.headers.get('Content-Type')?.startsWith('image/')) {
              ctx.waitUntil(cache.put(cacheKey, response.clone()).catch(() => {}));
            }
            return response;
          }
        }
        return await target.fetch(new Request(url, request));
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
