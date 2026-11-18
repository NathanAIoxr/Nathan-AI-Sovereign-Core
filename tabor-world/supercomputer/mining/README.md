# Tabor Bitcoin mining infrastructure

The architecture and SQL registry are source-controlled here. The registry is intentionally not populated with fictitious miners. Actual ASICs, racks, cooling and electrical installation require equipment and site verification.

## Capacity planning
`python capacity.py --miners 100 --watts-each 3500 --power-limit-kw 500 --pue 1.2 --ths-each 200`

The output is **estimated**, not measured hashrate. Apply the SQL schema to the existing Cloudflare D1 registry only after reviewing compatibility with the existing `tabor_mining_hardware`, `tabor_mining_coins`, and `tabor_mining_receipts` tables.

Do not store wallet private keys, pool passwords or root credentials in GitHub or D1.
