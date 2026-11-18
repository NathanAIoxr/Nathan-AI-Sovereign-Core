# TABOR CORP Sovereign Currency

The original 21 Sovereign Coin Matrix browser app runs on Cloudflare Workers with its local ledger and efficiency calculator. SIN and SEN each have 1,000,000 initial design units. The other 19 allocations are unspecified in the source CSV. These are design records and browser-local events. Cross-app balances, issuance, wallet transfers, valuation reserve access and pool mining require separate implementations.

Run `node sovereign-currency/build.mjs` from the repository to bundle the existing app and deploy the generated `sovereign-currency/dist.mjs` as the `tabor-sovereign-currency` Worker. The optional argument is an absolute path to a checkout of the original app directory. The Tabor World gateway source snapshot in this directory adds the currency destination.

## Verification

`GET /api/genesis` scans five historical nonce candidates, then recomputes the qualifying header hash and checks the target. The expected nonce is 2,083,236,893. Run the original multiprocessing reference locally with `python3 sovereign-currency/tabor_sha256d_mirror.py --demo`.

The source architecture lists Alephium, Quai and Iron Fish as network targets and describes 33 levels, 5 million proxies, and a 16-to-1 efficiency multiplier. The multiplier is an unverified design claim. The deployed verification covers the fixed Bitcoin header vector. The recovered Python original is an offline reference. Deployment does not establish a running network miner or production token contract.

## Expanded coin catalog

The searchable `/coins` catalog and `/api/coins` JSON preserve the 21-ring roster, nine Tabor World law coins, four 2025 SIN/SEN records, and additional historical coin definitions. Repeated names stay attached to their source families. The earlier assistant proposals are labeled as hypothetical drafts. The seven external reference assets have their own section, with the complete 7/7/7 reference available at `/api/conspectus`.

The historical crosswalk is preserved in `coin_systems_and_values.csv`. `tabor_world_crypto.py` is the recovered offline reward simulator and is independent from the browser-local 21-ring ledger.
