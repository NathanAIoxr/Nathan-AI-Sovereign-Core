const prefix = '/edge-operations';
const privateHeaders = {
  'cache-control': 'no-store',
  'x-content-type-options': 'nosniff'
};
const probeKey = 'diagnostics/probe.txt';
const imageKey = 'edge-test-pattern.png';
const encoder = new TextEncoder();

function json(body, status = 200, headers = {}) {
  return Response.json(body, { status, headers: { ...privateHeaders, ...headers } });
}

async function health(request, env) {
  const signature = request.headers.get('x-tabor-edge-health');
  if (!signature || !/^[a-f0-9]{64}$/.test(signature)) {
    return json({ error: 'Bridge authentication required' }, 403);
  }

  const time = request.headers.get('x-tabor-edge-time');
  if (!/^\d{13}$/.test(time || '') || Math.abs(Date.now() - Number(time)) > 30_000) {
    return json({ error: 'Bridge authentication expired' }, 403);
  }
  const secret = await env.EDGE_HEALTH_KEY.get();
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']);
  const valid = await crypto.subtle.verify('HMAC', key,
    Uint8Array.from(signature.match(/../g), byte => Number.parseInt(byte, 16)), encoder.encode('edge-health:' + time));
  if (!valid) return json({ error: 'Bridge authentication required' }, 403);

  const checks = await Promise.allSettled([
    env.REGISTRY.prepare('SELECT EXISTS(SELECT 1 FROM owned_runtime_registry LIMIT 1) AS ready').first(),
    env.PRIVATE_R2.head(probeKey),
    env.FLEET.fetch('https://fleet.internal/health')
  ]);
  const bindings = {
    d1Registry: checks[0].status === 'fulfilled' && checks[0].value?.ready === 1,
    privateR2: checks[1].status === 'fulfilled' && Boolean(checks[1].value),
    fleetService: checks[2].status === 'fulfilled' && checks[2].value.ok,
    secretsStore: true
  };
  if (checks[2].status === 'fulfilled') await checks[2].value.body?.cancel();
  const ok = Object.values(bindings).every(Boolean);
  console.info({ action: 'edge_health', ok, ...bindings });
  return json({ ok, bindings }, ok ? 200 : 503);
}

async function image(request, env) {
  const url = new URL(request.url);
  const width = url.searchParams.get('width') ?? '320';
  const format = url.searchParams.get('format') ?? 'webp';
  if (!['160', '320', '640'].includes(width) || !['avif', 'webp'].includes(format)) {
    return json({ error: 'Use width 160, 320, or 640 and format webp or avif.' }, 400);
  }

  const source = await env.PUBLIC_R2.get(imageKey);
  if (!source) return json({ error: 'Image sample unavailable' }, 503);
  const transformed = await env.IMAGES.input(source.body)
    .transform({ width: Number(width), fit: 'scale-down' })
    .output({ format: 'image/' + format, quality: 82 });
  return new Response(transformed.response().body, {
    headers: {
      'content-type': 'image/' + format,
      'cache-control': 'public, max-age=3600',
      'x-content-type-options': 'nosniff',
      'x-tabor-cache': 'MISS'
    }
  });
}

function page(env) {
  const token = /^[a-f0-9]{32}$/i.test(env.RUM_SITE_TOKEN ?? '') ? env.RUM_SITE_TOKEN : '';
  const analytics = token ? `<script defer src="https://static.cloudflareinsights.com/beacon.min.js" data-cf-beacon='{"token":"${token}"}'></script>` : '';
  const publicBucketUrl = /^https:\/\/pub-[a-f0-9]{32}\.r2\.dev$/.test(env.PUBLIC_BUCKET_URL ?? '')
    ? env.PUBLIC_BUCKET_URL : '';
  return new Response(`<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Tabor Edge Operations</title>
<style>
:root{color-scheme:dark;font-family:system-ui,sans-serif;background:#10171b;color:#eaf4f3}
body{margin:0 auto;max-width:65rem;padding:clamp(1.25rem,6vw,4rem);line-height:1.5}
header{border-bottom:1px solid #3a5558;padding-bottom:1rem;margin-bottom:1.5rem}
h1{font-size:clamp(2rem,6vw,3.75rem);line-height:1.1;margin:.3rem 0}h2{margin:0 0 .75rem;font-size:1.25rem}
p{color:#bdd0ce;margin:.5rem 0 1rem}a{color:#83e6d4;text-underline-offset:.23em}
a:focus-visible{outline:2px solid #f9ecae;outline-offset:4px}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,17rem),1fr));gap:1rem}
section{background:#192528;border:1px solid #375253;border-radius:.75rem;padding:1.1rem}
ul{margin:0;padding-left:1.15rem}li+li{margin-top:.55rem}img{max-width:100%;height:auto;border-radius:.35rem}
footer{margin-top:1.5rem}
</style>${analytics}</head><body>
<header><p>Nathan AI</p><h1>Tabor Edge Operations</h1><p>Cloudflare diagnostics, fleet health, and mobile operations.</p></header>
<main class="grid">
<section><h2>Edge diagnostics</h2><ul><li><a href="/cdn-cgi/trace">Cloudflare trace</a></li>
<li><a href="${prefix}/api/diagnostics">My request location and connection</a></li></ul></section>
<section><h2>Fleet and storage</h2><ul><li><a href="${prefix}/api/health">Check D1, R2, Service Binding and Secrets Store</a></li>
<li><a href="/worker-registry/">Worker registry</a></li>
${publicBucketUrl ? `<li><a href="${publicBucketUrl}/${imageKey}">Public R2 sample</a></li>` : ''}</ul></section>
<section><h2>Image transformations</h2><img width="320" height="160" src="${prefix}/image?width=320&amp;format=webp" alt="Teal and white calibration pattern">
<ul><li><a href="${prefix}/image?width=640&amp;format=avif">640 px AVIF</a></li></ul></section>
<section><h2>From your phone</h2><ul><li><a href="https://getclouder.app/features">Clouder Pro controls</a></li>
<li><a href="https://github.com/NathanAIoxr/Nathan-AI-Sovereign-Core/tree/main/app-factory/nathan-ai/edge-operations">GitHub source and operator commands</a></li>
<li><a href="https://www.cloudflarestatus.com/">Cloudflare incidents</a></li></ul></section>
</main></body></html>`, {
    headers: {
      ...privateHeaders,
      'content-type': 'text/html; charset=utf-8',
      'referrer-policy': 'no-referrer',
      'content-security-policy': "default-src 'none'; img-src 'self'; style-src 'unsafe-inline'; script-src https://static.cloudflareinsights.com/beacon.min.js; connect-src https://cloudflareinsights.com 'self'; base-uri 'none'; frame-ancestors 'none'"
    }
  });
}

export default {
  async fetch(request, env) {
    if (request.method !== 'GET') return json({ error: 'GET required' }, 405, { allow: 'GET' });
    try {
      switch (new URL(request.url).pathname) {
        case '/':
          return page(env);
        case '/api/health':
          return await health(request, env);
        case '/image':
          return await image(request, env);
        default:
          return json({ error: 'Not found' }, 404);
      }
    } catch {
      console.error({ action: 'edge_operations_request_failed' });
      return json({ error: 'Edge operation temporarily unavailable' }, 503);
    }
  }
};
