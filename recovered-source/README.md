# Recovered original source

The owner explicitly approved public publication of these previously private source packages in this recovery session. Original filenames and labels such as “private v025” remain unchanged inside preserved files; they describe their earlier status. This directory contains actual source bytes and delivery packages, not just project descriptions.

## Open and use the source

| Location | Contents |
| --- | --- |
| [ONE v025](one-v025/) | Complete editable 384-file source snapshot, including THE 33, Rootkeep, A–Z Studio, Tabor Decimal System and original backup |
| [ONE v025 home](one-v025/index.html) | Snapshot entry page; serve the repository locally and open this path |
| [Earlier v025 packages](one-v025-history/) | Four complete earlier ZIP versions, checksums and historical validation records |
| [THE 33 original delivery](the-33-original-delivery/) | Complete source ZIP, standalone game, delivery documentation and historical test artifacts |
| [Seven pasted originals](original-pasted-sources/) | Exact original pasted text documents, with attachment identifiers retained |
| [Additional local artifacts](additional-local-artifacts/) | 24 additional distinct artifacts, including the latest complete export ZIP and standalone exports |
| [Branch source versions](github-branches/) | 1,259 distinct Git source blobs and provenance for 148 historical branch snapshots |
| [Summary](RECOVERY-SUMMARY.json) | Counts and the exact baseline main commit |
| [Original-byte manifest](SHA256-MANIFEST.json) | SHA-256 and byte length for all 1,703 preserved files |
| [Remaining gaps](REMAINING-SOURCE-GAPS.json) | Named original packages and source references that still lack accessible originals |

To open the complete recovered ONE snapshot from a clone:

```sh
python3 -m http.server 8765 --bind 127.0.0.1
# Open http://localhost:8765/recovered-source/one-v025/
node --test recovered-source/one-v025/app-factory/one/trial-matrix/*.test.cjs
python3 -B tools/recovery/recover.py --verify
```

The restored snapshot is independent of the newer live app tree. Its original URLs resolve within its own source root. Its original build script was preserved unchanged; generated exports should be written outside the source checkout.

## What the comparison establishes

The audit examined main commit `5d682ade28b1558fabb273bc45cc706fa2a3c84d`, all 149 remote branch heads, available local source, exported deliveries, prior version packages and original attachments. It found:

- 319 file paths present on branch heads but absent from main.
- 1,261 path/version pairs, representing 1,259 distinct blobs, absent by exact bytes from main. Many are historical variants of existing files; they are not all missing new features.
- 160 of the 384 ONE v025 files had exact bytes absent anywhere on main. The other 224 were already present by bytes, sometimes at different paths.
- Seven original pasted documents and the 11-file THE 33 delivery were absent by exact bytes from main.
- 24 further distinct artifacts were found while comparing 1,152 export and validation-extraction files. Duplicate extracted copies were not copied again.

All 148 branch reconstruction plans were checked against their original Git trees. One full 371-file historical branch was restored and verified byte-for-byte, including executable modes. The recovered ONE v025 game passed 185 tests during this recovery. Historical test logs inside packages remain historical evidence, not newly run results.

These are file-preservation counts. They establish neither “10% complete” nor “100% complete” for the creator's entire history. No authenticated ChatGPT conversation-history source is available in this session. Unavailable conversation attachments and ZIPs cannot be recovered from their names alone.

## Restore a historical branch without overwriting current work

The branch manifest records each original commit, changed files, removed files and baseline commit. `.source` files retain exact Git blob bytes under their Git SHA-1 names; they are stored as archival source rather than active pages or programs. SHA-256 is recorded separately in the preservation manifest.

From a full Git clone containing the baseline commit:

```sh
python3 -B tools/recovery/recover.py --branch codex/shared-material-worlds-20261020 --out ../restored-material-worlds
```

Choose an exact branch name from `github-branches/manifest.json`. The destination must not already exist and must be outside this checkout. Restoration writes files only; it does not execute historical code. Current app routes and newer source versions are not overwritten.

## What still needs original source

The existing 357-record Program Jobs catalog includes implementation paths, historical names, design records and archive anchors. A source-presence audit found 184 records with local source paths, 92 historical names requiring source and 67 design records requiring implementation mapping. These overlapping records are not independent completed products.

The gap register compares 19 explicitly named original files/packages from the catalog and handoff against available filenames, including ZIP members. Eighteen have no matching filename in the examined material. The existing Universal Language Database ZIP is already on main; matching a filename alone does not prove the identity of another original. The missing v073 app, original recovery indexes and named Work ZIPs remain unresolved.

Before integrating a recovered implementation into a live application, review dependencies, original-source identity, tests and deployment behavior. Preserving every available original is a separate result from merging every historical branch or completing every named program.
