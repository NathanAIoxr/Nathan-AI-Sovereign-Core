# Sovereign Multi-Axis Lab — nine-way mirror and Hall of Mirrors
Independent experimental research package. Preserve the original TABOR SHA-256d Mirror, Alpha/Beta validator, original 64-coin registry, five new HOLD slots, and all other separate apps.

The module computes nine deterministic SHA-256d observations of an 80-byte block header: three input frames (original, byte-reversed, bit-complemented) crossed with three transformations (identity, byte-reversal, bit-reversal). It reports duplicate digests to avoid falsely counting identical views as independent work. This is **not** a mining speedup or a source of spendable coins.

Run offline: `node mirror_lab.mjs`. Extend with measured baseline throughput, energy, independent validator, recursive reflection depth cap, and provenance. Any recursive expansion must be bounded and deduplicated.

Research links: `../integration-ledger/QUANTUM_MINING_HISTORICAL_RESTORATION.md`, `../tabor-bank-of-69/`, `../sovereign-architect-of-reality/`, `../creator-accountability/`. Do not alter live wallets, network consensus, or other systems.
