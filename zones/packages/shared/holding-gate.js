import { MAX_ARTIFACT_BYTES, storeArtifact } from '../provenance-ledger/index.js';
import { ingestTelemetry, ingestVoice, readBody, readObject } from '../voice-telemetry/index.js';
import { switchboard } from '../nervous-system/switchboard.js';
import { stagingPreview } from '../../staging/preview.js';

const securityHeaders = {
  'Cache-Control': 'no-store',
  'X-Content-Type-Options': 'nosniff',
  'X-Robots-Tag': 'noindex, nofollow',
  'Referrer-Policy': 'no-referrer',
  'Content-Security-Policy': "default-src 'none'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; connect-src 'self'; media-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'",
};

function response(request, body, status, headers = {}) {
  return new Response(request.method === 'HEAD' ? null : body, {
    status, headers: { ...securityHeaders, ...headers },
  });
}

function escapeHtml(text) {
  return text.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
}

function base64url(part) {
  if (!/^[\w-]+$/.test(part)) throw new Error('Invalid token');
  return Uint8Array.from(atob(part.replaceAll('-', '+').replaceAll('_', '/')), c => c.charCodeAt(0));
}

const decoder = new TextDecoder();
const encoder = new TextEncoder();
const readToken = text => JSON.parse(decoder.decode(base64url(text)));

export async function hasPreviewAccess(request, issuer, audience, fetchKeys = fetch) {
  const token = request.headers.get('Cf-Access-Jwt-Assertion');
  if (!token || token.length > 8192 || !/^[a-f0-9]{64}$/.test(audience ?? '') ||
      !/^https:\/\/[a-z0-9-]+\.cloudflareaccess\.com$/.test(issuer ?? '')) return false;
  const parts = token.split('.');
  if (parts.length !== 3) return false;
  try {
    const [encodedHeader, encodedClaims, encodedSignature] = parts;
    const header = readToken(encodedHeader);
    const claims = readToken(encodedClaims);
    const now = Math.floor(Date.now() / 1000);
    if (header.alg !== 'RS256' || typeof header.kid !== 'string' || claims.iss !== issuer ||
        !Array.isArray(claims.aud) || !claims.aud.includes(audience) ||
        !Number.isFinite(claims.exp) || claims.exp <= now ||
        (claims.nbf !== undefined && (!Number.isFinite(claims.nbf) || claims.nbf > now))) return false;

    const endpoint = new URL('/cdn-cgi/access/certs', issuer);
    const result = await fetchKeys(endpoint, { redirect: 'error', signal: AbortSignal.timeout(4000) });
    if (!result.ok) return false;
    const { keys } = await result.json();
    const jwk = Array.isArray(keys) && keys.find(key => key.kid === header.kid && key.kty === 'RSA');
    if (!jwk) return false;
    const key = await crypto.subtle.importKey('jwk', jwk, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']);
    return await crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, base64url(encodedSignature), encoder.encode(encodedHeader + '.' + encodedClaims));
  } catch {
    return false;
  }
}

const contentTypes = new Map([
  ['html', 'text/html; charset=utf-8'], ['css', 'text/css; charset=utf-8'],
  ['js', 'text/javascript; charset=utf-8'], ['mjs', 'text/javascript; charset=utf-8'],
  ['json', 'application/json; charset=utf-8'], ['webmanifest', 'application/manifest+json'],
  ['md', 'text/plain; charset=utf-8'], ['txt', 'text/plain; charset=utf-8'],
  ['webp', 'image/webp'], ['png', 'image/png'], ['jpg', 'image/jpeg'], ['jpeg', 'image/jpeg'],
  ['mp3', 'audio/mpeg'], ['mp4', 'video/mp4'],
  ['pdf', 'application/pdf'], ['epub', 'application/epub+zip'], ['wasm', 'application/wasm'],
]);

function assetPath(pathname, entry) {
  const requested = pathname === '/' ? entry : pathname.slice(1);
  if (typeof requested !== 'string' || requested.length > 500) return null;
  const parts = requested.split('/');
  if (parts.some(part => !/^[a-zA-Z0-9_-][a-zA-Z0-9_.-]*$/.test(part))) return null;
  return requested;
}

async function holdingPage(request, env) {
  let caption = 'This project is being prepared for launch.';
  try {
    caption = (await env.HOLDING_CONFIG.get('holding-caption'))?.slice(0, 160) || caption;
  } catch {
    // The default message works without KV.
  }
  const markup = '<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<title>Coming soon</title><style>body{margin:12vh auto;padding:1.5rem;max-width:38rem;background:#23131b;color:#fae7ce;font:1.1rem/1.5 system-ui}h1{font:3rem Georgia,serif}</style>' +
    '<main><h1>Coming soon</h1><p>' + escapeHtml(caption) + '</p></main></html>';
  return response(request, markup, 200, { 'Content-Type': 'text/html; charset=utf-8' });
}

const privatePaths = new Map([
  ['/sovereign/artifacts', 'POST'],
  ['/sovereign/telemetry', 'POST'],
  ['/sovereign/voice', 'POST'],
  ['/sovereign/mcp', 'POST'],
  ['/sovereign/node/claim', 'POST'],
  ['/sovereign/node/release', 'POST'],
  ['/sovereign/node/socket', 'GET'],
]);

function json(request, value, status = 200) {
  return response(request, JSON.stringify(value), status, { 'Content-Type': 'application/json; charset=utf-8' });
}

async function privateOperation(request, env, url, project) {
  const origin = request.headers.get('Origin');
  if (origin && origin !== url.origin) return response(request, 'Forbidden', 403);
  const route = url.pathname.slice('/sovereign/'.length);
  if (route === 'artifacts') {
    const bytes = await readBody(request, MAX_ARTIFACT_BYTES);
    return json(request, await storeArtifact(env, project.project_id, bytes), 201);
  }
  if (route === 'mcp') {
    const result = await switchboard(await readObject(request), project, env);
    return result ? json(request, result) : response(request, null, 202);
  }
  if (route === 'telemetry' || route === 'voice') {
    const data = route === 'telemetry' ? await ingestTelemetry(request, env, project.project_id) :
      await ingestVoice(request, env, project.project_id);
    return json(request, data, data.conflict ? 409 : 201);
  }

  const stub = env.NODES.getByName(project.project_id);
  const target = 'https://sovereign-node/' + route.slice('node/'.length);
  if (request.method === 'GET') return stub.fetch(new Request(target, { headers: request.headers }));
  const body = await readObject(request, 4096);
  return stub.fetch(new Request(target, { method: 'POST', body: JSON.stringify(body) }));
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    try {
      const staging = await stagingPreview(request, env, response);
      if (staging) return staging;
      const action = privatePaths.get(url.pathname);
      const method = request.method;
      if (method !== 'GET' && method !== 'HEAD' && method !== action) {
        return response(request, 'Method not allowed', 405, { Allow: action ?? 'GET, HEAD' });
      }

      const project = await env.ZONES.prepare(
        'SELECT project_id, zone_status, launch_status, access_audience, build_key, entry_key FROM zones_registry WHERE hostname = ?'
      ).bind(url.hostname).first();
      if (!project || project.zone_status !== 'ACTIVE') return response(request, 'Not found', 404);

      const live = project.launch_status === 'LIVE' &&
        await env.HOLDING_CONFIG.get('FLEET_STATUS') !== 'HOLDING' &&
        await env.HOLDING_CONFIG.get('ZONE_STATUS:' + url.hostname) !== 'HOLDING';
      if (action) {
        if (method !== action) return response(request, 'Method not allowed', 405, { Allow: action });
        if (!await hasPreviewAccess(request, env.ACCESS_ISSUER, project.access_audience)) {
          return response(request, 'Not found', 404);
        }
        return await privateOperation(request, env, url, { ...project, live });
      }
      if (!live && !await hasPreviewAccess(request, env.ACCESS_ISSUER, project.access_audience)) {
        return url.pathname === '/' ? holdingPage(request, env) : response(request, 'Not found', 404);
      }
      const key = assetPath(url.pathname, project.entry_key);
      const mime = key && contentTypes.get(key.split('.').at(-1).toLowerCase());
      if (!mime || !project.build_key) return response(request, 'Not found', 404);
      const objectKey = 'projects/' + project.project_id + '/' + project.build_key + '/' + key;
      const asset = method === 'HEAD' ? await env.STAGING.head(objectKey) : await env.STAGING.get(objectKey);
      if (!asset) return response(request, 'Not found', 404);
      const headers = { 'Content-Type': mime, 'Content-Length': String(asset.size) };
      const served = response(request, method === 'HEAD' ? null : asset.body, 200, headers);
      if (live) served.headers.delete('X-Robots-Tag');
      return served;
    } catch (error) {
      if (error instanceof RangeError) return response(request, 'Payload too large', 413);
      if (error instanceof SyntaxError) return response(request, 'Invalid request body', 400);
      return response(request, 'Temporarily unavailable', 503);
    }
  }
};
