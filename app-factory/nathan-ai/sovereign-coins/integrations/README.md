# NATHAN AI 🚀 — SOVEREIGN MINING & WALLET COMMAND CENTER

**Additive module:** NATHAN AI → TABOR ROOT → TABOR 1-2-3 FACTORY → ONE.
**Date:** 2026-11-02.
**Location:** `app-factory/nathan-ai/sovereign-coins/integrations/`
**Parent:** [21 Sovereign Coin Matrix](../index.html), [Anchored Alpha/Beta Matrix](../anchored/index.html), [Person's Life Matrix](../life/index.html).

## What's installed
- Responsive static dashboard, status cards for all **17** named external providers, source links, entry point in the existing 21-coin page.
- Read-only local Node 20+ gateway with **ten actual adapters**: XMRig, CoinGecko, 2Miners, Braiins Pool, Bitcoin Core, BTCPay, Alchemy, Home Assistant, Prometheus and Grafana.
- Seven provider integration contracts (not connected by default): Hiveon OS, Awesome Miner, NiceHash, Minerstat, Reown AppKit/WalletConnect, Trezor Connect, Coinbase Wallet SDK.
- Browser status and observations present only **actual fetched values**, tagged by provider and timestamp. The 16:1 calculator only evaluates user-entered values. No token supply, coin price, wallet balance, earnings, mining power or proxy capacity inferred.

## Start a local, single-user command center

```bash
# from repository root — Node.js 20+; no npm install needed
node app-factory/nathan-ai/sovereign-coins/integrations/gateway.mjs
```

The gateway prints a random session token once to the local terminal. Open `http://127.0.0.1:8765/`, paste the token into the session field, then select **Check connections** or **Read configured sources**. The token is held in that browser page only and is not persisted.

A public GitHub Pages copy of `index.html` displays the catalog. It does **not** reach your local services or make credentials public.

## Enable read-only sources

Configure these environment variables **on the private computer/server**, not in GitHub, chat, public logs or a web page.

| Provider | Opt-in configuration | Data exposed through local gateway |
|---|---|---|
| CoinGecko | Enabled by default; optionally `COINGECKO_DEMO_KEY`; disable with `COINGECKO_ENABLED=0` | BTC/ETH/XMR USD price references |
| XMRig | `XMRIG_ENABLED=1`, optional `XMRIG_PORT=18080`, `XMRIG_ACCESS_TOKEN` | Local CPU miner hashrate, shares, uptime |
| 2Miners | `TWOMINERS_COIN=etc`, `TWOMINERS_ADDRESS=<public payout address>` | Pool worker and reward counters; currency units need separate reconciliation |
| Braiins Pool | `BRAIINS_TOKEN` | Bitcoin pool network data (not personal payout status) |
| Bitcoin Core | `BITCOIN_RPC_USER`, `BITCOIN_RPC_PASSWORD`, optional `BITCOIN_RPC_PORT=8332` | `getblockchaininfo` only |
| BTCPay | `BTCPAY_BASE_URL=https://your-instance.example/`, `BTCPAY_STORE_ID`, `BTCPAY_API_KEY` | Store name and ID, no invoices or payment writes |
| Alchemy | `ALCHEMY_API_KEY` | Ethereum current block number |
| Home Assistant | `HA_TOKEN`, `HA_ENTITY_ID=sensor.miner_watts`, optional `HA_PORT=8123` | Sensor value and units; **watts are not kWh** |
| Prometheus | `PROMETHEUS_ENABLED=1`, optional `PROMETHEUS_PORT=9090` | Local `up` query target summary |
| Grafana | `GRAFANA_ENABLED=1`, optional `GRAFANA_PORT=3000`, `GRAFANA_TOKEN` | Server health metadata |

**Networking:** Gateway binds **127.0.0.1 only**, rejects unexpected Host/Origin, allows only GET and known fixed commands, requires bearer-token authentication for the read APIs, and never serves an arbitrary file or fetches a URL provided by a browser request. Upstream providers use pinned local loopback URLs or a fixed HTTPS host (BTCPay accepts only an operator-configured HTTPS origin). Secrets never appear in the API response, and provider error text is intentionally limited.

Use SSH local port forwarding or an authenticated VPN for access from another device. **Never expose Bitcoin Core RPC, miner APIs, or the gateway directly to the Internet.** The gateway must not be deployed as a public GitHub Pages server.

## Wallet SDK integration contracts

These SDKs cannot be safely turned into a wallet by dropping a public API key or displaying a balance. Their account/session connections require a client app, supported chain, user authorization, and explicit wallet-device approval:

- [Reown AppKit / WalletConnect](https://docs.reown.com/appkit/overview) — WalletConnect pairing and user-approved session; project ID and supported chains required.
- [Trezor Connect](https://connect.trezor.io/) — user-controlled Trezor hardware signing, with host/device permission.
- [Coinbase Wallet SDK](https://docs.cdp.coinbase.com/) — connect a compatible wallet via supported client SDK; wallet controls custody and signing.

**Future wallet-client safety contract**: no seed phrase, no raw private key, no automatic spending, no default message signing, no transaction broadcast without on-device confirmation, no privileged chain RPC to public pages. Read-only public-address queries can be added by explicit owner authorization. SDK packages and vendor accounts are not installed or linked by this static module.

## Hiveon, Awesome Miner, NiceHash and Minerstat

Listed as **setup-required contracts**, not as falsely connected:
- Hiveon OS: farm/rig account authorization and vendor API documentation.
- Awesome Miner: configure local HTTP API and scoped monitoring credentials.
- NiceHash: signed request authentication and key scopes for account endpoints.
- Minerstat: API key/plan, current endpoint contract, and quota protection.

These need instance/account details before wiring their vendor-specific authenticated routes. No external service is connected or charged by this commit.

## Source / financial separation

Original 21 rings remain exactly in [registry.json](../registry.json). SIN/SEN 1,000,000 units each are **design allocations**. They are not wallet balances or mined revenue. Previously authored nine-law-coin and other coin families remain separate. 16:1 and five-million-proxy ideas remain original authored design assertions, not measured mining profit or actual proxy deployments. A future full electricity efficiency audit needs measured kWh, utility rate, pool-confirmed payouts and the same time window, plus cooling/equipment/fees.

## Tests

```bash
node --test app-factory/nathan-ai/sovereign-coins/integrations/gateway.test.mjs
node --test app-factory/nathan-ai/sovereign-coins/engine.test.mjs
node --test app-factory/nathan-ai/sovereign-coins/anchored/anchored-matrix.test.mjs
```

## API routes (localhost, read-only)

- `GET /health` — local health, without token (no secret/config data).
- `GET /api/providers` — known provider catalog and configured booleans (bearer token).
- `GET /api/read?id=<provider-id>` — normalized read-only remote observation (bearer token).
- All other methods and unknown paths rejected. No wallets, transfers, automation, miner configuration writes, external proxy routing or key management.

## Implementation notes

This is an integration foundation, not evidence that real devices/accounts have been linked. Vendor API versions and limits may change; verify an owner-authorized test against each provider before enabling it. Wallet SDK setup is isolated from mining telemetry by design. Never merge outside cryptocurrency ticker symbols into the author's 21 independent source identifiers.
