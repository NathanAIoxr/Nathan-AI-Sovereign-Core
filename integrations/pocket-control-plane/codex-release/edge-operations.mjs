import { escape, page } from './station.mjs';

const edgeHubOrigin = 'https://one-sovereign-hub.nathantaboract.workers.dev';
const edgeRunbook = 'https://github.com/NathanAIoxr/Nathan-AI-Sovereign-Core/blob/main/integrations/pocket-control-plane/codex-release/edge-operations.md';

export async function readEdgeOperations(request, env) {
  const { colo, httpProtocol, tlsVersion } = request.cf ?? {};
  const edge = {
    colo: typeof colo === 'string' ? colo : null,
    protocol: typeof httpProtocol === 'string' ? httpProtocol : null,
    tls: typeof tlsVersion === 'string' ? tlsVersion : null,
  };
  let ready = false;
  if (env.ONE_HUB && request.method === 'GET') {
    try {
      const response = await env.ONE_HUB.fetch(new Request(edgeHubOrigin + '/health', { redirect: 'error' }));
      ready = response.ok && (await response.json()).service === 'one-sovereign-hub';
    } catch {
      // A failed health check remains visible as unavailable.
    }
  }
  return { edge, service: { name: 'one-sovereign-hub', ready } };
}

export function edgeOperationsPage(nav, { edge, service }) {
  const show = value => escape(value ?? 'Unavailable');
  return page('Cloudflare Edge Operations', 'Nathan AI · Pocket Control', nav + `
    <section><h2>Live diagnostics</h2>
      <dl><dt>Cloudflare data center</dt><dd>${show(edge.colo)}</dd>
        <dt>HTTP protocol</dt><dd>${show(edge.protocol)}</dd>
        <dt>TLS</dt><dd>${show(edge.tls)}</dd>
        <dt>ONE Hub service binding</dt><dd>${service.ready ? 'Ready' : 'Unavailable'}</dd></dl>
      <p>The diagnostic view displays three fields from the current request. Cloudflare’s raw trace includes your IP address.</p>
      <div class="actions"><a href="/edge-operations">Refresh</a><a href="/cdn-cgi/trace">Open raw trace</a><a href="/api/edge-operations">Read status JSON</a></div>
    </section>
    <section><h2>Operate from your phone</h2>
      <ol><li>Open Clouder Pro and select the Cloudflare account used for the Tabor projects. Use an on-device Cloudflare API token scoped to the account, resource, and action.</li>
        <li>In Workers and Pages, tail <code>nathan-ai-pocket-codex</code> or review the independent TABORBOY and TABORPOOL deployments.</li>
        <li>In D1, start with a read query for the selected magazine database. In R2, open the matching bucket for objects and transfers.</li>
        <li>On iPhone or iPad, set up the Clouder Agent and its optional OpenAI key inside Clouder. Approve writes in the native app. Clouder delivers incident alerts and Lock Screen Live Activities when configured.</li></ol>
      <p><a href="https://getclouder.app/features">Clouder features</a> · <a href="https://apps.apple.com/us/app/clouder-for-cloudflare/id6755757771">Open Clouder in the App Store</a> · <a href="https://dash.cloudflare.com/">Cloudflare dashboard</a></p>
    </section>
    <section><h2>Storage, performance, and recovery</h2>
      <ul>
        <li><strong>D1 Time Travel.</strong> Look up a bookmark for the individual database before a migration or recovery. <a href="https://developers.cloudflare.com/d1/reference/time-travel/">Recovery instructions</a></li>
        <li><strong>R2 transfers.</strong> Use the intended bucket and a short-lived S3 presigned URL when sharing a private object or receiving a direct upload. <a href="https://developers.cloudflare.com/r2/api/s3/presigned-urls/">Presigned URLs</a></li>
        <li><strong>Secrets Store.</strong> Bind a named account secret for a specific Worker when the service requires it. <a href="https://developers.cloudflare.com/secrets-store/">Secrets Store</a></li>
        <li><strong>Worker placement.</strong> Measure database and backend round trips before selecting placement for a Worker. <a href="https://developers.cloudflare.com/workers/configuration/placement/">Placement options</a></li>
        <li><strong>Zone features.</strong> Image Transformations, the Web Analytics RUM beacon, Tiered Cache, and Cache Reserve apply where the hostname, feature, and plan support them. <a href="https://developers.cloudflare.com/fundamentals/reference/cdn-cgi-endpoint/">Cloudflare endpoints</a></li>
      </ul>
      <p><a href="${edgeRunbook}">GitHub operations runbook</a> · <a href="/api/build-status">Worker verification</a></p>
    </section>`);
}
