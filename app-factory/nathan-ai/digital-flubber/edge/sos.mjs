import { incidentPlans } from './policy.mjs';

export default {
  fetch(request) {
    const url = new URL(request.url);
    if (request.method !== 'GET') return new Response(null, { status: 405, headers: { Allow: 'GET' } });
    if (url.pathname !== '/plan') return new Response(null, { status: 404 });
    const scenario = url.searchParams.get('scenario') ?? 'manual-drill';
    if (!Object.hasOwn(incidentPlans, scenario)) return Response.json({ error: 'unknown-scenario' }, { status: 400 });
    return Response.json({ worker: 'sos', scenario, steps: incidentPlans[scenario], scope: 'local-arena' });
  }
};
