# Independent Voice-to-Vault + Mirror Risk Materials
This package indexes Voice Box **materials**, not the Voice Box application. Its event contract is metadata-only and defaults to HOLD. The original source remains unchanged.

Contains: D1 schemas for materials telemetry, authorized-domain zone registry and mining economics; source-only Conductor event adapter; 1+1=2 / 1-1=0 risk gates; forward/reverse/mirror views; safe batch-of-10 domain plan generator.

**Not live:** No Cloudflare Worker, DNS zone, route, AI binding, queue, crypto miner, exchange connection, or GitHub commit API endpoint has been deployed by this package. The actual GitHub contents endpoint is `https://api.github.com/repos/{owner}/{repo}/contents/{path}`, not github.com or cloudflare.com. DNS zones require domains owned or controlled by the account. Existing production Worker routes must not be overwritten. Cloudflare Workers are not suitable for running proof-of-work ASIC mining.

Risk analysis is arithmetic, not a guarantee of profit. Crypto spot trading is not universally zero-sum after accounting for price changes, production, and external cash flows; stop-loss orders do not guarantee execution price.
