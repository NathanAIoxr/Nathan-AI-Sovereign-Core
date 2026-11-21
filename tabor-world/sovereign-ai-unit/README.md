# Nathan AI Sovereign Unit — Box 0 and Box 1

Separate Cloudflare Workers, not a claim of hardware isolation. Box 0 verifies client authorization and request shape before forwarding to Box 1 through a service binding. Box 1 separately verifies an internal shared secret, performs Workers AI inference, caches a result in KV and records a SHA-256 digest and output in D1.

Security: configure separate `SOVEREIGN_KEY` and matching `BOX_INTERNAL_KEY` as Worker secrets. Never expose Box 1 on a public route; even if exposed, the internal secret must be required. No credentials in GitHub. KV is eventually consistent and does not replace HBM. D1 ledger is not cryptographically immutable and may be edited by administrators. Do not put sensitive inputs in the prompt without an explicit data policy.

Deployment prerequisites: create a KV namespace and D1 schema, configure AI binding and Worker service binding, then deploy both Workers and test the full request path. No claim of 2x compute speed or physical hardware replacement.
