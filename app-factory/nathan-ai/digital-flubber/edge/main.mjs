import { cloudSlayerApi } from './cloud-slayer.mjs';
import { files } from './assets.mjs';

const headers = {
  'Content-Security-Policy': "default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self'; connect-src 'self'; manifest-src 'self'; worker-src 'self'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'",
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
};

const routes = new Map([
  ['/api/health', { service: 'SLUBBER', path: '/zones' }],
  ['/api/zones', { service: 'SLUBBER', path: '/zones' }],
  ['/api/permissions', { service: 'SLUBBER', path: '/decision', keys: ['zone', 'action'] }],
  ['/api/sos', { service: 'SOS', path: '/plan', keys: ['scenario'] }]
]);

function secured(response, method) {
  const responseHeaders = new Headers(response.headers);
  for (const [key, value] of Object.entries(headers)) responseHeaders.set(key, value);
  if (!responseHeaders.has('Cache-Control')) responseHeaders.set('Cache-Control', 'no-store');
  return new Response(method === 'HEAD' ? null : response.body, { status: response.status, headers: responseHeaders });
}

async function api(url, env) {
  const route = routes.get(url.pathname);
  if (!route) return Response.json({ error: 'not-found' }, { status: 404 });
  try {
    if (url.pathname === '/api/health') {
      const [policy, sos] = await Promise.all([
        env.SLUBBER.fetch('https://internal/zones'), env.SOS.fetch('https://internal/plan')
      ]);
      const healthy = policy.ok && sos.ok;
      return Response.json({ app: 'digital-flubber', status: healthy ? 'ok' : 'degraded', services: { slubber: policy.ok, sos: sos.ok } }, { status: healthy ? 200 : 503 });
    }
    const target = new URL(route.path, 'https://internal');
    for (const key of route.keys ?? []) {
      const value = url.searchParams.get(key);
      if (value !== null) target.searchParams.set(key, value);
    }
    return await env[route.service].fetch(target.href);
  } catch {
    return Response.json({ error: 'service-unavailable' }, { status: 503 });
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    let response;
    if (!['GET', 'HEAD'].includes(request.method)) {
      response = new Response('Method not allowed', { status: 405, headers: { Allow: 'GET, HEAD' } });
    } else if (url.pathname.startsWith('/api/cloud-slayer/')) {
      response = await cloudSlayerApi(url, env.CLOUD_SLAYER_DB, path => api(new URL(path, url), env));
    } else if (url.pathname.startsWith('/api/')) {
      response = await api(url, env);
    } else if (Object.hasOwn(files, url.pathname)) {
      const { type, value, binary } = files[url.pathname];
      response = new Response(binary ? Uint8Array.from(atob(value), char => char.charCodeAt(0)) : value, {
        headers: { 'Content-Type': type, 'Cache-Control': 'public, max-age=300' }
      });
    } else {
      response = new Response('Page not found', { status: 404 });
    }
    return secured(response, request.method);
  }
};
