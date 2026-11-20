# The Cryptocurrency Pooper by Nathan Tabor

> It’s amazing what you can learn from mother nature, and then when you apply creativity and imagination …

The Delftia outer filter removes duplicate normalized queue deliveries and webhooks before simulated downstream work. Spam and blocked traffic appear as discarded counts. The Cupriavidus inner refinery retires expired local records and keeps held or active records. It measures the change in the serialized snapshot. The engine returns the retained records and forwarded events together with input, output and receipt hashes.

Failed transactions and expired mempool entries here are records in an operator's own archive. Voluntary token burns, stranded compute, waste heat and curtailed energy enter the receipt as evidence references. They have no payout rate. The sample uses synthetic data. It does not connect to public mempools, inspect real network traffic, burn assets, consume computing capacity for proof of work, or modify an operator's storage.

## Run

Use Node.js 22 or later.

```sh
npm install
npm test
npm run dev
```

Open http://127.0.0.1:8787 and run the sample batch. `GET /api/demo` returns the candidate receipt. `GET /api/health` reports the staging configuration.

The chain test compiles and deploys the capped POOPER contract to an ephemeral local EVM. It signs the verified sample receipt with a local verifier and settles to the sample wallet. Tests check rejection of wrong-chain signatures, unauthorized signatures, tampered rewards, expiry, duplicate windows and payouts above the cap.

## Settlement boundary

`refineBatch` accepts a preapproved resource and measurement window. Every resource/window pair has one settlement key. A trusted verifier must independently confirm the enrolled resource, validated source records and measured benefit before calling `signVerifiedCleanup`. Dedup counts are pipeline measurements and serialized JSON bytes are not provider-billed storage measurements. The Worker has no signing key, wallet access or mint endpoint.

The EIP-712 voucher binds the settlement key, receipt hash, recipient, units and expiry to the specific contract and chain. The ERC-20 contract verifies the signature, enforces a fixed cap and settles each window and receipt at most once. It issues a project token, with zero decimals. Paying in an existing cryptocurrency would require a separate funded treasury.

The Cloudflare staging copy uses its own Workers for Platforms dispatch namespace. The staging script serves sample data. Public routing and mainnet deployment are separate operations.
