import { sites, mountRoot, publicOrigin } from './sites.mjs';

export async function dispatchTaborSite(request, platforms) {
  const url = new URL(request.url);
  if (url.origin !== publicOrigin || !url.pathname.startsWith(mountRoot)) return null;
  const id = url.pathname.slice(mountRoot.length).split('/', 1)[0];
  if (!Object.hasOwn(sites, id)) return new Response('Site not found', { status: 404 });
  if (!['GET', 'HEAD', 'POST'].includes(request.method)) return new Response('Method not allowed', {
    status: 405, headers: { allow: 'GET, HEAD, POST' },
  });
  try {
    return await platforms.get(sites[id].name, {}, { limits: { cpuMs: 60, subRequests: 30 } }).fetch(request);
  } catch {
    return new Response('Site temporarily unavailable', { status: 503 });
  }
}
