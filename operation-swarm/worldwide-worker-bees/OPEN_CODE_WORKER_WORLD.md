# OPEN-CODE WORKER WORLD — Nathan AI

## Governing principle
Every authorized Tabor World worker can reason over the **complete available source corpus** without destructive truncation. This is achieved through durable indexing, incremental retrieval, and inspectable source references, not by assuming infinite model context or zero infrastructure costs.

## Access model
- Authorized repositories: read complete tracked source, history, schemas, documentation and dependency manifests.
- Protected resources: secrets, credentials, private third-party data and production mutation privileges remain separately permissioned.
- Every source segment has repository, commit, path, byte range, content hash and license/provenance metadata.
- Chunking is an execution detail; it must never replace the original complete file.
- Large repositories use hierarchical indexing and retrieval with completeness checks, so omissions are detectable.
- Workers exchange verified findings and durable receipts through ONE Database Federation.
- Source access is not equivalent to authority to execute, deploy, or disclose code.

## Comprehension pipeline
DISCOVER -> INVENTORY -> HASH -> INDEX -> CROSS-REFERENCE -> RETRIEVE -> REASON -> TEST -> REVIEW -> RECORD.
All source files remain accessible by path and revision. Each result cites the exact version and supporting lines.

## Worker autonomy
Workers may propose changes, create isolated branches, run approved tests, and request review. Genesis child agents inherit no secrets or permissions automatically. Runtime budgets, API quotas and provider context limits are real; batching, caching, and resumable jobs handle them without claiming they do not exist.

## Human analogy
The Tabor World metaphor treats workers as a digital family with roles, mentorship and lineage. It does not assert that software agents are biological humans or that consciousness has been demonstrated.

## Next executable work
1. Repository inventory manifest with completeness checks.
2. Durable code index and source provenance store.
3. Role-scoped retrieval API.
4. Worker-to-worker knowledge receipts.
5. Test coverage and staged Cloudflare deployment.

**Status:** Design specification only; no claim of unlimited tokens or unrestricted execution.
