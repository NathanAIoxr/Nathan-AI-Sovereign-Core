# The Modern-Day Real-Life Golden Goose by Nathan Tabor

This project preserves the original hyper-acceleration model in `src/worker.ts`. The deployed lab adds a separate measurable refinery, proof-of-work traversal lab, cleanup receipts and isolated ledger.

| Mirror position | Forward | Backward | Inverted |
| --- | --- | --- | --- |
| This side | Walk the declared nonce interval low to high | Walk it high to low | Complement each nonce across 32 bits |
| As the mirror | Walk the original interval and reconstruct the wire header independently | Repeat the independent reconstruction while walking high to low | Repeat it over the complemented nonces |
| Other side | Walk the mirrored nonce interval low to high | Walk the mirrored interval high to low | Complement the mirrored interval back into the original domain |

The mirrored interval is `[0xffffffff - end, 0xffffffff - start]`. All nine routes use Bitcoin's wire encoding, the same double SHA-256 and the compact target in the header. Different traversals can visit the same nonce. The deployed replay tests small intervals around Bitcoin's known genesis nonce. A header proof is one part of validating a full block.

The eight bounded arms take normalized records, discard the traffic log lane, refuse conflicting duplicate identities, and propose retirement only for marked local archive records. The runner records actual gzip and serialized sizes and compares independently evaluated forward and backward results. Cleanup units equal verified KiB reclaimed. The sample calculations are candidates. Raw attack counts and nonce proofs have no cleanup payout rate.

The holding D1 ledger accepts an external verifier's Ed25519 attestation over the environment, workspace, window, receipt digest, verified bytes and expiration. One window and one receipt can be counted once. Each 1,000 units enables a candidate allocation of 50/25/15/10 accounting units, with remainder carried. Third-party balances, liquidity and operating funds remain outside this ledger. A production allocation would require its own funded or issued asset and settlement operator.

## Open-source components

- [Bitcoin Core](https://github.com/bitcoin/bitcoin) provides the protocol reference and optional local tooling.
- [Stratum V2 Reference Implementation](https://github.com/stratum-mining/stratum) provides the protocol libraries for later integration with enrolled hardware and a configured pool. [Stratum V2 applications](https://github.com/stratum-mining/sv2-apps) maintain the pool and proxy implementations.
- Cloudflare Workers use standard Web Crypto and streams. The local tests exercise idempotency with Node's SQLite module.

## Run

Use Node.js 24 and run `node --test test/*.test.mjs`. The Cloudflare stage lives in its own dispatch namespace. The released Worker serves a fixed sample and a read-only mining replay.

On an owned host, `BITCOIN_BIN=/path/to/bitcoin/bin bash scripts/bitcoin-regtest.sh` runs a private Bitcoin Core regtest with networking disabled and cleans up the temporary datadir. It uses no mainnet funds. It requires local RPC socket support. GitHub Actions runs unit tests only.

The Super 2X and Hyper fleet inventory each has 1,000 planned mining slots. An active device must be separately enrolled as an authorized mining device with its own pool configuration. Existing FP64 executors and hyper-federation language shards provide software compute services.
