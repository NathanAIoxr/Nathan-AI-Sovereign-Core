# Nathan AI & Nathan Tabor 2X+ Sovereign Supercomputer

The Cloudflare workbench runs a deterministic Slayer/Sleyer packet filter, a 78-field single-bit recovery fixture using triplicate software redundancy, and a scalar smoke test. D1 retains an idempotent receipt for the public reference fixture. The logical topology lists 10 × 32 slots and 33 bidirectional levels. The assigned stack names, architectural specifications and 2× targets are in `design.json`.

The TOP500 figures are HPL baselines for external systems. The 4.396 EFLOP/s, 3.618 EFLOP/s and 2 ZFLOP/s figures are design targets. The scalar smoke test yields a checksum and a raw duration. It cannot yield a comparable HPL rate. Physical 4T Clover ECC, DRAM, eBPF, silicon photonics, neuromorphic hardware, quantum devices and grid orchestration require actual hosts and integration.

Run `python3 supercomputer/2x/nathan_ai_supercomputer.py` for SQLite verification and `node supercomputer/2x/build.mjs` for the Cloudflare bundle. Run `node supercomputer/2x/check.mjs` after building. The manual GitHub Actions release uses configured Cloudflare API and account secrets to apply the D1 schema and deploy the same bundle.

## Background verification

Cloudflare invokes the scheduled handler every five minutes. It checks the 2X+ verifier and the fixed public Super Computer, Sovereign Coin Catalog, Edge Switchboard, and Tabor World Hub endpoints. D1 records one receipt per scheduled timestamp, with seven days of retention. `GET /api/operations` returns the latest 24 receipts with individual outcomes. The schedule executes independently of ChatGPT. Failures are logged and checked again on the next scheduled run.

The scheduled handler uses the CORE, CURRENCY and HUB service bindings for same-account Worker checks.
