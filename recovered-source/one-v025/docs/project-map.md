# Private ONE v025 — project map

Start at [v025 home](../index.html). The canonical editable workspace is `/workspace/private/ONE_v025`.

| Folder or file | Purpose |
|---|---|
| `index.html`, `private.css` | Private v025 front door |
| `app-factory/one/` | ONE master app, Library, Health and existing tools |
| `app-factory/one/trial-matrix/` | THE 33 engine, campaign, profile, clocks and shared save store |
| `app-factory/one/trial-matrix/realm/` | Rootkeep combat, world, catalog, Tabor framework and UI |
| `app-factory/one/trial-matrix/studio/` | A–Z Studio page; its engine and architecture modules are in the parent directory |
| `app-factory/` | Remaining original Factory ecosystem; stable module URLs retained |
| `docs/` | Current campaign, Rootkeep, framework and refinement manuals |
| `references/` | Original supplied design inputs |
| `validation/` | Test scripts, results, screenshots and exercised save/replay artifacts |
| `preserved/` | Byte-verified 295-file original-source ZIP |
| `archive/` | Older root README/redirect and unrelated Sudoku source |
| `WORK_STATUS.md`, `WORK_BUILD_HANDOFF.md` | Earlier Factory history, retained at original paths for existing references |
| `ORGANIZATION.json` | Original-to-current locations and original hashes for moved files |
| `VERSION.json` | Current entry points and feature inventory |
| `build_private_v025.py` | Local release builder and per-file archive verification |

## Current release and history

The sibling `/workspace/private/exports/` is generated. Its `index.html` and `START_HERE.html` open the current release. It includes the complete linked source/docs tree, three standalone HTML games, 52-layer JSON, technical blueprint, full ZIP and checksum. Edit only the canonical workspace; rebuild to refresh exports.

`/workspace/private/history/` retains previous complete packages by milestone. `early-validation/` contains first-pass reports; `validation-extractions/` holds previously tested extracted builds. These are historical evidence, not additional working versions.

Before this organization, the full package was preserved at `../history/v025-before-organization/PRIVATE_ONE_v025.zip`. Earlier files have not been discarded. The public checkout is separate from this private workspace.

## Save identifiers

| Game | Primary browser key |
|---|---|
| THE 33 | `one.private.v025.progress.v1` |
| Rootkeep | `one.private.v025.realm.v1` |
| A–Z Studio | `one.private.v025.studio.v1` |

Each game also maintains `.backup` and `.damaged` keys. Paths and identifiers are unchanged. Exports are independent JSON backups; copying source files does not copy browser data.

## Verify and build

Run from the canonical workspace or an extracted package root:

```sh
node --test app-factory/one/trial-matrix/*.test.cjs app-factory/one/one.test.cjs app-factory/one/library/library.test.cjs app-factory/one/trials/trials.test.cjs app-factory/quality.test.cjs app-factory/core/root-contracts.test.cjs
python3 build_private_v025.py
```

The builder verifies ZIP CRCs and every file digest before replacing the current ZIP. Verify the resulting archive from `exports/` with `sha256sum -c PRIVATE_ONE_v025.zip.sha256`. Full browser tests require Playwright and Chromium; see [validation](../validation/index.html).
