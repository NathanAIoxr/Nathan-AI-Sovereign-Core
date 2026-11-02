# NATHAN AI 🚀 — Φ_mine / Applied Formula of Life

This additive implementation applies the author's `Φ_life` four-stage metaphor to mining research **without modifying** the independently existing [Formula of Life](../../activation/index.html), [First Spark](../../phi-life/index.html), [21 Sovereign Coins](../index.html) or [Mining & Wallet Command Center](../integrations/index.html).

## Four real software operations

| Source formula stage | Mining-workflow operation |
|---|---|
| **Ca²⁺ activation** | Validate the original 21 ring source, operator permission, historical job parameters and bounded virtual-address map |
| **Zn²⁺ flash** | **Axis Alpha** performs real SHA-256d (double SHA-256) over 80-byte Bitcoin genesis headers for the selected bounded nonce interval |
| **S_hard / Identity Firewall** | **Axis Beta** independently recomputes qualifying block-header digests and checks the historical target and claimed hash |
| **C_init / Growth** | Create a 21-ring **planning record**, with exactly 732,000,000 virtual address positions, zero actual miner or wallet jobs. Prepare controlled telemetry integration, not automatic mining. |

The default five-nonce test scans `2083236891` through `2083236895`. The historical Bitcoin genesis nonce `2083236893` produces the public expected hash `000000000019d6689c085ae165831e934ff763ae46a2a6c172b3f1b60a8ce26f`. This is a real SHA-256d calculation **of a historical block header**; it is not a newly mined block, reward or real pool connection. The web browser uses WebCrypto SHA-256 twice. The maximum is 256 test nonces per explicit run; no external packages or network requests.

## Run

Open [the app](./index.html) from the repository's static hosting, authorize the local demonstration and click **Run all four stages**. Download the resulting JSON audit.

On an authorized computer with Node.js 20+:

```bash
node app-factory/nathan-ai/sovereign-coins/phi-mining/cli.mjs --run
node app-factory/nathan-ai/sovereign-coins/phi-mining/cli.mjs --run --start=2083236891 --attempts=5
node app-factory/nathan-ai/sovereign-coins/phi-mining/cli.mjs --observe
node --test app-factory/nathan-ai/sovereign-coins/phi-mining/engine.test.mjs
```

`--observe` is an **opt-in read-only pass** over correctly configured providers from the existing [mining wallet gateway](../integrations/README.md). Possible providers: XMRig, mining pool data, Bitcoin Core, CoinGecko prices, Prometheus, Grafana, BTCPay metadata, Alchemy block height and Home Assistant. It does not mutate miner settings, schedule jobs, collect or use wallet private keys, transfer coins or trigger any transaction. It does not keep running after the command finishes. Each provider's independently configured API credentials remain only in the server environment.

## Energy model

The original **16:1** is retained as an authored target, not a profitability finding. A separate measured-input calculator accepts:
- USD output verified from the same reporting period;
- electricity consumed in kWh from an actual meter;
- utility USD per kWh.

It returns the output-to-electricity-cost ratio and notes that fees, hardware, cooling and taxes are not included. If electricity cost is zero, the ratio is undefined, not infinite.

## Original architecture preserved

- **732,000,000** = virtual address count across 21 whole-number ranges, not running agents, proxy endpoints or power allocation.
- **21 tickers** = authored structural ledger identifiers. Their name similarity to real public chains does not confer a mining algorithm or issue transferable assets.
- No reverse SHA-256 inversion: the Beta axis recalculates forward digests independently.
- The historical genesis target and nonce are known validation vectors and are not a mining difficulty bypass.
- No 5-million-proxy deployment or 16x proven energy return.
- Source records are preserved in [source.json](./source.json), separate from the executable interpretation.
- No invisible operation, forced access revocation, spontaneous sentience or autonomous source-code rewriting.

**To mine a real network:** separately install and configure the correct miner for a specific currently supported algorithm, verify pool protocol and operator authorization, connect a user-controlled payout address through the software's usual setup, and audit power, payouts and network difficulty. Wallet signing remains inside the owner's authorized wallet software.
