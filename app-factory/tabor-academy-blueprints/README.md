# Tabor Academy Blueprint Lessons

Production reader — https://tabor-academy-blueprints.pages.dev

The D1 table `blueprint_lessons` has one row per complete comparison. Its 15 typed columns hold the complete lesson, with ten rows per tier. Every text cell is required except for the optional third label, `item_c_label`. The matching index supports tier filtering in lesson order.

- `migrations/0001_init.sql` creates the table and inserts the 30 lessons.
- `worker/index.js` serves public lessons, classroom rooms, and diagram metadata.
- `public/index.html` and `public/app.js` provide the reader and learning tools.
- `wrangler.pages.toml` deploys the existing Pages reader. `wrangler.toml` configures the optional background runtime.

## Lesson references

- Rabbit and cat pelvic limbs — https://pmc.ncbi.nlm.nih.gov/articles/PMC6702901/
- Typical rabbit hind-leg coordination — https://pmc.ncbi.nlm.nih.gov/articles/PMC7993613/
- Animal tissues — https://openstax.org/books/biology-2e/pages/33-2-animal-primary-tissues
- Fluid pressure and buoyancy — https://openstax.org/books/university-physics-volume-1/pages/14-summary
- Motors and generators — https://openstax.org/books/physics/pages/20-2-motors-generators-and-transformers
- Solar energy and storage — https://www.energy.gov/cmei/systems/solar-integration-solar-energy-and-storage-basics
- Pumped storage — https://www.energy.gov/cmei/water/pumped-storage-hydropower

## Phase 2

The Pages classroom uses two-hour codes, synchronizes a shared lesson and its
reveal state, and supports anonymous sessions. Anyone with the code can
change the room. The D1-backed Pages implementation polls every two seconds
while a member's tab is visible. The standalone runtime can switch the same
API to a SQLite-backed `ClassroomRoom` Durable Object.

- The search API stays an array of 15-column rows and accepts optional `q`
  and `tier` filters. Workers AI and the 768-dimension cosine index rank
  conceptual matches. Keyword matching also works during local development.
- The Vocabulary Decoder ships a reviewed glossary. Unlisted terms can be
  searched against the curriculum. The mystery button shuffles researched
  cross-domain pairs and keeps the explanation behind a reveal.
- Analytics events include a small set of action names and lesson IDs. The
  application does not send room codes, search text, ages or identities as
  analytics data. Search requests still pass through the web infrastructure.
- The eight answer fields are required. The third comparison label may be
  null. Run `npm run validate` to replay the SQL with SQLite and verify both
  exports. Run `npm run exports` to regenerate `public/exports`.

### Deploy and operate

```sh
npm ci
npm run db:local
npm run validate
npm run dev
```

`npm run pages:deploy` builds a Pages Advanced Mode bundle with bindings for
D1, Workers AI, Vectorize, KV, R2 and Analytics Engine. The production D1
database and the project are already provisioned for the listed account.
Set `CLOUDFLARE_API_TOKEN` in the deploy environment and apply the reviewed
migrations with `npm run db:remote` before updating the Pages build.

The standalone `wrangler.toml` adds the Queue consumer, nightly schedule
(03:00 UTC), and the ClassroomRoom Durable Object. It requires a standalone
Worker slot and the two queues below. After deployment, add a CLASSROOM Durable Object binding with class
`ClassroomRoom` and script `tabor-academy-blueprints` to `wrangler.pages.toml`.
To enable editor drafting, add a `GENERATION` service binding on Pages
targeting the generation Worker, or the standalone runtime. The standalone Worker and the
optional service Workers have public Worker URLs disabled by default.

```sh
npx wrangler queues create tabor-academy-blueprint-jobs
npx wrangler queues create tabor-academy-blueprint-dead
npm run worker:check
npm run worker:deploy
```

The optional `wrangler.generation.toml`, `wrangler.search.toml`, and
`wrangler.media.toml` configure separate internal services. Deploy each
service before enabling its matching service binding in `wrangler.toml`.
Search and media also run in-process when a service binding is omitted.

### Draft intake and review

An editor-authenticated POST to `/api/compare` accepts `a`, `b`, `tier`,
`domain`, `evidence`, and one to five HTTPS `sources`. Configure
`EDITOR_KEY` as a Wrangler secret on the Worker accepting comparisons.
The scheduled consumer accepts a source-backed topic list in
`worker/drafting.js`. The consumer validates each draft, stages it in
`blueprint_drafts`, and dispatches a proposal to the named GitHub repository.
To enable dispatch configure `GH_APP_ID`, `GH_INSTALLATION_ID`, and
`GH_APP_PRIVATE_KEY` as Worker secrets. The app should be installed on the
target repository with Contents write. Convert the GitHub-issued RSA key
to PKCS#8 PEM before upload.

Set `DRAFT_IMAGES` to `true` to generate private R2 concept art for drafts.
Flux supplies JPEG concept previews. Reviewed PNG schematics are published
through `blueprint_media` using an explicit lesson and alt text. The published
motor-generator PNG is reproducible with
`python3 scripts/draw_motor_schematic.py /tmp/motor-generator.png` (Pillow and
DejaVu Sans). Upload it to `reviewed/motor-generator.png` before applying
`0003_motor_schematic.sql` on a fresh account. The
published lessons API exposes no drafts or concept-art object keys.

The GitHub workflow requires `auto-sync-d1.yml` on the default branch
and the repository setting that allows Actions to create pull requests.
It treats dispatch data as untrusted, quotes values with SQLite, and
opens a draft PR with source URLs for a human to verify. Reviewed
migrations are the source of truth. Set the repository variable
`TABOR_ACADEMY_AUTO_DEPLOY=true` and the corresponding scoped
`TABOR_ACADEMY_CLOUDFLARE_TOKEN` Actions secret to apply those
migrations and deploy Pages on main. Optional release attachment requires
`TABOR_ACADEMY_ATTACH_EXPORTS=true`.


## Curriculum index and production fallback

The [curriculum index](https://tabor-academy-blueprints.pages.dev/curriculum/) lists
597 source-ordered entries in nine tracks. The JSON export preserves source
identifiers and positions. It includes 30 comparison blueprints, 23 institution
lesson plans, 101 hands-on methods, 21 field activities, 101 survival cards, 291
Nathan Tabor Way missions, 10 card-game lessons, 12 mining lessons, and eight
architecture modules. Reference collection totals are shown individually since
records and cross-listed activities can overlap.

The Pages app serves the exact 15 Blueprint columns and keeps field submissions,
moderation, room state, and maintenance records in side tables. Text sightings
enter the private review queue. A review action can publish approved lesson text.
Photos are private review files and the API exposes no photo objects. The editor
review route requires the scoped Pages secret `EDITOR_KEY`.

Production uses `scripts/bundle-direct.mjs` for the Advanced Mode transfer. The
`tabor-academy-blueprint-services` script in the Academy dispatch namespace
provides the classroom and maintenance Durable Objects. The maintenance alarm
checks the four bindings every quarter hour and refreshes the last-good KV/R2
snapshot. `/api/healthz` reports the latest receipt. The maintenance alarm
does not require a new standard Worker slot.

At 03:00 UTC the same alarm stages drafts from the source-backed topic list.
It runs the draft processor internally when the Queue consumer isn't installed.
A Vectorize match above 0.94 stages an alias candidate for review. A standard
Worker slot is needed for the named Queue consumer. GitHub dispatch requires
the Academy GitHub App credentials and the workflow on the default branch.
The single-file offline workbook is generated from the reviewed source export.

## Reviewed curriculum, offline sync, and field sightings

The live archive is available at both `/tabor-academy-offline.html` and
`/exports/tabor-academy-offline.html` in this release. Each file contains a
point-in-time copy of the reviewed Blueprint rows. Installed browsers resume
IndexedDB outbox delivery on reconnect, whenever the site is reopened, or
when the user presses Sync now. Background Sync is also used where supported.

Only known curriculum categories go into the gap queue. When the queue
binding is absent, Pages increments the same category counters in D1. The
nightly job selects those categories from a tested, source-backed topic list.
The mechanism-specific Vectorize namespace is separate from discovery search.
A score over 0.94 creates an alias proposal for review. Approved aliases
point to the existing curriculum row.

`worker/closed_loop.js` provides the mechanism match, photo review suggestions,
gap consumer, and audit probes. Pending images remain in private R2. The
production health receipt is at `/api/healthz`. The Pages reader keeps the
last good snapshot if a published row fails the schema audit. The GitHub
workflow can attach the workbook and exports to releases, mirror the Wiki
links, and open one issue per live canary incident once configured on main.

In GitHub Codespaces, select the Tabor Academy Blueprints configuration.
