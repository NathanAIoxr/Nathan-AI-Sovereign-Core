# Conductor

The conductor controls the existing 25 registered projects, with one policy record per project. All policies default to `audit_only`; no projects are automatically published, no remote hosts are enrolled, and no arbitrary commands run.

The bounded `conductCycle` implementation is source code committed on the integration branch. It can claim approved D1 jobs only when an operator changes a project's mode to `approved_dispatch`. Claiming is not execution; a separate allowlisted worker must handle a claimed job and write a receipt.

The 0005 migration is applied to the existing fleet D1. The conductor code is **not yet wired into a deployed Worker**, so no automatic cycles are claimed. Reuse an existing authorized runtime after testing; do not create a duplicate Worker merely to increase fleet counts.

The Cloudflare account has no registered DNS zones. Zone creation requires owned domains.
