# Sovereign App Units by Nathan Tabor

The release preserves the 1,301 entries in the November 18, 2026 app inventory. Every unit has its own identifier, source fingerprint, workstream, GitHub manifest, and owner Cloudflare route. Units cover applications, game titles, modules, utilities, and concepts. The original evidence stage travels with the unit.

[Open the owner workspace](https://tabor-sovereign-app-units.nathantaboract.workers.dev/).

## Build and assignment

Run `node build.mjs /tmp/sovereign-unit-build` from this directory. It compiles and checks one handoff per unit and records 1,301 checksums. The same build runs in GitHub Actions and publishes the handoff artifact.

The existing **Tabor Build Loop** claims 27 deterministic assignment jobs, one for each shard of up to 50 units. Every individual manifest links to its shard job. The **Nathan Tabor Super Computer** has a deterministic inventory-digest verification job. The **Sovereign App Units** Worker uses a scheduled handler and a claim lease to build per-unit packages in the existing owner-controlled D1 database. A handoff package records its exact original evidence, first milestone, and verification requirements.

The owner index shows the current package state, assignment receipt state, and feature work state for every unit. A packaged handoff is the starting point for feature implementation. Existing releases retain their own hosting and source paths.

## Data access

The public repository carries ID-based manifests and an AES-256-GCM copy of the full inventory. Names, aliases, and evidence remain in the owner Cloudflare workspace or sealed archive. To restore the original inventory, save the key from the owner workspace and run:

```sh
node restore.mjs /path/to/owner-key.txt /path/to/inventory.json
```

The restore command verifies both hashes and authenticates the archive before writing a new output file. Keep the key under owner control for independent recovery.
