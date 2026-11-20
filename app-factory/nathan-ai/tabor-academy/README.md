# Tabor Academy

By Nathan Tabor

[Academy homepage](https://tabor-bridge.nathantaboract.workers.dev/tabor-academy/) · [Health check](https://tabor-bridge.nathantaboract.workers.dev/tabor-academy/healthz)

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

Remaining Academy features include Nathan AI Voice Box ingestion, the shared notepad, Hop In Chatbox, and MAKE AI YOURS.

## Tabor Workbench

[Open the Workbench](https://tabor-bridge.nathantaboract.workers.dev/tabor-academy/workbench/)

Apply `migrations/0002_techniques.sql` and then `migrations/0003_technique_zones.sql` after the Library migration. The 101 technique numbers and seven field-guide groupings are shared by the Workbench HTML and the `/workbench/techniques.json` feed. Every technique has a Workbench page at `/workbench/zones/<number>/`.

Cloudflare development namespaces are named `tabor-academy-001-dev` through `tabor-academy-101-dev`. They are Workers for Platforms dispatch namespaces. Each has a `technique` Worker from `src/technique-zone.mjs`, with its technique brief in a `TECHNIQUE` binding. The Academy Worker serves the public Workbench from D1.

The first field activities are #4, #21, #46, #47, #59, #65, #92, and #101. Technique #47 includes the printable template and the live triangle sandbox.

## Survival-to-Modernity Mastery Drills

[Open the track](https://tabor-bridge.nathantaboract.workers.dev/tabor-academy/survival/)

Apply `migrations/0004_survival_mastery.sql` for the public card records. The `survival_source_archive` table holds the private verbatim curriculum. Public routes use only `survival_mastery_cards`.

- `/survival/<number>/` opens a card.
- `/survival/?category=<1–7>&print=1` renders a printable category deck.
- `/survival/?print=1` renders the full deck.
- `/survival/cards.json` serves the public card feed.

The separate development namespaces are `tabor-academy-survival-001-dev` through `tabor-academy-survival-101-dev`. Each contains a `technique` Worker from `src/technique-zone.mjs` with its corresponding public card record in the `TECHNIQUE` binding.
