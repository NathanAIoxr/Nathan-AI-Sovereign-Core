# Nathan AI runtime duality

This runtime policy applies to the app manifests tracked in Sovereign Core. Every manifest appears in the inventory with both profile columns. The inventory reports an app as configured only when its registration names a deployment for that profile.

| Profile | Resources and operation |
| --- | --- |
| **SANDBOX** | Reviewed code, disposable fixtures and separate bindings. The catalog CI test runs in an offline, unprivileged container. The hosted fixture Worker has zero bindings and no outbound request code. |
| **LIVE** | The owner's existing deployment and live resources, with the app's normal authorization. A live deployment selects its profile explicitly. |

1. **1+1=2 · Build.** Register two distinct targets for an app.
2. **1-1=0 · Clear.** Keep live secrets, bindings, and user data out of sandbox targets.
3. **1×1=1 · Integrate.** Map both targets to one tracked app manifest.
4. **1÷1=1 · Verify.** Check each target's bindings, behavior, and status independently.

## Inventory and selection

Run these commands from the repository root.

```sh
node projects/sovereignty-os/duality/runtime/select.mjs inventory
node projects/sovereignty-os/duality/runtime/select.mjs select nathan-ai-bounties-db sandbox
node projects/sovereignty-os/duality/runtime/select.mjs select nathan-ai-bounties-db live
node --test projects/sovereignty-os/duality/runtime/runtime.test.mjs
```

On November 19, 2026 the repository inventory contained 653 app manifests and 29 Wrangler configurations before adding the catalog sandbox config. Cloudflare reported 500 standalone Workers, 1,137 Workers in the existing dispatch namespace, 20 Pages projects, 70 D1 databases, 15 KV namespaces, 16 R2 buckets, 14 queues, and 19 Durable Object namespaces. These counts describe observed resources. A repository manifest can map to multiple deployments or none.

The selector requires a named app and an explicit profile. Unregistered apps appear in inventory and return an error on selection. Add their source manifest and independently verified deployment details in `profiles.json` as they are enrolled. The inventory comes from the Git index, so new manifests appear automatically after they are tracked.

## Global Bounties installation

- **SANDBOX CI.** The existing Global Bounties Defensive Sandbox workflow builds and tests the catalog, including owner-write behavior, against disposable data inside an offline container. [Workflow source](../../../../.github/workflows/nathan-global-bounties-sandbox.yml)
- **SANDBOX Cloudflare.** The fixture Worker named `nathan-ai-bounties-db` is installed in the `nathan-tabor-sandbox` dispatch namespace. It serves `GET /health`, `GET /bounties`, and `GET /stats` from source-checked public fixtures and rejects writes. It has no public route and no resource bindings.
- **LIVE Cloudflare.** The existing `nathan-ai-bounties-db` Worker in `nathan-tabor-platforms` uses the live D1 database and the existing Tabor Bridge route. [Live catalog](https://tabor-bridge.nathantaboract.workers.dev/global-bounties/bounties) · [Live stats](https://tabor-bridge.nathantaboract.workers.dev/global-bounties/stats)

To rebuild the hosted fixture, run from this directory with an authorized Wrangler session:

```sh
mkdir -p dist
node build-sandbox.mjs dist/worker.mjs
npx --yes wrangler@4.135.0 deploy --config wrangler.sandbox.toml --dispatch-namespace nathan-tabor-sandbox
```

The existing live release workflow and per-app authorization govern live deployments. Registering a sandbox does not repoint a production route or share production resources.
