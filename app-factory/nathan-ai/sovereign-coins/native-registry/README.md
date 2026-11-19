# Nathan AI Mining & Wallet · Sovereign Coin Registry

[Open the registry](https://nathan-coin-catalog.nathantaboract.workers.dev/registry) · [Mining Lab](https://nathan-ai-mining-lab.nathantaboract.workers.dev/) · [Wallet Command Center](../integrations/index.html)

The intake contains 88 A–Z listings after splitting FTM/S and LUNC/LUNA, seven numerical references, twelve glyph/design references, and eight Nathan AI core concept records. The import retains the submitted descriptions and the original SQL seed details in each applicable row. Seven additional public assets and all 21 original rings bring the total to 143 records. IDs use namespaces because public tickers, design labels, glyphs and historical records can overlap. DOG/BOSSMAN, D0G and DOGE identify separate records. Greek π is a design and public PI identifies Pi Network. The original ring order and the SIN/SEN design allocations come from [the matrix source](../registry.json).

The default view shows 88 native assets. It includes DOGE because the attachment explicitly included its native chain. The connected-networks view holds CELO, GLMR and STX. HNT and ZEN are recorded in the exclusions with their migration sources. Legacy tickers, glyph references, unconfirmed identifications and authored designs each have their own identifiers and classifications. Listings describe native-asset roles and do not certify chain activity, liquidity, or wallet support. The 16:1 output-to-electricity ratio is the author's design target. The [Wallet Command Center](../integrations/index.html) and [four-stage mining lab](../phi-mining/index.html) already calculate it from entered figures.

The original Cloudflare catalog remains available at `/coins` and `/coins/summary` on **nathan-coin-catalog** (42 artwork entries and 21 matrix records). The [64-position restoration](https://nathan-ai-crypto-64.nathantaboract.workers.dev/restoration) tracks 42 identified slots and 22 open slots. The two archives overlap with authored concepts. Their counts should not be added to estimate unique coins or network launches.

## API

- Mining Lab: `GET /coins` and `GET /coins/summary`. On the catalog Worker use `/coins/sovereign` and `/coins/sovereign/summary`.
- Query parameters: `q` searches symbols, network names, descriptions, algorithms and qualified IDs. `scope` accepts `native`, `connected`, `historical`, `review`, `design`, `symbols` or `all`. `group` accepts `A-Z`, `NUMBERS`, `SYMBOLS`, `NATHAN_AI_CORE` or `MATRIX21`. The symbols and design groups infer their respective scope. `letter` filters the A–Z section by ticker initial.
- `POST /verify-hash` accepts `{"algorithm":"SHA3-512","encoding":"utf8","data":"abc"}`. Use `SHA-256` or `SHA3-512`; specify `hex` for byte pairs. Supply an optional fixed-width hexadecimal `expected` digest or hexadecimal `target`. Targets are compared as unsigned, big-endian integers with BigInt. Bitcoin's double-SHA-256 and compact header target remain available through the existing Mining Lab.
- `GET /coins/bounties`, `/coins/bounties/stats`, `/coins/bounties/work` and `/coins/bounties/intake` connect to the live Global Bounties Worker. On the catalog Worker add `/sovereign` after `/coins`. The bounty catalog has 14 source-backed records in the verified snapshot. Prize intake and civic work each contain 101 source items, with intentionally different roles and possible overlap. The submitted figure of 341 has no matching source in this import.

## Build and deploy

```sh
node build.mjs seed > coins_seed.sql
node build.mjs master > master_deploy.sql
node --test worker.test.mjs
```

The master build combines the registry tables and rows with the GitHub-backed bounty schema and seed for a clean database. Production keeps the live bounty catalog in its own D1 database, so catalog updates have one source of truth.

For the catalog Worker, upload `worker.mjs`, `legacy.mjs`, `hash.mjs` `page.mjs` and `noble-sha3.mjs` as ES modules. Keep `DB` bound to the existing catalog D1 database. Bind `BOUNTIES` to `tabor-bridge`. Apply `coins_schema.sql` and the generated coin seed to that D1 database. For the existing Mining Lab use the Crypto Suite build script, keep `COIN_SOURCE` and bind `SOVEREIGN_REGISTRY` to `nathan-coin-catalog`. The Wallet Command Center links to this registry from its GitHub Pages and localhost views. Wallet signing, private keys, and miner-control operations are outside these routes.

## Cryptography dependency

SHA-256 uses built-in Web Crypto. SHA3-512 uses the pinned [@noble/hashes 2.4.0](https://www.npmjs.com/package/@noble/hashes/v/2.4.0) implementation because Workers lacks native SHA-3. The vendored ES module is an unminified, tree-shaken bundle of the package’s `sha3_512` export. Its upstream terms remain in `noble-LICENSE.txt`.
