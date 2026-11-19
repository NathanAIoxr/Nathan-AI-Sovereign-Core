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
