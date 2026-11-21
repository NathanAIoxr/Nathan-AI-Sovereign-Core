# TABOR CORP Mining Command Center

Read-only Cloudflare dashboard, D1-backed coin and hardware planning registry, and SHA-256d test endpoint. Mining is NOT run on Cloudflare Workers. The 21 coin entries preserve SEN/SIN and leave 19 original identities unresolved. Reverse SHA-256 hashing is not feasible as a general cryptographic inversion. Physical servers/ASICs require separately provisioned hardware and approved costs.

Worker: `tabor-corp-mining-hub`. Binding: `REGISTRY` to existing `tabor-database-registry`.

Paths: `/`, `/health`, `/api/coins`, `/api/hardware`, `/api/architecture`, `/api/sha256d-test?hex=00`.
