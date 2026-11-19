# Tabor Edge Operations

[Open Tabor Edge Operations](https://tabor-bridge.nathantaboract.workers.dev/edge-operations/)

The `tabor-edge-operations` Worker runs in the existing `nathan-tabor-platforms` dispatch namespace. The public `tabor-bridge` mount uses the existing dispatch binding, so the release uses a dispatch script instead of adding a standard Worker.

| Capability | Operation |
| --- | --- |
| Cloudflare edge trace | Open [`/cdn-cgi/trace`](https://tabor-bridge.nathantaboract.workers.dev/cdn-cgi/trace) for the request's Cloudflare data center, connection and WARP fields. The body includes the caller's IP address. Cloudflare manages the endpoint. |
| Request geolocation | Open [my request diagnostics](https://tabor-bridge.nathantaboract.workers.dev/edge-operations/api/diagnostics). The bridge reads `request.cf` at ingress and returns available city, region, postal code, approximate coordinates, ASN, network, colo, TLS and HTTP protocol. Responses use `no-store` and the code never writes those fields to the registry or logs. `speed.cloudflare.com/meta` returned HTTP 403 during rollout. |
| Image transformations | [Open the 640 px AVIF](https://tabor-bridge.nathantaboract.workers.dev/edge-operations/image?width=640&format=avif). The Images binding reads the fixed R2 sample and returns WebP or AVIF at 160, 320 or 640 px. The public image path uses the Workers Cache API. The original is in the [public R2 sample bucket](https://pub-21f34f28af254b489e7670d8770e6983.r2.dev/edge-test-pattern.png). |
| Real-user monitoring | Cloudflare Web Analytics is registered for the bridge hostname. Only the new console embeds the manual beacon. Check real-user metrics in **Analytics & Logs → Web Analytics**. For this setup, the browser submits to Cloudflare Insights. |
| Service Binding and placement | `FLEET` invokes the existing `tabor-1000-fleet-index` Worker via a fixed internal health request. Service bindings avoid a public HTTPS hop and count toward Workers subrequest limits. Smart Placement is set on the dispatch Worker. Check its placement status under load before claiming a performance gain. |
| D1, R2, and Secrets Store | [Run the binding check](https://tabor-bridge.nathantaboract.workers.dev/edge-operations/api/health). It verifies a read from `tabor-fleet-registry`, the private R2 probe object, the internal Service Binding, and an account Secrets Store key shared by the bridge and dispatch Worker. The API returns booleans. D1 rows, R2 keys and secret values stay internal. |
| Zone-level cache and image delivery | No manageable Cloudflare DNS zone was visible for this release. Use a proxied zone to enable Tiered Cache, Cache Reserve, and `/cdn-cgi/image/` URL transformations as applicable to its plan and traffic. The Workers Cache API used by this console is data-center local. |

[Cloudflare-managed endpoints](https://developers.cloudflare.com/fundamentals/reference/cdn-cgi-endpoint/) · [Images binding](https://developers.cloudflare.com/images/optimization/binding/) · [Manual Web Analytics](https://developers.cloudflare.com/web-analytics/faq/) · [Service bindings](https://developers.cloudflare.com/workers/runtime-apis/bindings/service-bindings/) · [Placement](https://developers.cloudflare.com/workers/configuration/placement/) · [Workers Cache API](https://developers.cloudflare.com/workers/runtime-apis/cache/) · [Tiered Cache](https://developers.cloudflare.com/cache/how-to/tiered-cache/) · [Cache Reserve](https://developers.cloudflare.com/cache/advanced-configuration/cache-reserve/)

## D1 Time Travel

Cloudflare returned a current bookmark for `tabor-fleet-registry`. A bookmark can be read without restoring the live database. Cloudflare documents up to seven days of history on Workers Free and 30 days on Workers Paid.

```sh
wrangler d1 time-travel info tabor-fleet-registry
wrangler d1 time-travel info tabor-fleet-registry --timestamp '<UTC timestamp>'
```

For point-in-time recovery, review the timestamp and application impact before running the production restore. Use the documented restore command with the selected bookmark. [D1 Time Travel](https://developers.cloudflare.com/d1/reference/time-travel/)

## Direct R2 uploads and downloads

`tabor-edge-operations` is private. Generate time-limited SigV4 GET or PUT URLs in a trusted shell. In Cloudflare R2, create an **Object Read & Write** credential scoped to this bucket. Supply the access key ID and secret from your local secret manager as `R2_ACCESS_KEY_ID` and `R2_SECRET_ACCESS_KEY`, along with `CLOUDFLARE_ACCOUNT_ID`. Temporary credentials also support `R2_SESSION_TOKEN`.

```sh
npm ci
node presign.mjs GET 'diagnostics/probe.txt' 300
node presign.mjs PUT 'uploads/example.png' 300 image/png
```

Use the signed PUT URL with the same Content-Type supplied to the signer, for example `curl --upload-file example.png -H 'Content-Type: image/png' "$SIGNED_URL"`. Uploads and downloads go directly to the R2 S3 endpoint. Treat each issued URL as a short-lived bearer credential. Only the dedicated sample bucket is public via its development `r2.dev` hostname. [R2 credentials](https://developers.cloudflare.com/r2/api/tokens/) · [R2 presigned URLs](https://developers.cloudflare.com/r2/api/s3/presigned-urls/) · [Public buckets](https://developers.cloudflare.com/r2/buckets/public-buckets/)

## Clouder Pro on iPhone

1. Connect the same Cloudflare account in Clouder. Open **D1** and select `tabor-fleet-registry`. A read-only query to check registry counts is `SELECT kind, state, total FROM owned_runtime_counts ORDER BY kind, state;`.
2. Open **R2** and select `tabor-edge-operations` for private transfer operations or `tabor-edge-public-assets` for the published sample.
3. Open **Workers** and select `tabor-bridge` for the public dispatcher and its tail logs. The dispatch Worker emits structured health logs and traces. Use the Cloudflare dashboard to inspect namespace scripts if Clouder's list shows only standard Workers. GitHub holds the source and Cloudflare holds the deployment.
4. Add the OpenAI key in Clouder's iOS Agent settings if you use BYOK. Clouder requests approval for DNS, cache and security changes in the app. Enable incident notifications on the phone for supported Lock Screen Live Activities.

[Clouder feature list](https://getclouder.app/features) · [Clouder for iPhone and iPad](https://getclouder.app/cloudflare-ios-app)

## Build and redeploy

Use Node 24 for `npm ci && npm test`. From this directory, deploy the app with the account's authenticated Wrangler:

```sh
wrangler deploy --dispatch-namespace nathan-tabor-platforms --config wrangler.toml
```

The runtime variables `RUM_SITE_TOKEN` and `PUBLIC_BUCKET_URL` are set on the deployed namespace script and preserved by subsequent Wrangler deployments. For a new environment, supply the matching Web Analytics site token and public bucket URL. The Images binding needs `edge-test-pattern.png` in the public bucket. The private R2 binding health check expects `diagnostics/probe.txt`.

When the bridge source changes, deploy `../memory-bank/deploy/tabor-bridge.js` as the `bridge-original.mjs` module of the shared `tabor-bridge` script. Retain the shared entrypoint and its other app modules and bindings. The bridge and dispatch script must share the same `EDGE_HEALTH_KEY` Secrets Store binding. See [bridge packaging](../tabor-bridge-projects/). Verify the console, health, diagnostics, image, and existing bridge routes after deployment.
