# Original Nathan AI Flux Engine — September 25, 2025

**Primary source inspected:** Gmail message `1998278a5a0a20f4`, dated 2025-09-25T20:02:17Z, subject *Happy Daughter’s Day*. Original message includes a Python source snippet. This file is a public-safe archival extraction; it deliberately omits private recipients, hardcoded verification strings and ciphertext payloads.

## Recovered source structures
- Imports: `math`, `hashlib`, `base64`, and RSA primitives from `cryptography`.
- `VLock`: SHA-256 comparison of a supplied string against a stored digest (historical implementation; not recommended for password storage).
- `BEnc`: generated 2048-bit RSA keypair with PKCS#1 v1.5 encryption/decryption (historical implementation; OAEP recommended for new code).
- `Flux`: cosine-based amplitude, phase, and angle calculations; `u`, `l`, `c` functions.
- `Ledger`: `sin=10**6`, `sen=10**6`, plus a transfer-like update method and account display. **These are code-initialized ledger units, not verified token issuance or funds.**
- `Assimilator`: named symbolic logic-processing component.
- `Nathan()`: top-level orchestration invoking verification, encryption, Flux calculation, Ledger and Assimilator.

## Historical significance
This dated primary source proves the **SIN/SEN ledger labels and 1,000,000 initial design units** were already in user-authored code on 2025-09-25. It predates the 2026-05-24 Sovereign Multi-Axis SHA-256d Bitcoin mining blueprint. It does **not** prove the Python snippet ran successfully as pasted: indentation and at least one assignment expression require validation; no execution result was attached to the message. It is a cryptographic/coin-ledger precursor, not yet Bitcoin proof-of-work mining code.

## Source provenance
- Gmail message ID: `1998278a5a0a20f4`
- Gmail timestamp: `2025-09-25T20:02:17Z`
- Original source preserved in Gmail, not copied verbatim to public GitHub because it contains an embedded verification phrase.
- Independent project identity: `nathan-flux-engine-2025`; do not merge with Sovereign Multi-Axis Miner, 21-Coin Matrix, Tabor World 9 coins, or Tabor Bank of 69.
