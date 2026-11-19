import { authorize, zones } from './policy.mjs';

export default {
  fetch(request) {
    const url = new URL(request.url);
    if (request.method !== 'GET') return new Response(null, { status: 405, headers: { Allow: 'GET' } });
    if (url.pathname === '/zones') return Response.json({ worker: 'slubber', role: 'guest', zones });
    if (url.pathname !== '/decision') return new Response(null, { status: 404 });
    const decision = authorize(url.searchParams.get('zone'), url.searchParams.get('action'));
    return Response.json({ worker: 'slubber', role: 'guest', ...decision }, { status: decision.allowed ? 200 : 403 });
  }
};
