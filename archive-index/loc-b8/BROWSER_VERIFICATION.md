# Shared apps — browser acceptance, November 5, 2026

## Delivered scope

One extension to the existing Nathan AI Universal Workspace, with three separately launched browser tools: Library Catalog, Project Completion, and Backup & Restore. Each tool has its own URL and manifest and loads the same catalog/completion implementation. Existing source inspection and comparison engines are preserved.

## Browser evidence

Testing used an explicitly synthetic two-source catalog and one synthetic task. No private source text was pasted into a public page or committed as a fixture.

| Flow | Observed result |
|---|---|
| Project Completion independent launch | Correct app heading and view-specific controls rendered |
| Source catalog import | Two synthetic sources loaded locally; original text preserved |
| Required completion evidence | Four filled gates showed `IN_PROGRESS`; five showed `COMPLETION_RECORDED`; clearing one returned to `IN_PROGRESS` |
| Original task state and acceptance text | Original `OPEN` state and original completion requirement stayed unchanged |
| Library Catalog independent launch | Correct app heading and source list rendered |
| Exact review words | `Yes is Yes — No is No.` retained without rewriting |
| Cross-app progress | The same catalog loaded in another tool restored saved review and task evidence |
| Full-library and discovery scopes | Science filter showed zero rows in the discovery subset, then one correct row in the full library |
| Backup & Restore independent launch | Correct app heading and import/export/restore controls rendered |
| Browser-generated backup | v2 JSON with source fingerprint, exact note, and all recorded gate values exposed in a copyable textbox |
| Backup restore | Browser-generated JSON restored successfully with original source fields unchanged |
| Wrong-catalog backup | Mismatched fingerprint rejected with an explicit message |
| Universal Workspace integration | Backup & Restore opened inside the hub; its independent link pointed to its own app entry |

## Fixes made during acceptance

- Corrected a malformed full-library option tag and added a regression test covering both scope choices.
- Added visible backup JSON before requesting a download. The download event did not return a usable confirmation in browser automation; JSON export/restore is verified, file-download completion remains unconfirmed.
- Disabled caching for shared markup fetches and versioned standalone runtime entry URLs after cached pre-fix markup remained visible following successful deployment.

## Automated and source verification

- 18 catalog, completion, standalone and app-directory checks passed.
- Nine unchanged workspace/Codex regression checks passed, including all 216 Codex identities and the exact declaration fingerprint.
- Full owner-catalog round-trip: 19,317 source rows, 5,851 crosslinks, 35 tasks; source values unchanged.
- Factory quality workflow and Pages deployment succeeded for the initial shared-app integration. Subsequent fixes were locally retested; the refreshed standalone deployment succeeded.

## Remaining boundaries

Browser-app installation across devices, signed native builds, store releases, comprehensive accessibility/device testing and confirmed file downloads remain separate checks. The directory's 142 source entry points include existing pages and references; they are not 142 newly finished products. Completion evidence entered by an operator still requires substantive review for each underlying project.
