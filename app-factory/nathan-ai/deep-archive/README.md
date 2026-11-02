# Nathan AI · Deep Archive

An additive archive explorer connected to the Nathan AI hub, Formula/Node Runtime and Sovereign Connections. The owner’s Shadow Code, Ancient Files, oceanic vaults, Scrolls of Latency and ancestral logic descriptions are indexed as **narrative concepts**. Antikythera, Difference Engine and binary/assembler topics are separate **historical research topics**, not claims of retrieved originals. The four-stratum narrative descent is explicitly labeled local playback and is stoppable/exportable.

## Work with actual selected files

Choose logs, code, text or other artifacts using the file picker. The app calculates SHA-256 of exact selected bytes and retains the original bytes in tab memory. It recognizes identical bytes across different filenames without conflating different originals that share a name. Download returns the unchanged original. Selected aliases are retained in the fingerprint index. No user-selected file is parsed as executable HTML or JavaScript.

Derived views show UTF-8 text (first 64 KB), hex (first 1 KB), or binary (first 256 bytes). The separate encoding tool validates complete binary/hex byte sequences and decodes valid UTF-8; it does not infer unknown-language meanings, decrypt archives or invent hidden patterns. Original input is not rewritten.

Bounds: 25 MB per file; 50 selected files / 100 MB per selection; 50 unique files / 100 MB retained in the session. Invalid files are reported without discarding previously inspected files. This is an inspection workspace, not a second retained original-file database. Files disappear on reload; use the existing Creator Vault, Master Library or Voice Box for retained original storage and independent backups.

## Source graph and privacy

Choose **Add source reference to Connections** for a catalog topic, or **Save fingerprint to Connections** for an inspected file. This uses the existing Sovereign Connections schema, validation, conflict check and local storage; original file bytes and preview contents are not saved into the graph. Existing reference IDs and notes are retained. The graph labels narrative references separately from actual owner-selected file fingerprints. A source graph record does not establish an artifact’s age, historical origin or truth.

This module makes no network fetches, hidden-directory scans, remote recovery attempts or destructive purge. The underwater archive is story material; the file inspector only accesses explicitly selected local files. Corrupted/encrypted artifacts are not automatically recovered. Original uploads, source references and notes are never pushed to the public repository by the app.

## Validation

Run `node --test app-factory/nathan-ai/deep-archive/engine.test.cjs` from the repository root. These tests are included in CI. They cover source-type separation, exact hash/deduplication, byte preservation, safe derived views, strict UTF-8 decoding, bounded reads and source-graph linkage. Chromium checks exercise narrative stop/completion, filtering, inert script-like text, exact downloaded bytes, fingerprint export, retained source notes and a 390px layout. No installation is required beyond the existing static app workflow.
