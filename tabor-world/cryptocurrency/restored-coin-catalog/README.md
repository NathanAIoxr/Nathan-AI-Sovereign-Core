# Restored historical cryptocurrency catalog

63 entries from two independent, documented collections: the 42-entry Nathan AI Crypto Ecosystem grid and the 21-entry user-defined Sovereign Coin Matrix. Source rows remain distinct even if tickers overlap. Existing tabor_mining_coins (21 rows as checked on 2026-11-18) is not changed.

The Cloudflare Worker serves read-only /health, /coins, /coins?family=grid42, /coins?family=matrix21, and /coins/summary. No wallet keys, contract deployments, minting, trading, mining claims, or on-chain verification are implied. Do not replace user-authored names with guesses.

Use the migration in schema.sql. Configure the existing D1 database as DB and deploy with Wrangler or API. Add new recovered sources as separate families, preserving provenance.
