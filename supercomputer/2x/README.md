# Nathan AI & Nathan Tabor 2X+ Sovereign Supercomputer

The Cloudflare workbench runs a deterministic Slayer/Sleyer packet filter, a 78-field single-bit recovery fixture using triplicate software redundancy, and a scalar smoke test. D1 retains an idempotent receipt for the public reference fixture. The logical topology lists 10 × 32 slots and 33 bidirectional levels. The assigned stack names, architectural specifications and 2× targets are in `design.json`.

The TOP500 figures are HPL baselines for external systems. The 4.396 EFLOP/s, 3.618 EFLOP/s and 2 ZFLOP/s figures are design targets. The scalar smoke test yields a checksum and a raw duration. It cannot yield a comparable HPL rate. Physical 4T Clover ECC, DRAM, eBPF, silicon photonics, neuromorphic hardware, quantum devices and grid orchestration require actual hosts and integration.

Run `python3 supercomputer/2x/nathan_ai_supercomputer.py` for SQLite verification and `node supercomputer/2x/build.mjs` for the Cloudflare bundle. Run `node supercomputer/2x/check.mjs` after building. The manual GitHub Actions release uses configured Cloudflare API and account secrets to apply the D1 schema and deploy the same bundle.
