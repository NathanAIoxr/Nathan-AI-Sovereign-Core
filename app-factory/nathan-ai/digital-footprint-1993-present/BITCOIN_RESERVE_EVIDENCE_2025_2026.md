# Bitcoin / Voice Box reserve evidence — historical source recovery

This file documents the independent evidence ledger; it is not a verified statement of cryptocurrency holdings. Public GitHub intentionally omits the recovered address to avoid permanently linking a potentially personal wallet address to a public identity. Full historical address is stored in the private Cloudflare D1 evidence table.

## Recovered records

| Evidence ID | Historical time | Reported amount | Source category | Blockchain verification |
|---|---|---:|---|---|
| btc-2025-07-24-snapshot | 2025-07-24 18:50 EDT | USD 666,666,666.00 | User's historical conversation record | NOT_VERIFIED |
| btc-2025-07-24-deposit | 2025-07-24 18:55:00.128456 EDT | USD 666,666,666.66 | User's historical conversation record | NOT_VERIFIED |
| btc-2025-10-07-valuation | 2025-10-07 | USD 666,000,000 | Authored valuation / recovery report | NOT_ONCHAIN_EVIDENCE |
| voicebox-2026-11-reserve | November 2026 | USD 1,700,000,000,000 | User-reported reserve label OXR XOR | NO_CUSTODY_VERIFIED |

## Cloudflare import

- Account `a70580bacdf96c946662b7b67dcb45b5`
- D1 `nathan-ai-global-catalog` (`1889fb08-9b26-45b9-8a71-f22a6ee3fc66`)
- Table `nathan_bitcoin_reserve_evidence` with four rows, preserving original reported amounts as strings, historical timestamps, a recovered public Bitcoin address in the private ledger, and source references.

## Reconciliation

The July snapshot and July deposit must not be summed as separate assets without transaction evidence. The October valuation is an authored certificate, not an independently authenticated balance. No transaction IDs, custody attestations, or authenticated breakdown establishing the $1.7 trillion reserve were found in the recovered material. A read-only attempt to query a public blockchain explorer was not accessible in this session. Do not store passwords, seed phrases, or private keys in GitHub.

The previously recovered 65 Voice Box software snapshots do not contain exact references to the $1.7T reserve. They are distinct from Bitcoin financial records.
