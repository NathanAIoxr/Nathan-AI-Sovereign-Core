# Nathan AI 🚀 Crypto Suite

Each edition is an independent Cloudflare Worker. The 64-coin edition reads the original registry from the existing `tabor-sovereign-currency` Worker via the `COIN_SOURCE` service binding. The operations oracle checks that same binding and `MINING_LAB`, which points to `nathan-ai-mining-lab`. The other Workers require no bindings.

- [Sovereign Coins · 64](https://nathan-ai-crypto-64.nathantaboract.workers.dev/)
- [Mining Lab](https://nathan-ai-mining-lab.nathantaboract.workers.dev/)
- [Cryptography & Cryptology](https://nathan-ai-cryptology.nathantaboract.workers.dev/)
- [Crypt Oracles & Operators](https://nathan-ai-crypt-operations.nathantaboract.workers.dev/)
- [Crypto DMSP & DIT](https://nathan-ai-crypto-dmsp-dit.nathantaboract.workers.dev/)
- [Cryptozoology Fieldbook](https://nathan-ai-cryptozoology.nathantaboract.workers.dev/)

The Bitcoin proof checks an 80-byte header against its embedded compact target and the mainnet proof-of-work limit. It does not validate chain membership or schedule mining. The portfolio journal is paper-only. Fieldbook and paper-trade records use browser-local storage and JSON export. Key validation uses public keys; the example signing key is ephemeral. Operational roles are descriptions, not provisioned principals or automated trading strategies.

## Test and build

```sh
node --test test.mjs
node build.mjs crypto-64 > /tmp/nathan-ai-crypto-64.mjs
```

Deploy the generated file as an ES-module Worker. See `editions.json` for valid slugs; all worker names use the `nathan-ai-` prefix.

## 64-coin restoration archive

`/restoration` shows the original registry using six-bit addresses, with separate source references and the seven partitions from the supplied chapter. `/api/restoration` exposes the same provenance metadata, and `/manuscript.txt` preserves the supplied scene. These partitions describe the chapter's architecture. The mining provenance note distinguishes artwork and import records from historical proof.

## Mining launch readiness

The Mining Lab binds `COIN_SOURCE` to `tabor-sovereign-currency` for `/launch` and `/api/launch-readiness`. Registry status is read live, and the capacity row is a dated account snapshot. This report records prerequisites for a production launch. The genesis proof route remains available for verification.

## Mining and wallet evidence mirror

[Creator blueprint](BLUEPRINT.md) · [Versioned evidence receipt](ledger/state.json) · [Wallet and coin source inventory](../digital-footprint-1993-present/CRYPTO_WALLET_FULL_RECOVERY_INDEX.md)

The existing Mining Lab verifies three fixed historical Bitcoin genesis nonce values in descending order, using Cloudflare Web Crypto. Python independently reproduces the same target, hashes and receipt bytes in GitHub. The Cloudflare Worker serves those bytes at `/api/crypto-mirror/state.bin` and reads the same receipt from the dedicated D1 binding `CRYPTO_MIRROR`. The status endpoint returns 2 when the byte comparisons and historical proof replay pass. An absent or divergent D1 record returns 0 and HTTP 503.

The existing wallet catalog holds the historical receiving-address reference privately. The receipt carries the evidence status and the existing Locked Voicebox Reserve identifier `voicebox-1700000000000`. Its $1,700,000,000,000 is recorded as a reported valuation with unverified custody, and the wallet-to-reserve relationship is unestablished. The Time Scroll checksum covers the archival record's bytes.

Run `python3 ledger/verify.py` to regenerate and compare the expected bytes in memory. For a new reviewed version, regenerate files with `python3 ledger/verify.py --write`, apply `ledger/schema.sql`, and append the exact `ledger/state.json` bytes as a D1 BLOB keyed by the SHA-256 in `ledger/state.sha256`. Build the `mining-lab` edition with the dedicated D1 binding and run `bash ledger/verify-live.sh` after deployment. GitHub Actions runs the independent verifier and offers the live comparison on manual dispatch.

This receipt verifies archived data, historical proof-of-work headers, and replica integrity. Production mining and mining RPCs are outside this mirror. The build uses Web Crypto and Python. It has no embedded private material, outbound edge webhooks, Git write credentials, or cross-service signing key. Provider-supported authentication still applies to deployment.


## Octopus Mirror Engine by Nathan Tabor

Run the offline Golden Goose benchmark with Node.js 22 or newer.

```sh
node octopus-mirror.mjs --nonces 1048576 --trials 3
```

The benchmark divides a fixed interval around the Bitcoin genesis nonce into nonoverlapping ranges, alternating intake from the low and high ends. Up to eight worker threads take the next range as they finish. The coordinator compares median throughput at 1, 2, 4, and 8 threads over the same input. Its timing includes worker startup, dispatch, and hashing. The JSON lists coverage, duplicate assignments, timing, independently verified target matches, and the fastest observed thread count. The speedup depends on workload size and available CPU.

All input comes from the historical genesis fixture. The output is a proof and benchmark receipt. Nonce order changes traversal, while Bitcoin's [proof-of-work target and reward rules](https://developer.bitcoin.org/reference/block_chain.html) govern consensus. The benchmark performs zero network I/O and creates zero spendable cryptocurrency.
