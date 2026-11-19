# TABOR WEBSITE BUILDER

By Nathan Tabor. The Conservative Voice started in 2004 and let individual writers and organizations submit articles. This implementation carries that direct publishing workflow into separate editions, an editorial queue and permanent article addresses.

| Site | Worker | Data |
| --- | --- | --- |
| Handling Life | `handling-life-worker` | `handling_life_db` |
| ChristmasToyDrive.com | `christmas-toy-drive-worker` | `toy_drive_db` |
| The Daily Cup of Hope | `daily-cup-of-hope-worker` | `cup_of_hope_db` |
| The Daily Plate of Love | `daily-plate-of-love-worker` | `plate_of_love_db` |
| TABOR WEBSITE BUILDER | `tabor-site-builder-worker` | `site_builder_db` and revision-keyed article KV |
| YEAR ZERO | `tabor-year-zero-worker` | Versioned research index and readings |
| FUCK THE POLICE | `tabor-fuck-the-police-worker` | Public police-accountability publication |

Each Worker has its own configuration and version history. The existing Cloudflare Workers for Platforms namespace `nathan-tabor-platforms` runs them separately. The existing gateway forwards only the seven allowlisted `/tabor-sites/` paths. Public links are in `src/sites.mjs`. Custom domains require access to their DNS zones.

## Catalog and publishing operations

The three aid catalogs run independently. In the absence of active program inventory they show sample items and estimated unit costs. Visitors can save, download and print a list. Enter actual inventory through an authorized `POST /api/catalog` on the relevant aid Worker. `POST /api/pledges` accepts an operator-provided UUID, item ID and unit quantity. `POST /api/pledge-status` accepts the pledge ID and a final status of `FULFILLED` or `CANCELLED`. The service applies stock changes transactionally. Payments and public recipient intake are outside this release.

The builder serves `/edition/conservative-voice` and `/editor`. Publisher credentials are scoped to a single site's mutation API. Set an independent `PUBLISHER_TOKEN` secret on the builder and each aid Worker that will accept operator writes. For a Workers for Platforms tenant, use the dispatch namespace secret settings, or run a Wrangler secret command for the tenant configuration with `--dispatch-namespace nathan-tabor-platforms`. Never put the publisher token into GitHub source files. The editor takes the token for the current page session. Create further editorial editions with `POST /api/editions` using a slug and title.

The original sites and evidence are linked from the relevant pages. The YEAR ZERO research index contains bibliographic headings and records individual sourced readings. Its chapter sequence runs from YEAR ZERO to YEAR 222, back to YEAR 69, on to YEAR 3333, then into the calendar-free part and onward to the separate publication.

## Verification and deployment

Run `node scripts/verify.mjs` with Node 24 for the local acceptance checks. Run `node scripts/check-live.mjs` to check the deployed public routes. The included GitHub Action builds every Worker, applies the relevant D1 schema, deploys into the namespace, and verifies the live routes when the repository has a `TABOR_WEBSITE_CLOUDFLARE_TOKEN` secret with Workers Scripts Write and D1 Write for this Cloudflare account. Set the repository variable `TABOR_WEBSITE_CLOUDFLARE_ACCOUNT_ID` if the production Cloudflare account changes.

GitHub Actions also runs the public smoke check daily.

GitHub is the source and deployment channel. Clouder Pro connects directly to the same Cloudflare account from the owner's mobile device and uses its own scoped Cloudflare credentials.
