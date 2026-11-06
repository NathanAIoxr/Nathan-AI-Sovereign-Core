# TABOR 1-2-3 FACTORY™ — System-Wide Code & Delivery Audit
**Date:** October 10, 2026 · **Scope:** the public GitHub Factory plus 8 existing locally supplied development packages.
**Rule:** repair checked code; preserve original artwork and historical sources separately; never upgrade status based on a mockup or claim alone.

## Changes verified in the PUBLIC repository

| Area | Finding | Verified action |
| --- | --- | --- |
| Creator Vault data integrity | When SHA-256 was unavailable (files over the prototype limit), the old fallback used filename + size + origin. Distinct originals could be mistaken for duplicates. | Changed fallback to a distinct **unverified** ID; preserved both originals. Added a Node regression test. |
| TABOR GPS coordinates | Empty latitude/longitude/heading was converted by `Number('')` into zero. | Empty input now yields `NaN` and fails validation instead of quietly navigating to the equator. |
| Offline cache | The old service worker cached any successful same-origin GET, including possible future sensitive endpoints. | Versioned allowlist cache for named static, public files only; no authorization header or query-string response caching. |
| Factory deep links | `index.html#atlas` opened Home because hash navigation was not wired to tab visibility. | Deep-link routing added and links updated. |
| Public product discovery | Only a few project prototypes were linked; independent modules were difficult to find. | Added browsable `ecosystem.html` + `products.json` with explicit **browser demo / private prototype / concept** statuses. Public registry is intentionally **not** the private portfolio. |
| iPhone/standalone install identity | ONE, TABOR GPS and 1420 used the Factory's common manifest, so installed products could launch the wrong app. | Added separate PWA manifests and product-specific start URLs. Physical-device testing still required. |
| Shared contracts | Cross-app namespaces, original asset references, permission requirements and approvals had no repository-wide typed boundary. | Added tested `core/root-contracts.js`: namespaced IDs, provenance, privacy, tenant checks, deny-by-default scope evaluation and local **review-only** release gate. |
| Continuous integration | No cross-product validation job existed. | Added `.github/workflows/factory-ci.yml`; runs public syntax/link/data/security checks plus ONE and 1420 tests and root-contract tests. |
| Developer orientation | Root README was only a repository name and the Factory README described a navigation-only dashboard. | Replaced/updated with actual URLs, commands, statuses, privacy and known limitations. |
| Release governance | Multi-product rollout criteria were dispersed across separate documents. | Added `RELEASE_GATES.md` across licensing, tenant identity, backups, payments, human services, children and GPS/sources. |

**GitHub workflow status:** a new [Factory quality checks workflow](../.github/workflows/factory-ci.yml) was added and is runnable from source. Check the **latest workflow run** in Actions before treating a new commit as passing: earlier intermediate runs correctly exposed a faulty public-count assertion, which was fixed.

## Independent local package retesting

The original source ZIPs were inspected and tests run in an isolated local workspace. **All 8 packaged baseline suites ultimately passed** after complete extraction (103 tests total):

| Private package | Suite count | Verified result |
| --- | ---: | --- |
| REMOVE JC fantasy game alpha | 27 | Passed |
| Universal State Engine | 15 | Passed |
| Universal Commerce / Shopify-Kickstarter | 13 | Passed |
| ChristmasToyDrive.com / Good Samaritan | 9 | Passed |
| TABOR INFINITUM | 13 | Passed |
| Nathan AI LET/TET/PPL | 14 | Passed |
| TABOR ROOT backend starter | 6 | Passed |
| TABOR 1-2-3 Factory complete Work starter | 6 | Passed |
| **Total** | **103** | **All baseline tests passed** |

The first attempt to test the Factory starter used an intentionally partial extract and omitted dependency files. This was an **audit harness error**, not a source defect; the complete archive reran and passed. These tests prove only what each existing suite exercises. They do not establish provider availability, native devices, load resilience, cloud-tenancy isolation or deployment.

Private packages and original assets remain outside the public GitHub repository. The owner-controlled Work session should import them into appropriately private, separate repositories or workspaces and then add new *integration* tests.

## Still missing: ranked by operational risk

### P0 — Prevent loss or unauthorized action
1. **Private source of truth**: locally held conversation ZIPs are not a versioned, private, multi-product source repository. Import to private repos, ensure rights and rollback, without pushing assets to this public hub.
2. **Full Creator Vault backup and restore**: Vault's existing index export is metadata only; it does not back up media bytes. Browser data can disappear. Build and test binary ZIP/export restore + checksums before relying on it as the only archive.
3. **Real user accounts and tenant isolation**: development headers are forgeable; `root-contracts.js` can validate trusted-context *shape*, not actual authentication or authorization. Build and test OIDC/passkeys, server-managed grants, row/file/queue tenant isolation.
4. **Keep high-impact endpoints disabled** until authorized: payments, donations, refunds, orders, bank actions, app publishing, remote deletion and recipient/child data intake.
5. **Licensing and ownership review**: the public repository contains Apache License 2.0; verify it aligns with intended public code. Do not infer that the founder's original commercial art or unpublished projects are distributed under that license.

### P1 — Connect tested services
6. Production PostgreSQL/migrations/observability/backup/recovery; event idempotency and transactional ledgers per domain.
7. Provider-specific authorized OAuth and webhooks; Shopify hosted checkout; Kickstarter review; receipts and scoped grants.
8. Real iPhone/Android touch tests, screen reader/a11y tests, offline install testing, installation icons and independently installable app IDs.
9. Node, Python, browser and backend contract compatibility tests between private ZIP modules; staging before integration.
10. Native geolocation, heading calibration, real map routing and field validation for TABOR GPS before accuracy/safety claims.
11. Historical source verification, legal/rights and original character review before educational/public games.

### P2 — Expand products without violating boundaries
12. Live generation/rendering workers and asset versions (with AI costs and rights).
13. Cross-device Creator Vault; encrypted cloud backups and ownership controls.
14. Native product builds and game engines; multiplayer anti-cheat, scaling, CDN.
15. E-commerce, customer support, app stores, volunteer coordination, impact reporting after the foundational controls pass.

## Work-mode execution order

1. Verify GitHub `main`, clean CI, and the public URLs; test on an actual iPhone.
2. Move original private ZIP source to owner-approved private repositories with a complete asset inventory, original hashes and designated owner.
3. Build a **real full-media Vault backup and restore** before any source-folder migration or browser-data cleanup.
4. Implement one authenticated TABOR ROOT API with strictly separated bounded contexts, PostgreSQL and tenant-isolation tests.
5. Import ONE / Nathan AI / State Engine / Creative Factory / Tabor World / Commerce / Good Samaritan / GPS integrations one by one; no silent publication.
6. Ship one controlled product end-to-end through sandbox verification, restore tests, consent approval and honest status update.

## Universal acceptance principle

**Empathy:** observe real human needs and protect originals.
**Sympathy:** respect dignity, privacy, ownership and consent.
**Compassion:** take a testable action, verify its effect and repair failures.

The **Three Engines are design principles**. They do not by themselves authenticate permissions or establish factual truth.
