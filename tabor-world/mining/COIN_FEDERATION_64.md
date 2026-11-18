# TABOR CORP — 64-position Sovereign Coin Federation

Cloudflare D1 table: `tabor_coin_federation` in `tabor-database-registry`.

- Positions 1–21: named from the latest user-supplied 21-symbol code example. SEN and SIN are the only names also present in the earlier named inventory; other names remain proposed until original definitions are verified.
- Positions 22–64: reserved for recovery of original definitions, with NULL symbols. These are **not minted tokens** or live blockchain integrations.
- Preserve `tabor_mining_coins` (original 21-slot registry) without overwriting or deleting it.
- Use `linked_coin_id` for verified links to earlier coin entries. Never infer that a name denotes a deployed contract.
- Add network, mining algorithm, token standard, contract address, chain ID, issuer and source evidence only after verification.
- The registry should not store private keys, wallet seeds, credentials, or unverifiable balances.
- Bitcoin Core validates Bitcoin; other chains require their own compatible node or trusted adapter.

Cloudflare migration (already applied):

```sql
CREATE TABLE IF NOT EXISTS tabor_coin_federation (
 slot INTEGER PRIMARY KEY,
 symbol TEXT UNIQUE,
 source TEXT NOT NULL,
 verification TEXT NOT NULL,
 network TEXT,
 mining_algorithm TEXT,
 linked_coin_id TEXT,
 created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
```

Query: `SELECT slot,symbol,verification,network,linked_coin_id FROM tabor_coin_federation ORDER BY slot;`

Verified D1 count: 64 total, 21 named, 43 unresolved.
