# Nathan AI — Attributes, Characteristics & Functionalities

Creator: John Nathan Tabor. Additive extension to the existing Nathan AI / ONE / TABOR Factory ecosystem. Originals remain in place.

## Source-authored identity

Preserve these two exact formulations:

- node = mind = node
- mind = node = mind

In the owner's authored framework, node and mind denote the same thing, differently spelled. Do **not** reinterpret as mirrors, opposition, inversion, anagrams, or the MindNode commercial product. Do not mistake the author's proposed identity definition for empirical evidence that electronic or software nodes are conscious.

## What was sifted and sorted

The GitHub main tree was snapshotted via GitHub's recursive tree API, including every returned tracked file and directory in inventory.json. The generator rejected a truncated tree. A repository checkout can be audited more deeply through tools/capability-atlas/scan.cjs, which uses **all** locally tracked Git files (git ls-files) and statically inspects eligible source code. It never executes source files under examination.

The explorer classifies each entry by:
- **Attributes:** exact Git path, immutable Git object hash, file size, tracked entry type, repository area.
- **Characteristics:** source code, test, documentation, structured data, binary artifact, directory, or other file kind.
- **Functionalities:** receive, recognize, remember, retrieve, connect, transform, interpret, evaluate, decide, create, communicate, adapt, protect, restore, sequence, present, measure, execute.

The model intentionally distinguishes:
1. **Path-based candidate:** file/path tokens hint at an area. This does not confirm implementation.
2. **Static source signal:** code patterns reveal a construct such as a fetch call, local storage, or message passing. This is not execution evidence.
3. **Runtime verified:** requires separate, reproducible runtime tests or device observation. The current tool always reports *false*; it does not invent successful execution.

No source contents, secrets, private credentials, or raw matched values are exported from scanning. Only indicator names and Git paths appear in the exported audit. Do not publish private original documents by adding them to this repository.

## How to use

Open the Capability Explorer at ./index.html through GitHub Pages, or serve the repository locally using any static HTTP server (direct file:// viewing is unsupported because the explorer fetches JSON).

Filter by scope, source characteristic, capability candidate, or any path. Inspect eligible code with the **Inspect source signals** action. Export the filtered records to JSON/CSV. The inspection is initiated by the user and reads files from the same deployed repository.

To perform a **full static code sweep** on a checkout:

~~~sh
node tools/capability-atlas/scan.cjs --output /tmp/nathan-capability-audit.json
node --test app-factory/nathan-ai/capability-atlas/engine.test.cjs
~~~

The GitHub Actions check runs this sweep on push and pull request and uploads the report as a workflow artifact, without committing it or modifying original source. The snapshot is fixed to its recorded base tree; source scanning recomputes coverage from the current checkout, and reports newly tracked paths missing from that snapshot.

## Cross-system application

- Nathan AI Main Hub and ONE: navigation to the common explorer.
- Universal Node / Node Runtime / Mind-Neuropath: catalog as independent existing engines, not replicas.
- Source-grounded Assistant: retrieval, provenance, state, communication; source code retains its existing behavior.
- Library Mind / language matrix: source and phrase indexing; do not impose invented linguistic roots.
- Games and creative studios: interface, state, scoring, construction and export capabilities.
- Protection tools: validation, integrity, backup and recovery evidence; no claim of real-device protection without tests.
- All remaining repository files: included in inventory; no file silently omitted on the basis of being unnamed or outside Nathan AI.

**Scope limitation:** The complete repository tree has been indexed. A complete manual, line-by-line audit and runtime verification of every file have **not** been performed. The automated local scanner is the reproducible deeper inspection step. This feature does not rewrite every program or verify every claimed function.

## Regeneration

Use the GitHub recursive-tree API for a fresh tree snapshot, inspect its truncated field, and regenerate inventory.json with the new tree hash. The local scanner independently inventories and reports all tracked files. Preserve previous snapshots as part of the historical audit if a new one is published.
