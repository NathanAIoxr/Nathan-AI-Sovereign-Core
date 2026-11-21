# TABOR infrastructure gateway

Read-only control plane: 64 planned agent/bot assignments, physical node registry, existing mining hardware plan, Bitcoin 80-byte header SHA-256d and compact-target proof-of-work verification. It does not mine Bitcoin, run agents, validate Bitcoin consensus, provision servers, or claim measured exaflops. `/api/bitcoin/genesis` verifies the canonical genesis header. `/api/bitcoin/header?hex=...` checks a provided header. Cloudflare D1 binding: `DB` to `tabor-database-registry`. Sensitive write endpoints deliberately omitted.
