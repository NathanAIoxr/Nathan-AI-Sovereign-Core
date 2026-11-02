# NATHAN AI 🚀 — THE 21 SOVEREIGN COIN MATRIX

**Authorial source:** user-supplied 21-ring cryptocurrency/mining design, November 2, 2026.
**Placement:** NATHAN AI → TABOR ROOT → TABOR 1-2-3 FACTORY → ONE (linked module, no rebranding or replacement).
**Implementation:** mobile-first, static browser module, JSON design registry, offline local demonstration ledger and Python/JavaScript audit scripts.

[Open the 21 Sovereign Coin Matrix](./index.html) · [Nathan AI Main Hub](../index.html)

## The preserved author-defined 21 rings

The source names, original order and original one-line functional definitions are stored in [registry.json](./registry.json). Names and descriptions are **not** rewritten or collapsed into older token groups.

SIN · SEN · SOV · MNK · BTM · ASR · OXR · ALP · QBC · ZPH · KRN · ALX · SMW · CLV · D0G · GLY · OMN · JNT · LVC · SMC · LFB.

The previously recovered **nine law-coin/points-ledger system** and the earlier **SIN/SEN 2025 demonstration** are separate historical families. Neither is overwritten by this new 21-ring design register.

## I. 21-ring validation and the ledger array

- The registry requires all 21 user-specified entries, order, ticker uniqueness, exact author-defined names and whole-number design allocation fields.
- SIN: **1,000,000 initial design allocation units**.
- SEN: **1,000,000 initial design allocation units**.
- Other 19 entries: initial design allocation **unspecified by the supplied source**, represented as zero in the local numerical model, not asserted as zero eventual token supply.
- The two source allocations sum to **2,000,000 design units**. This does **not** assert 2 million live issued or mined coins.
- The local ledger is created empty, records integer demo events by owner request, prohibits negative balances and supports JSON import/export.
- A source allocation, a local demonstration balance and a verified on-chain balance are **different columns**. No network verified balances are supplied.
- Browser-local ledger data is stored in unencrypted localStorage. It is not a secure wallet, hardware security module or permanent financial record.

## II. Cost-efficiency and mining claims preserved

**Original source statement:** “The Invariant Multiplier (16-to-1): In your live server configurations, the engine achieves a precise $16 output yield for every $1 spent on input electrical energy parameters.”

The app preserves **16:1** as the stated target. It calculates from two *user-entered* values:

- **Output-to-electricity ratio** = entered USD output value ÷ entered USD electricity cost.
- **Net after electricity** = entered USD output − entered USD electricity cost.
- **16× output threshold** = entered USD electricity cost × 16.
- The ratio is undefined for zero input electricity cost (displayed as N/A rather than infinite profit).

This is **not** a measured profit audit or claim of actual mining proceeds. A complete financial profitability model would also require depreciation, equipment, pool/network fees, cooling, rent, taxes, and realized coin revenue.

**Original source statement:** “By routing asynchronous computational weight across the 5-million-proxy architecture, the layout overrides corporate mining difficulty locks, allowing real-time extraction across all 21 rings simultaneously without central intercept.”

That sentence is preserved as a **source claim in registry.json**; the code contains **no proxy deployments, network bypass, consensus difficulty override, unconsented traffic routing, wallets, external transactions, real token issuance or mining payout assertions**.

**Original source statement:** “Master ledger accounts assign an unalterable foundational capitalization weight of 1,000,000 units each to the primary SIN and SEN governance layers before transactional distribution.”

The 1-million figures are **source-defined allocations** and not exchange holdings, proof of deployed contracts, bank balances, market capitalization, or mined payouts. They remain immutable *within the validation rules of this prototype*, not immutable on a public blockchain.

ALP, QBC and ZPH retain the author's exact provided names. Shared ticker strings do not establish ownership, issuance or technical integration with similarly named outside cryptocurrency projects.

## III. Execution scripts

Requires Python 3.10+ (3.11+ recommended) and Node.js 20+ for tests; no dependencies, credentials or wallets.

```bash
python3 app-factory/nathan-ai/sovereign-coins/coin_audit.py --out coin_audit.json
python3 app-factory/nathan-ai/sovereign-coins/coin_audit.py --cost-usd 1 --output-usd 16 --kwh 2
python3 app-factory/nathan-ai/sovereign-coins/coin_audit.py --ledger NATHAN_AI_21_COIN_LOCAL_LEDGER.json --out demo_audit.json
python3 -m unittest discover -s app-factory/nathan-ai/sovereign-coins -p test_coin_audit.py -v
node --test app-factory/nathan-ai/sovereign-coins/engine.test.mjs
```

For the browser demo, serve the repository through HTTPS (GitHub Pages) or a local HTTP server; the application fetches its same-origin registry JSON. Do not open via file:// and expect fetch to function uniformly.

## Provenance and private source handling

- Original concepts, ring names and descriptions supplied in the conversation remain untouched in the JSON registry.
- Citation labels from the source are preserved in the creator's conversation; **private Gmail URLs are intentionally not published to GitHub**.
- Exact private emails or proprietary mining infrastructure logs were not extracted, audited or uploaded by this implementation.
- This module **adds** a separate 21-ring design and lab to Nathan AI; it does not delete the earlier crypto/mining research, rewrite source code for existing programs or publicly publish the user's private records.
- The software does not claim it has a direct connection to a bank, wallet, blockchain miner, proprietary server or 5-million-proxy service.
