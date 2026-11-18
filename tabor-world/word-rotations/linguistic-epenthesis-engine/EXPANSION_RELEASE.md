# Expansion release: dashboard and privacy-preserving aggregate counters

- Accessible HTML dashboard at `/dashboard`, mobile-friendly four-axis viewer, custom bridge, rule links.
- `/api/metrics` returns per-day operation counters only. No input words, tokens, IP addresses or cookies are stored.
- D1 aggregate counts use upserts and `ctx.waitUntil` to avoid delaying reads. If D1 is absent, transforms remain functional and metrics return 503.
- No public write endpoint; transformations remain GET-only and input length is capped at 256.
- Deploy `schema-analytics.sql` to existing `tabor-database-registry` before enabling D1 binding `DB`.
- This is not a dialect-aware IPA engine; the user's original heuristic is preserved without claiming universal phonetic correctness.
