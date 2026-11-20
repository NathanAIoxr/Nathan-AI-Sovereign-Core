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

## Library of Tabor

[Open the Library](https://tabor-bridge.nathantaboract.workers.dev/tabor-academy/library/)

D1 database: `tabor-academy-library`. Apply `migrations/0001_library.sql` to create the four Academy tables. The Worker binding is `LIBRARY`.

The public Library reads lessons whose latest ledger entry is `RETAIN_1` and verifies each archived excerpt against its SHA-256 record ID on read. The browser receives the public lesson, sources and practice steps. Archived excerpts are available through the private D1 database. `PURGE_0` withholds a lesson from public display while retaining its archive and audit history. Seed entries use broad LoC class codes and the Uno index.

The first lessons cover the roots of education and the shared ancestry of humans and parrots. The Edubba → Buddha rotation is presented as the Academy reading alongside the language sources.

Next in the Academy brief: Nathan AI Voice Box ingestion, shared notepad, Hop In Chatbox, and MAKE AI YOURS.
