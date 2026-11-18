# Nathan AI Global Atlas Integration — 2026-11-18

## Verified Cloudflare D1 import
Account `a70580bacdf96c946662b7b67dcb45b5`.
Source D1 `tabor-global-import-catalog` UUID `6ff28930-62b4-416e-89ee-a2c3f985730a`.
Destination D1 `nathan-ai-global-catalog` UUID `1889fb08-9b26-45b9-8a71-f22a6ee3fc66`.

| Destination source_id | Records | Original table |
| --- | ---: | --- |
| tabor-worldwide-repos | 205 | global_atlas_public_repos |
| tabor-worldwide-components | 334 | global_atlas_components |
| tabor-worldwide-layers | 18 | global_atlas_layers |
| tabor-worldwide-sources | 13 | global_atlas_sources |
| tabor-existing-fleet | 505 | global_atlas_existing_fleet |

**1,075 catalog items** imported with `INSERT OR IGNORE` in 20-row batches. The original tables were not modified. Each record is marked `discovered`, not installed or executed. Original source tables remain authoritative for additional metadata and updates. The imported fleet records are catalog references, not verified running agents. These 1,075 are in addition to previously existing global catalog items.

## Separate resources to preserve
- `tabor-fleet-registry` UUID `00e422eb-5222-4892-8f90-74aaf8ab0518` contains logical supercomputer slots; they are not physical computers.
- Workers for Platforms dispatch namespace `nathan-tabor-platforms` has 1,000 scripts per previous audit; verify with dispatch-specific API before making a new current-count claim.
- Ordinary Worker inventory previously reported 447; re-audit for current counts.
- `nathan-ai-cockpit-ledger` UUID `ee93da4e-7d2d-4440-9dfc-ce4b6cdbdb3c`.

## Next integration stages
1. Build a read-only paginated `/atlas` API backed by the destination D1 binding, with source, category, state and search filters.
2. Show atlas inventory and verified runtime inventory separately in the GitHub/Cloudflare mobile interface.
3. Establish per-project licensing, provenance, compatibility and security reviews before installation.
4. Build approved installation plans and deploy only compatible authorized components, with rollback.
5. Expose commands through the user's Clouder Pro interface where supported, and through the independently hosted GitHub Pro mobile controller. The third-party Clouder app cannot be controlled directly by this repository.
6. Configure and test GitHub ↔ Cloudflare authenticated workflow dispatch, callbacks, audit trails, and incident alerts.
7. Test the live dashboard and deployment. **Neither live mobile control nor Clouder Pro authorization is verified by this document.**
