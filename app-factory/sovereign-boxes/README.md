# 🛡️ TABOR Sovereign Boxes — Universal Factory Registry

**Creator:** Nathan Tabor · **Parent:** TABOR 1-2-3 FACTORY · **Technical status:** functional browser index and deterministic arithmetic/permission demonstration (not a security authentication service).

## Canonical root rules
- **1 + 1 = 2.** Two independent sovereign entities can collaborate; their distinct identity survives. Connecting A and B adds a **relationship record**, not a merger of original identity.
- **1 − 1 = 0.** A permissioned relationship can be revoked and may become inactive for future operations. This does not destroy sources, erase immutable logs, decrypt data or delete off-platform backups.
- Every letter, digit, zero, symbol, space, project, app, game, source, media file and relationship can be represented by **one addressable sovereign box per unit**. The written number ten displays as `[1][0]` while ordinary decimal arithmetic remains ten.
- Letter mapping is A=1 through Z=26; the 34-character word `supercalifragilisticexpialidocious` has 34 separate character boxes (not one box). No secret access or universal data extraction follows from this convention.
- **Permissions and consent stay explicit.** A client-side consent flag is not an authorization mechanism; only trusted authenticated backend grants can enforce permissions.

## What is actually indexed

| Source / namespace | Count | Content exposed |
| --- | ---: | --- |
| `TW-001` through `TW-101` | **101** | Original titled game-family entries; game mechanics are not represented as completed |
| `R101` through separate ranges within `R956` | **496** | Original private proposal-slot identifiers ONLY, no unpublished titles/source content |
| `APP:*` from public `products.json` | **21** | Existing public app/module registry and status |
| **Total public registry boxes** | **618** | All with explicit identity, source, status, visibility |

The original **TW-001 / TW001** namespaces are not interchangeable. Similarly the Factory's creative/historical 101–901 categories are separate from ONE's technical layers 101–901. No renumbering is allowed without a reviewed migration.

## What this is NOT

This 618-box registry is **NOT 618 playable apps**, nor a disclosure of the complete user's unpublished idea list. The 496 proposed ideas are **slots**, with independently stored source descriptions in an owner-controlled private ZIP catalog. The public site shows only their IDs and truthful private status. Prior owner-provided 150-row full project catalog also remains private; some entries overlap the 21 public modules, so it is **not** an additional 150 unique installed applications.

The full original owner-private architecture package is `TABOR_101_TO_901_COMPLETE_ROOT_CATALOG.zip` with:
- 101 original games and exact identifiers
- 496 creative proposals
- 150 earlier project catalog entries
- gap register and root relationships
- 101–901 complete directory and local private viewer.

This private ZIP can be supplied in ChatGPT Work to import unchanged source metadata after individual release approval.

## Files
- `registry.json`: public redacted 618-entry manifest.
- `engine.js`: deterministic per-character boxes, natural number digit parsing, arithmetic, standalone local entity links and reversible permission revocation.
- `index.html`: interactive mobile-friendly search, filters and character boxes.
- `engine.test.cjs`: eleven reproducible Node tests.\n- `importer.js` + `importer.test.cjs`: owner-local CSV/JSON importer and 5 tests; never uploads private sources.

Run: `node --test app-factory/sovereign-boxes/*.test.cjs`.\n\n**Complete owner-private view:** unzip `TABOR_SOVEREIGN_BOXES_BETTER_TOGETHER_GITHUB_HANDOFF.zip`, select `NEW_101_TO_901_IDEAS_PRIVATE.csv` in the private import field to reveal the 496 titles in this browser session, and then select `PRIOR_150_CATALOG_PRESERVED_PRIVATE.json` to add the 150 original source catalog records. No network transfer occurs. Import does not overwrite the original `TW-001` titles. After both files, the local view should contain 768 indexed boxes (618 public + 150 private source entries), with 496 private titles resolved. These are source entries, not 768 finished software applications.

## Creative connection

The **Better Together** song expresses the same idea: “I will teach you how to be better than me, even if you don't teach me.” Distinct people learn without needing to erase another person's strengths. [Open the holiday song project](../creative/music/better-together/index.html).

## Next development
Implement a trusted owner-controlled backend with full original-byte assets, identity enforcement, consent-scoped links, audit, version history and permissioned graph edges; import **private ZIP catalogs** to authenticated project Vault; implement game-specific state machines individually. Never represent concept cards as working published apps or upload private original images to the public repo without rights/privacy review.
