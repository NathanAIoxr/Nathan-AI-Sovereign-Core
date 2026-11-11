# Nathan AI Root Connections

Adds a local-file graph explorer beside the existing Nathan AI modules. Open `index.html`, then select the connected `nathan_root_codex.json`. The full owner codex and source archives stay outside this public repository.

Search exact Unicode labels, inspect original records and typed incoming/outgoing edges, find shortest graph routes, and export the currently loaded graph. File reading and graph search occur in the browser; this module makes no upload or inference request. It does not automatically persist imported data. The limits are 25 MiB per import, 20,000 nodes, and 100,000 edges.

Graph traversal works in both directions, but it does not reverse a historical derivation or turn a comparison into identity. Same-label, reconstructed ancestry claims, phonetic/graphic comparisons, creator-defined relations and semantic references retain their own edge types.

The additive private codex preserves its original root families and matrix positions, then links the recovered forty-branch matrix, source-code graph, previous connected encoding ledger, master architecture and current root list. Import status does not certify every historical claim in those sources.

Test: `node --test app-factory/nathan-ai/root-connections/engine.test.cjs`.

The engine tests cover malformed imports, distinct Unicode records, shortest paths, reverse traversal and disconnected nodes. A physical-device/browser usability test remains separate. This branch does not modify the canonical Nathan AI declaration or existing source modules.

## Binary arithmetic anchor

All records in an imported graph share `nathan.arithmetic-anchor.v1`. Import and export preserve the exact node and edge content. The anchor is graph-level metadata: it applies across roots, names, scripts, symbols, reindeer encodings, alchemical records and other imported categories without rewriting their meanings or source claims.

The fixed UTF-8 text is `1+1=2` followed by one LF and `1-1=0`, with no trailing newline. It occupies 11 bytes / 88 bits; SHA-256 is `cf981eac09ffd28cdaea010d43bf46a4d9dcf21ace8808bf4fa33ac41a51deab`. The viewer checks SHA-256 through Web Crypto when available and reports verification errors. Import validates all canonical anchor fields and rejects conflicting supplied anchors. Legacy graphs acquire the canonical anchor in the in-memory view and export; source objects are preserved.

Reusable module: `../../core/binary-anchor.js` (`NathanBinaryAnchor` in the browser, CommonJS in Node). `calculate('build',1,1)` returns decimal value `"2"`, numerical binary `"10"`; `calculate('clear',1,1)` returns `"0"`. Both operations use exact whole-integer arithmetic. Use decimal strings or BigInt for values beyond JavaScript's safe integer limit. Fractions, negative inputs, unsafe numbers and subtraction underflow are rejected. These are anchors and permitted operations for this framework, not replacements for formulas in other disciplines. Text encoding and numerical binary are separate representations of the same declared anchor.

Run: `node --test app-factory/core/binary-anchor.test.cjs app-factory/nathan-ai/root-connections/engine.test.cjs app-factory/octopus-root/codex.test.cjs`.

The hash checks text integrity. Historical and chemical claims still retain their source status. The existing 141-byte ONE REALITY declaration and 216 codex positions remain unchanged. Integration scope is this shared module and graph viewer; other applications must explicitly import the module.
