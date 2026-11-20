# Sovereign MINDs · Nathan Tabor / Nathan AI

[Cloudflare catalog](https://unified-operations-cockpit.nathantaboract.workers.dev/tabor-sites/sovereign-minds) · [Conductor prompts](PROMPTS.md) · [Handoff](handoff.json) · [Author excerpts](AUTHOR-EXCERPTS.md)

Zero, One, Proton, Neutron, Electron, Atom, and Nathan Tabor are independent MIND profiles, each served by its own Cloudflare dispatch script. All use the same versioned contract and separate identities. Links between profiles preserve the original IDs. Each box carries seven axes, the below/middle/above planes, and the seven recovered body names. Empty axes and body fields have no supported entries. The Atomic Souls entries carry Nathan's authored cosmology. Energy and frequency measurements use explicit units and methods.

## Lasso of Truth

The validator checks source bytes, SHA-256 values, UTF-8 boundaries, evidence review notes and exact quotation text. It keeps documented misattributions and disputes in the ledger and excludes them from the active statement list. Authored premises and interpretations remain labeled. A source-supported action requires a reviewed primary span. Source integrity and successful validation establish an audit trail. A reviewer still has to establish source authenticity, context, and accuracy.

Use the existing [Ancient Minds intake](../../../app-factory/nathan-ai/personal-intelligence/minds/federation/ancient_minds_reference/) to preserve owner originals. Supply a local reviewed manifest to the Lasso:

```sh
node deployments/conductor/sovereign-minds/import-local.mjs reviewed-manifest.json
node deployments/conductor/sovereign-minds/import-local.mjs reviewed-manifest.json markdown
```

The manifest contains:

- `identity` with stable `id`, `name`, `domain` and `scale`.
- `sources` with `id`, `file` (relative to the manifest), `sha256`, `citation`, `subjectId` and `classification` (`firsthand`, `primary_record`, `measurement`, or `author_framework`).
- `statements` with `id`, `axis`, `kind`, `text` and optionally `body`, `plane`, and `evidence`. Each evidence record has `sourceId`, `startByte`, `endByte` (exclusive), `relation`, and `review` with `reviewer` and `note`. Include `value`, `unit` and `method` for measurements. A quotation's supporting span must contain only the exact quoted words.
- Optional `links` to other sovereign IDs or source projects.

See the [existing Mind of Minds catalog](../../../app-factory/nathan-ai/personal-intelligence/minds/mind-of-minds/catalog.json) and [per-bit workers](../../../app-factory/nathan-ai/personal-intelligence/minds/federation/bit-workers/) for their original project definitions and source addresses. The Nathan Tabor seed is an initial evidence-based profile. A full historical reconstruction requires the reviewed timeline, attested acts, and primary sources for each subject.

## Release

Run `node --test deployments/conductor/sovereign-minds/sovereign-minds.test.mjs`. Upload `worker.mjs`, `seeds.mjs`, and `lasso.mjs` as modules for each script in the existing `nathan-tabor-platforms` namespace. Set `MIND_ID` to `catalog` for the index or to the exact ID in the handoff, and set `RELEASE_SHA` to the GitHub commit. The existing cockpit allowlist maps each public route to only its own script. Verify the exact Cloudflare release with `node deployments/conductor/sovereign-minds/verify-live.mjs <release-sha>`. A publicly released profile is built from the checked-in seed set.
