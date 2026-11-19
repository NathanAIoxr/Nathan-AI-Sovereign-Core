# TABOR CORP Sovereign Currency

The original 21 Sovereign Coin Matrix browser app runs on Cloudflare Workers with its local ledger and efficiency calculator. SIN and SEN each have 1,000,000 initial design units. The other 19 allocations are unspecified in the source CSV. These are design records and browser-local events. Cross-app balances, issuance, wallet transfers, valuation reserve access and pool mining require separate implementations.

Run `node sovereign-currency/build.mjs` from the repository to bundle the existing app and deploy the generated `sovereign-currency/dist.mjs` as the `tabor-sovereign-currency` Worker. The optional argument is an absolute path to a checkout of the original app directory. The Tabor World gateway source snapshot in this directory adds the currency destination.

## Verification

`GET /api/genesis` scans five historical nonce candidates, then recomputes the qualifying header hash and checks the target. The expected nonce is 2,083,236,893. Run the original multiprocessing reference locally with `python3 sovereign-currency/tabor_sha256d_mirror.py --demo`.

The source architecture lists Alephium, Quai and Iron Fish as network targets and describes 33 levels, 5 million proxies, and a 16-to-1 efficiency multiplier. The multiplier is an unverified design claim. The deployed verification covers the fixed Bitcoin header vector. The recovered Python original is an offline reference. Deployment does not establish a running network miner or production token contract.

## Expanded coin catalog

The searchable `/coins` catalog and `/api/coins` JSON preserve the 21-ring roster, nine Tabor World law coins, four 2025 SIN/SEN records, and additional historical coin definitions. Repeated names stay attached to their source families. The earlier assistant proposals are labeled as hypothetical drafts. The seven external reference assets have their own section, with the complete 7/7/7 reference available at `/api/conspectus`.

The historical crosswalk is preserved in `coin_systems_and_values.csv`. `tabor_world_crypto.py` is the recovered offline reward simulator and is independent from the browser-local 21-ring ledger.

## Sovereign Mining & Quantum Core reference

`GET /api/quantum/execute` runs the three-phase BLACK_NOTE isolation, bounded backwards and XOR-complement nonce scan, and neutral restoration of WHITE_NOTES and flat indices 0–3. It reports 64 classical SHA-256d evaluations on the historical Bitcoin genesis prefix and references the attached 21-ring registry. `GET /api/quantum/traits` returns the original hardware and network design parameters.

Run `python3 sovereign-currency/nathan_ai_quantum_miner.py` for the repaired Python reference. Its three phases share one SQLite connection. The Cloudflare endpoint is stateless. Both use classical hashing. The hardware, grid and Stratum values are design parameters.

## D1 Edge Switchboard

Apply `switchboard.sql` to the `nathan-ai-sovereign-db` D1 database and bind it as `SWITCHBOARD_DB`. The `/switchboard` page runs the fixed historical fixture through `POST /api/quantum/receipt`. D1 retains one idempotent receipt per fixture version, retrievable via GET. The endpoint accepts no custom payload. The original live scan remains at `GET /api/quantum/execute`.

The switchboard uses Light for linear traversal, Dark for circular traversal, Slayer for clearing a demo cell (0), and Sleyer for copying a bit to the next demo cell (1). SIN and SEN are registry references in the fixture. The gates operate on an isolated demo register.

## Cryptographic Ledger & Double-SHA-256 Block Verifier

| Route | Function |
| --- | --- |
| `GET /verifier` | Header verification form, ledger and agent downloads |
| `POST /api/pow/verify` | Verify a serialized Bitcoin header and optionally compare its displayed hash |
| `POST /api/pow/ledger` | Record the known historical genesis fixture. Send an empty body. |
| `GET /api/pow/ledger?after=0` | Return up to 25 audited receipts and a continuation cursor |
| `GET /api/agent-downloads` | Return the source ZIP path, byte count and SHA-256 |
| `GET /downloads/tabor-sovereign-agent.zip` | Download the rebuildable source, registry, references and tests |

For verification, pass JSON `{"headerHex":"…","claimedHash":"…"}` or equivalent form fields. Use exactly 160 hex characters for the serialized header and 64 for the optional displayed hash. The verifier reads little-endian `nBits` and nonce fields, decodes the compact target, checks the mainnet proof-of-work limit, computes SHA-256 twice and compares the displayed hash and target. It reports malformed inputs as 400 and failed proof-of-work or hash comparisons as 422. The result has header-level scope. Contextual difficulty, chain membership, merkle inclusion and transaction rules require a full node.

The D1 migration creates an append-only receipt table. The ID commits to a versioned scope, normalized header and computed block hash. D1 enforces uniqueness, and each read recomputes both the proof and receipt ID. The ledger accepts the server-generated genesis fixture. Arbitrary submissions are checked in memory, and the earlier switchboard receipt stays in its own table. The currency app's browser-local ledger continues to handle its 21 design coins.

## Source recovery

John Nathan Tabor's May 24, 2026 Sovereign Multi-Axis architecture models job ingestion, forward hashing, independent mirror verification, hardware placement, network I/O and launch. The Python mirror keeps separate Alpha and Beta queues. The Cloudflare verifier computes classical SHA-256d with Web Crypto. The three-phase BLACK_NOTE and WHITE_NOTE workbench and the Light Slayer, Light Sleyer, Dark Slayer and Dark Sleyer gates retain their existing routes.

The recovered design records name `SovereignSymmetricEngine`, `UniversalSymmetricMatrix`, `UnderTheRadarSovereignMatrix`, `MaximumYieldSovereignMatrix`, `ZeroPowerSovereignMatrix`, `AnchoredSovereignMatrix` and `NathanAISovereignMiner`. The recovery records reference a 33-level design, 5,000,000 proxies, a 16:1 energy-cost return target and 25 network targets across GPU, CPU and AI/validator groups. Names recovered for those networks are Alephium, Quai, Iron Fish, Dynex, Nexa, Qubic, Monero, Bittensor, Phala and Flux. The exact 33-level list and remaining 15 network names are missing from the available sources. [Sovereign Mining Recovery](https://chatgpt.com/library?file_id=libfile_2345370813d4819197f6764e3b741c25&account_id=personal)

The live Hub supplies the mining hardware registry. It covers compute (ASIC, CPU and GPU), ECC memory, NVMe and HDD storage, network, power and cooling. The quantum design separately records 3 nm and 5 nm ASIC targets, Stratum V2 and Noise/ChaChaPoly, hydro and immersion cooling, and grid curtailment. Those are engineering specifications. The deployed verifier has no provisioned mining hardware, proxy endpoints, pool shares, coin issuance or revenue metrics. [Hardware registry](https://tabor-world-hub.nathantaboract.workers.dev/api/runtime/hardware)

## Rebuild and deploy

Use Node 24 and Python 3.11 or newer. From the source root:

```sh
node sovereign-currency/build.mjs
node --test sovereign-currency/proof-ledger.test.mjs app-factory/nathan-ai/sovereign-coins/engine.test.mjs
(cd app-factory/nathan-ai/sovereign-coins && python3 -m unittest test_coin_audit)
python3 sovereign-currency/tabor_sha256d_mirror.py --demo
python3 sovereign-currency/nathan_ai_quantum_miner.py
```

The build writes `sovereign-currency/dist.mjs` and `sovereign-currency/tabor-sovereign-agent.zip`. Apply `switchboard.sql` and `proof-ledger.sql` in D1 before deploying the Worker, then bind the database as `SWITCHBOARD_DB`. The GitHub Actions workflow tests the package and uploads the ZIP. The manual deployment job uses the repository's Cloudflare credentials, the `CLOUDFLARE_ACCOUNT_ID` variable and the `SOVEREIGN_CURRENCY_D1_ID` variable.
