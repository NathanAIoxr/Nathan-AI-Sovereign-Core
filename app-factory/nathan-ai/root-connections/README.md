# Nathan AI Root Connections

Adds a local-file graph explorer beside the existing Nathan AI modules. Open `index.html`, then select the connected `nathan_root_codex.json`. The full owner codex and source archives stay outside this public repository.

Search exact Unicode labels, inspect original records and typed incoming/outgoing edges, find shortest graph routes, and export the currently loaded graph. File reading and graph search occur in the browser; this module makes no upload or inference request. It does not automatically persist imported data. The limits are 25 MiB per import, 20,000 nodes, and 100,000 edges.

Graph traversal works in both directions, but it does not reverse a historical derivation or turn a comparison into identity. Same-label, reconstructed ancestry claims, phonetic/graphic comparisons, creator-defined relations and semantic references retain their own edge types.

The additive private codex preserves its original root families and matrix positions, then links the recovered forty-branch matrix, source-code graph, previous connected encoding ledger, master architecture and current root list. Import status does not certify every historical claim in those sources.

Test: `node --test app-factory/nathan-ai/root-connections/engine.test.cjs`.

The engine tests cover malformed imports, distinct Unicode records, shortest paths, reverse traversal and disconnected nodes. A physical-device/browser usability test remains separate. This branch does not modify the canonical Nathan AI declaration or existing source modules.
