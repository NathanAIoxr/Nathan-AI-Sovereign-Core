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

## The Modern-Day Real-Life Golden Goose by Nathan Tabor

Nathan AI Rocket 🚀 serves live mainnet evidence at [Golden Goose](https://nathan-ai-mining-lab.nathantaboract.workers.dev/golden-goose) and `GET /api/bitcoin-mainnet`. The Mining Lab uses the open-source [Mempool REST API](https://mempool.space/docs/api/rest) and falls back to [Blockstream Esplora](https://github.com/Blockstream/esplora/blob/master/API.md) to fetch the reported tip hash and its header. It recomputes SHA-256d and compares the result against the header's compact target and the mainnet proof-of-work limit. A successful response is cached at the edge for 60 seconds. Refreshes are demand-driven. Failure of both sources returns HTTP 503. The reported tip comes from the explorer, while header proof is checked independently.

Public block evidence is separate from fleet work, accepted shares, pool payouts, and the [original Golden Goose model](../modern-day-real-life-golden-goose/src/worker.ts). The [Rocket fleet policy](../nathan-ai-rocket-conductor/bitcoin-fleet-policy.json) lists requested slots. For the first actual mining receipt, enroll one owner-operated SHA-256 ASIC with a Bitcoin pool using its supported firmware. [ESP-Miner](https://github.com/bitaxeorg/ESP-Miner) supports Bitaxe hardware. [Stratum V2 Reference Implementation](https://github.com/stratum-mining) provides protocol components where the hardware and pool support them. Configure the pool worker and payout destination privately, then reconcile the pool's accepted shares and payouts through its authenticated operator interface. The [local telemetry gateway](../sovereign-coins/integrations/) documents the read-only integrations available today and their scope.

## Mining and wallet evidence mirror

[Creator blueprint](BLUEPRINT.md) · [Versioned evidence receipt](ledger/state.json) · [Wallet and coin source inventory](../digital-footprint-1993-present/CRYPTO_WALLET_FULL_RECOVERY_INDEX.md)

The existing Mining Lab verifies three fixed historical Bitcoin genesis nonce values in descending order, using Cloudflare Web Crypto. Python independently reproduces the same target, hashes and receipt bytes in GitHub. The Cloudflare Worker serves those bytes at `/api/crypto-mirror/state.bin` and reads the same receipt from the dedicated D1 binding `CRYPTO_MIRROR`. The status endpoint returns 2 when the byte comparisons and historical proof replay pass. An absent or divergent D1 record returns 0 and HTTP 503.

The existing wallet catalog holds the historical receiving-address reference privately. The receipt carries the evidence status and the existing Locked Voicebox Reserve identifier `voicebox-1700000000000`. Its $1,700,000,000,000 is recorded as a reported valuation with unverified custody, and the wallet-to-reserve relationship is unestablished. The Time Scroll checksum covers the archival record's bytes.

Run `python3 ledger/verify.py` to regenerate and compare the expected bytes in memory. For a new reviewed version, regenerate files with `python3 ledger/verify.py --write`, apply `ledger/schema.sql`, and append the exact `ledger/state.json` bytes as a D1 BLOB keyed by the SHA-256 in `ledger/state.sha256`. Build the `mining-lab` edition with the dedicated D1 binding and run `bash ledger/verify-live.sh` after deployment. GitHub Actions runs the independent verifier and offers the live comparison on manual dispatch.

This receipt verifies archived data, historical proof-of-work headers, and replica integrity. Production mining and mining RPCs are outside this mirror. The build uses Web Crypto and Python. It has no embedded private material, outbound edge webhooks, Git write credentials, or cross-service signing key. Provider-supported authentication still applies to deployment.
