# Tabor Worker 101 import

All 101 original intake records appear in `manifest.json` in their submitted order. Each record includes the submitted name, source evidence, Cloudflare script name when present, and the next dependency or verification result. The same numbered IDs are available from the private `tabor-worker-101-registry` Worker.

## Source checkout

The repository stores upstreams as Git submodules pinned to specific commits. Initialize a single upstream from the repository root with the `gitlink` value in the manifest, prefixed by `integrations/tabor-worker-101/`.

```sh
git submodule update --init integrations/tabor-worker-101/upstreams/cloudflare--templates
```

Paths inside shared template repositories appear in each record's `upstream.path`. Upstreams keep their own licenses. `src/` contains local Tabor adapters. `existing/` records the previous Cloudflare adapters for this same intake.

## Build the adapters and registry

```sh
npm ci --ignore-scripts
npm run build
```

This builds the local Worker modules into `dist/` and the private registry as `dist/registry-worker.mjs`. Worker bindings listed in the manifest refer to account resources. The Workflow class also requires the Cloudflare Workflow resource `tabor-ext-043-digest`.

## Build EXT-091

Initialize the Cloudflare Templates submodule, then build its Vite React template with the pinned lockfile and package the generated Worker and client files together.

```sh
(cd upstreams/cloudflare--templates/vite-react-template && npm ci --ignore-scripts && npm run build)
node pack-vite.mjs upstreams/cloudflare--templates/vite-react-template/dist dist/091-vite-react.mjs
```

The Cloudflare registry is a deployment snapshot. Its public URLs are listed only for scripts with `workers.dev` enabled. Private adapters are called using account service bindings.
