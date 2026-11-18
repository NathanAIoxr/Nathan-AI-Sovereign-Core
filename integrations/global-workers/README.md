# Global Cloudflare Worker imports

An additive import to the Nathan AI Sovereign Core collection. Each row has a separate Cloudflare deployment and a pinned upstream commit. The license notices and adaptations are checked in with the source.

15 of 15 imported endpoints passed a public functional check. Verification details are in [deployment-receipt.json](deployment-receipt.json).

| Worker | Endpoint tested | Upstream source |
|---|---|---|
| JSON response | [Endpoint](https://tabor-global-json-response.nathantaboract.workers.dev/) | [Pinned source](https://github.com/cloudflare/cloudflare-docs/blob/69ccd7a4ec0dfcc8fe7375ac25ae6204956174be/src/content/docs/workers/examples/return-json.mdx) |
| HTML response sample | [Endpoint](https://tabor-global-html-response.nathantaboract.workers.dev/) | [Pinned source](https://github.com/cloudflare/cloudflare-docs/blob/69ccd7a4ec0dfcc8fe7375ac25ae6204956174be/src/content/docs/workers/examples/return-html.mdx) |
| Local route redirects | [Endpoint](https://tabor-global-bulk-redirects.nathantaboract.workers.dev/redirects) | [Pinned source](https://github.com/cloudflare/cloudflare-docs/blob/69ccd7a4ec0dfcc8fe7375ac25ae6204956174be/src/content/docs/workers/examples/bulk-redirects.mdx) |
| Security response headers | [Endpoint](https://tabor-global-security-headers.nathantaboract.workers.dev/) | [Pinned source](https://github.com/cloudflare/cloudflare-docs/blob/69ccd7a4ec0dfcc8fe7375ac25ae6204956174be/src/content/docs/workers/examples/security-headers.mdx) |
| TLS policy inspection | [Endpoint](https://tabor-global-tls-inspector.nathantaboract.workers.dev/) | [Pinned source](https://github.com/cloudflare/cloudflare-docs/blob/69ccd7a4ec0dfcc8fe7375ac25ae6204956174be/src/content/docs/workers/examples/block-on-tls.mdx) |
| Bounded request body inspection | [Endpoint](https://tabor-global-body-inspector.nathantaboract.workers.dev/) | [Pinned source](https://github.com/cloudflare/cloudflare-docs/blob/69ccd7a4ec0dfcc8fe7375ac25ae6204956174be/src/content/docs/workers/examples/read-post.mdx) |
| Country and edge location | [Endpoint](https://tabor-global-connection-region.nathantaboract.workers.dev/) | [Pinned source](https://github.com/cloudflare/cloudflare-docs/blob/69ccd7a4ec0dfcc8fe7375ac25ae6204956174be/src/content/docs/workers/examples/geolocation-hello-world.mdx) |
| Browse local language routes | [Endpoint](https://tabor-global-country-routing.nathantaboract.workers.dev/routes) | [Pinned source](https://github.com/cloudflare/cloudflare-docs/blob/69ccd7a4ec0dfcc8fe7375ac25ae6204956174be/src/content/docs/workers/examples/country-code-redirect.mdx) |
| Response header transforms | [Endpoint](https://tabor-global-response-headers.nathantaboract.workers.dev/) | [Pinned source](https://github.com/cloudflare/cloudflare-docs/blob/69ccd7a4ec0dfcc8fe7375ac25ae6204956174be/src/content/docs/workers/examples/alter-headers.mdx) |
| Random UUID v4 | [Endpoint](https://tabor-global-uuid.nathantaboract.workers.dev/) | [Pinned source](https://github.com/ardislu/cloudflare-workers/blob/0cd2df9cb604db4634b4c4a4d77a3c86efd4bcc9/uuid/index.js) |
| Request IP echo | [Endpoint](https://tabor-global-request-ip.nathantaboract.workers.dev/) | [Pinned source](https://github.com/ardislu/cloudflare-workers/blob/0cd2df9cb604db4634b4c4a4d77a3c86efd4bcc9/ip/index.js) |
| QR code SVG | [Endpoint](https://tabor-global-qr-svg.nathantaboract.workers.dev/?url=https%3A%2F%2Fexample.com) | [Pinned source](https://github.com/rossjrw/qrcode-worker/blob/aeee84b5d8ac5f625f32d3f48fdde9e783c97678/src/index.js) |
| Node.js HTTP server | [Endpoint](https://tabor-global-node-http.nathantaboract.workers.dev/api/status) | [Pinned source](https://github.com/cloudflare/templates/blob/1fa42412fd36fd4f265383493f3e548f66e39c5d/nodejs-http-server-template/src/index.ts) |
| Open Graph SVG card | [Endpoint](https://tabor-global-social-card.nathantaboract.workers.dev/api/og?title=Tabor+Worker) | [Pinned source](https://github.com/mdanassaif/workerscando/blob/8e818fa0bef387249be3b01b51460cb726597da8/workers/og-image/src/index.ts) |
| Hono API starter | [Endpoint](https://tabor-global-hono-api.nathantaboract.workers.dev/api/status) | [Pinned source](https://github.com/honojs/hono/blob/a8ae5b1d6e8502ce61cd9e7b853d8107e377fc7b/README.md) |

## Catalog and build

- [Workers manifest](workers.json) records code provenance, license links and entrypoints.
- [101 Registry crosswalk](registry-crosswalk.json) records every original ID, matched Cloudflare names and verified template candidates. An ID match is evidence of a script name in the account.
- `npm ci` and `npm test` build the Worker modules and run their local functional checks. Use Node.js 24.

The edge uploads use the named builds from this directory. The new services add no scheduled jobs, API secrets, paid service bindings, external fetch paths, or pooled account credentials.

A separate template search located more source projects whose normal builds use AI services, state bindings, build assets or integration credentials. The crosswalk records verified upstream folders where available.

[Complete application imports and live checks](complete-apps/README.md), including EXT-045 and the D1-backed import catalog.
