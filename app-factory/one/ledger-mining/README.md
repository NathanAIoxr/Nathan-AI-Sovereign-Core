# NATHAN AI 🚀 — THE DISTRIBUTED LEDGER & COMPUTATIONAL CONSPECTUS

**Path:** NATHAN AI → TABOR ROOT → TABOR 1-2-3 FACTORY → ONE → Ledger & Mining.
**Status:** Public educational / local-only browser prototype. No deployed miner, wallet, smart contract, payout engine, exchange integration or live price API.

## Author-authored original and derived material

- `ORIGINAL_AUTHOR_SOURCE.md` stores the submitted 21-position three-section statement as an independent source transcription. Source words and distinctive names are retained; line break/whitespace normalization means it is NOT asserted byte-for-byte identical to the chat message.
- `records.js` contains **21 derived reference entries** (7 Asset Layer, 7 Mining Rigs, 7 Consensus & Architecture) with author-defined names preserved, separately authored summaries, protocol limitations, official documentation links, and offline scenario math.
- `index.html` provides responsive search, category filters, links to primary documentation, local JSON export, and a manually parameterized mining scenario laboratory.
- `records.test.cjs` checks IDs, category cardinality, author epithets, documentation links, arithmetic, and invalid input boundaries.
- No preexisting application, source archive, book, token system, game or repository directory is overwritten by this new module. ONE and Nathan AI hub links are additive.

## Technical verification / protocol boundaries (reviewed November 2, 2026)

1. **Bitcoin**: Consensus issuance is just under 21m BTC due to whole-satoshi rounding, with 210,000-block subsidy halvings. Official Bitcoin background: https://bitcoin.org/en/halving
2. **Ethereum**: The base fee burns per EIP-1559; the network stopped proof-of-work mining on September 15, 2022. https://eips.ethereum.org/EIPS/eip-1559 · https://ethereum.org/roadmap/merge/
3. **Solana**: Proof of History sequences events; it is not a standalone consensus protocol or universal precise wall clock. https://solana.com/developers/cookbook/transactions/confirmation
4. **XRP Ledger**: Public XRPL consensus uses server-specific trusted validator lists; the ledger is independent of the Ripple corporate entity. https://xrpl.org/docs/concepts/consensus-protocol
5. **BNB**: Quarterly BNB Auto-Burn is related to BNB price and BSC block counts, targeted at 100m total supply, independent of Binance exchange volume. https://www.bnbchain.org/en/blog/35th-bnb-burn
6. **Chainlink**: Staking and slashing are deployed for selected services, not universally required of all node operators. https://chain.link/economics/staking
7. **Monero**: On-chain privacy is strong by default but does not eliminate risks from off-chain disclosures and compromised keys. https://web.getmonero.org/get-started/faq/
8. **Mining**: Bitcoin mining is PoW; Ethereum mainnet is PoS and cannot be GPU-mined. ASIC/GPU/CPU/FPGA classifications describe hardware choices, not guaranteed profitability. https://ethereum.org/developers/docs/consensus-mechanisms/pow/mining/
9. **Pools / solo / cloud**: Revenue shares, share payout schemes, fees, contracts, fraud and uptime depend on each provider; no guaranteed profit.
10. **PoS / PoH / rollups**: Slashing is protocol-specific, PoH is ordering infrastructure, and L2 data availability/proof systems, centralization and withdrawal assumptions differ. https://ethereum.org/developers/docs/consensus-mechanisms/pos/rewards-and-penalties/ · https://ethereum.org/developers/docs/scaling/
11. **Liquid staking**: Redemption, peg and smart-contract risks persist even when tokens are transferable. https://ethereum.org/staking/
12. **Halving**: Decreasing new issuance does not imply an automatic or guaranteed rise in market value.

## Mining scenario formula

```
expected_blocks_per_day = (miner_hashrate_THs * 86_400) / (difficulty_trillions * 2**32)
expected_BTC_per_day = expected_blocks_per_day * (block_subsidy_BTC + assumed_fees_per_block_BTC) * (1 - pool_fee_percent / 100)
USD_revenue = expected_BTC_per_day * manually_supplied_BTC_USD_price
power_kWh_per_day = watts / 1000 * 24
USD_net_after_electricity = USD_revenue - (power_kWh_per_day * USD_per_kWh)
```

This is a simplified expected-value model for **Bitcoin SHA-256 mining** with user-supplied figures; not a live profit prediction. It excludes difficulty changes, luck variance, hardware cost, cooling, repairs, downtime, taxes and other fees, and should never be marketed as real returns.

## Local tests

```sh
node --test app-factory/one/ledger-mining/records.test.cjs
```

## Planned only (not shipped)

Owner-permissioned telemetry, live mining pool data, cross-chain explorers, hardware ROI histories, public-price feeds, energy contracts, protocol source provenance, threat models and formal audits. Live wallet, private key, financial transaction, payout or automatic mining capabilities require independent approvals and security review.
