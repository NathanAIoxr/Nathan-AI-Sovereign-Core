# Cloudflare Edge Operations and Clouder Pro

[Open Edge Operations](https://nathan-ai-pocket-codex.nathantaboract.workers.dev/edge-operations) · [Live status JSON](https://nathan-ai-pocket-codex.nathantaboract.workers.dev/api/edge-operations)

## 1. Read the edge

- Pocket Control's Edge Operations uses the current request's Cloudflare data center, HTTP version, and TLS version. The health check reaches ONE Sovereign Hub's fixed `GET /health` route through the same-account `ONE_HUB` service binding. Monitor actual request duration in Workers Logs. Cloudflare routing and execution still take time. [Service bindings](https://developers.cloudflare.com/workers/runtime-apis/bindings/service-bindings/)
- Open `/cdn-cgi/trace` on the Cloudflare hostname you operate. Cloudflare serves the path and the response includes the requesting IP. Keep that raw response out of public tickets. [Cloudflare-managed endpoints](https://developers.cloudflare.com/fundamentals/reference/cdn-cgi-endpoint/)
- The Cloudflare Speed Test can be opened manually when troubleshooting. The companion `/meta` URL is an implementation detail of that service. Use IP-derived location as an estimate and keep it out of deployment or access decisions. [Cloudflare Speed Test](https://speed.cloudflare.com/)
- Image Transformations uses `/cdn-cgi/image/` on supported hostnames. Enable it on the intended zone, verify its allowed sources, and test one image for MIME type, dimensions, and caching before pointing the magazine at transformed images. The Web Analytics beacon uses `/cdn-cgi/rum` on applicable proxied sites and returns HTTP 204 when active. Turn on Web Analytics for the chosen site before expecting measurements. [Image Transformations](https://developers.cloudflare.com/images/transform-images/transform-via-url/) · [Web Analytics](https://developers.cloudflare.com/web-analytics/)

## 2. Keep projects isolated

| Project | Runtime data | Files |
| --- | --- | --- |
| TABORBOY | `taborboy_db` | `taborboy-assets` |
| TABORPOOL | `taborpool_db` | `taborpool-archives` |
| TaborPoolBoys | Crossover site and Cover Picker Worker | `taborpoolboys-assets` |

- **D1 Time Travel.** Cloudflare provides a 7-day window on Free and up to 30 days on Workers Paid. To check a recovery point from an authenticated terminal, run `npx wrangler d1 time-travel info taborboy_db` or use `taborpool_db` for TABORPOOL. Add `--timestamp` with an ISO 8601 time to look up an earlier point. A production restore changes the selected database. Record the current bookmark before selecting the older recovery point and re-run the project's health and application checks after the restore. [Time Travel](https://developers.cloudflare.com/d1/reference/time-travel/)
- **R2 direct transfer.** Keep private buckets private. Generate a presigned GET or PUT using S3 Signature Version 4, the R2 S3 endpoint and a credential scoped to the intended bucket. Sign the exact object and operation, then set a short expiration. Use a single object key and declared content type for a write. The resulting URL grants bearer access for that operation. Send it directly to its intended recipient. Use the documented CORS settings for browser transfers. R2 has no egress charge, and storage and request pricing still apply. [Presigned URLs](https://developers.cloudflare.com/r2/api/s3/presigned-urls/) · [R2 pricing](https://developers.cloudflare.com/r2/pricing/)
- **Secrets Store.** Use the account store when several trusted services need the same credential. Import the secret through the dashboard, bind it to the precise Worker and retrieve it with the binding API. Test and rotate consumers together. Keep Cloudflare tokens, R2 S3 signing keys, and Clouder’s optional OpenAI key out of GitHub source and public Worker output. [Secrets Store](https://developers.cloudflare.com/secrets-store/) · [Workers integration](https://developers.cloudflare.com/secrets-store/integrations/workers/)
- **Placement and cache.** Measure representative traffic before and after changing placement for a Worker with repeated round trips to one backend. Review `cf-placement` when present. Use Tiered Cache and Cache Reserve only with a supported zone and cacheable, public traffic. Keep signed or personalized responses out of shared caching. Cache Reserve adds storage and operation charges. [Placement](https://developers.cloudflare.com/workers/configuration/placement/) · [Tiered Cache](https://developers.cloudflare.com/cache/how-to/tiered-cache/) · [Cache Reserve](https://developers.cloudflare.com/cache/advanced-configuration/cache-reserve/)

## 3. Operate in Clouder Pro

1. Open Clouder on your device and choose your Tabor Cloudflare account. Set up a Cloudflare API token with the smallest set of permissions needed. Select read permissions for monitoring and add resource-specific write permissions for your intended operations. Keep the token on the device.
2. In Workers and Pages, choose the exact Worker or Pages project. Review build details, tail the Worker on a test request and check its health route. GitHub remains the source for reproducible releases. Use the [Pocket Control GitHub tab](https://nathan-ai-pocket-codex.nathantaboract.workers.dev/?tab=github) to cross-check deployment receipts.
3. In D1, run `SELECT name FROM sqlite_schema WHERE type = 'table' ORDER BY name;` as a read check for the selected database. Run object operations from the corresponding R2 bucket, using the intended object prefix.
4. If using the Clouder Agent on iOS, enter your optional OpenAI key in Clouder and review the proposed action, target resource, and permissions before approving it. Enable app notifications and Live Activities on the device if you want incident updates.

Clouder applies the permissions of the Cloudflare token on the device. The Edge Operations page offers live diagnostics and links to native controls. Its public HTTP routes accept GET and HEAD. [Clouder features](https://getclouder.app/features) · [App Store](https://apps.apple.com/us/app/clouder-for-cloudflare/id6755757771)

## 4. Build, deploy, and verify

1. Run the existing Pocket Control tests and build `nathan-ai-pocket-codex.mjs` from the GitHub source.
2. On that Worker, preserve its existing bindings and add a service binding named `ONE_HUB` targeting `one-sovereign-hub`. Preserve the hourly verification trigger.
3. Deploy the Worker version. Open the Cloudflare tab, select Edge Operations and confirm the service binding reports ready. Check the public Edge Operations JSON, Pocket Codex health, and the GitHub build receipt.
