# Tabor Academy

By Nathan Tabor

[Public launch page](https://tabor-bridge.nathantaboract.workers.dev/tabor-academy/) · [Health check](https://tabor-bridge.nathantaboract.workers.dev/tabor-academy/healthz)

The launch Worker lives in the dedicated Cloudflare Workers for Platforms namespace `tabor-academy`. The existing Tabor Bridge forwards the `/tabor-academy/` route to that Worker. The deployed module is `src/worker.mjs`.

## Checks

From this directory, run `node --test test/worker.test.mjs` with Node.js 22. GitHub Actions uses the same checks.

## Existing resources

The D1 database `tabor-fleet-registry` records this deployment in `owned_runtime_registry` and `virtual_app_v1`. The registry also lists these Cloudflare Workers for the Library of Tabor.

- `library-of-tabor-archive`
- `library-of-tabor-assignments`
- `library-of-tabor-data`
- `library-of-tabor-imagination`
- `library-of-tabor-import`
- `library-of-tabor-wisdom`

## Academy scope

The full Academy brief includes Nathan AI Voice Box for verbatim voice capture, a shared digital notepad for two-way tutoring, and the Library of Tabor as a learning resource. This release serves the launch announcement and health check. The learning tools and Library connections are pending implementation.
