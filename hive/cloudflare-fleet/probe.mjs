import {OWNER_SUFFIX} from './fleet-plan.mjs';

const CONTENT_TYPES = {html: 'text/html', json: 'application/json'};
const ACCESS_RESPONSES = {
  'nathan-tabor-library': 'Owner sign-in required.',
  'tabor-one': 'Sign in through Cloudflare Access.',
};

async function readPrefix(body) {
  if (!body) return '';
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let remaining = 8192;
  let text = '';
  try {
    while (remaining > 0) {
      const {value, done} = await reader.read();
      if (done) break;
      text += decoder.decode(value.subarray(0, remaining), {stream: true});
      remaining -= value.byteLength;
      if (/<\/title\s*>/i.test(text)) break;
    }
    return text + decoder.decode();
  } finally {
    await reader.cancel().catch(() => {});
    reader.releaseLock();
  }
}

function isAccessLogin(response, service) {
  const location = response.headers.get('Location');
  if (response.status !== 302 || !location?.startsWith('https://')) return false;
  const url = new URL(location);
  return url.hostname === 'nathantaboract.cloudflareaccess.com'
    && url.pathname === `/cdn-cgi/access/login/${service}${OWNER_SUFFIX}`;
}

export async function probe(workload, target, contract, now = Date.now()) {
  const started = Date.now();
  const result = (outcome, status, reason) => ({outcome, status, reason, latencyMs: Date.now() - started});
  try {
    if (!target) return result('failed', null, 'missing_binding');
    if (workload.contractType === 'handoff') {
      const receipt = await target.prepare('SELECT max(scheduled_at) AS ran FROM repair_handoff_runs').first();
      const age = now - Number(receipt?.ran) * 1000;
      return receipt?.ran && age >= -60_000 && age <= 10 * 60_000
        ? result('healthy', null, 'fresh_receipt')
        : result('failed', null, 'stale_receipt');
    }

    const path = contract ? workload.contractPath : workload.path;
    const origin = workload.origin ?? `https://${workload.service}${OWNER_SUFFIX}`;
    const response = await target.fetch(new Request(`${origin}${path}`, {
      redirect: 'manual', signal: AbortSignal.timeout(4500),
    }));
    const {status, body} = response;
    if (workload.contractType === 'private' && status === 404) {
      if (contract && (await readPrefix(body)).trim() !== 'Private runner') {
        return result('failed', status, 'unexpected_private_response');
      }
      if (!contract) await body?.cancel().catch(() => {});
      return result('protected', status, 'private_route');
    }

    const expectedAccessResponse = ACCESS_RESPONSES[workload.service];
    if (expectedAccessResponse && isAccessLogin(response, workload.service)) {
      await body?.cancel().catch(() => {});
      return result('protected', status, 'access_login');
    }
    if (expectedAccessResponse && status === 401) {
      const protectedRoute = (await readPrefix(body)).includes(expectedAccessResponse);
      return result(protectedRoute ? 'protected' : 'failed', status,
        protectedRoute ? 'owner_sign_in_required' : 'unexpected_auth_response');
    }
    if (workload.contractType === 'private' || !response.ok) {
      await body?.cancel().catch(() => {});
      return result('failed', status, 'unexpected_status');
    }
    const type = response.headers.get('Content-Type')?.split(';')[0].trim().toLowerCase();
    if (contract && CONTENT_TYPES[workload.contractType] !== type) {
      await body?.cancel().catch(() => {});
      return result('failed', status, 'unexpected_content_type');
    }
    if (contract && workload.contractType === 'html') {
      return /<title(?:\s+[^>]+)?>\s*[^<]+<\/title\s*>/i.test(await readPrefix(body))
        ? result('healthy', status, 'page_contract')
        : result('failed', status, 'missing_page_title');
    }
    await body?.cancel().catch(() => {});
    return result('healthy', status, contract ? 'content_type_contract' : 'route_available');
  } catch {
    return result('failed', null, 'request_failed');
  }
}
