# TABOR 64-Coin Federation

The 64-position catalog is stored in Cloudflare D1 `tabor_coin_federation`. Slots 1–21 are user-supplied proposed names; slots 22–64 are **newly coined proposals** derived from Tabor World module names, not recovered originals. Only SEN and SIN are independently named in the earlier user inventory. No supply cap, contract address, mint, balance, backing, market value, or chain connection is asserted.

Worker: `tabor-coin-federation`; binding `REGISTRY` -> existing `tabor-database-registry`. Read-only `/`, `/health`, `/api/coins`, `/api/integrations`.

Open-source candidates: Stratum V2 reference implementation (Bitcoin mining, https://github.com/stratum-mining); Bitcoin Core (Bitcoin full node, https://github.com/bitcoin/bitcoin); OpenZeppelin Contracts (EVM token standards, https://github.com/OpenZeppelin/openzeppelin-contracts). None are installed by this code. Do not deploy financial assets without reviewing contract security, ownership, token economics and legal requirements.

Next: provenance reconciliation, chain selection, testnet-only contract prototypes, authenticated adapters, independent audit, measured performance, and separate explicit authorization for any real minting.
