# Tabor Concordance — Wikimedia-wide source registry and ingestion contract

The **Tabor Concordance** treats Wikimedia as a source-linked multilingual reference corpus, not as an authority that can silently replace primary evidence or the user's interpretations.

## Verified Cloudflare database foundation
Database: `tabor_academy_db` (D1 `f9708fd8-af51-4d79-b6c2-edb532f53fc0`).

Tables created:
- `tabor_concordance_sources` — Wikimedia project, API endpoint, authentication mode, optional **secret reference** (never secret value), license, status.
- `tabor_concordance_departments` — subject taxonomy and hierarchy.
- `tabor_concordance_entries` — page identity, language, source URL, page/revision IDs, Wikidata ID, license and content status.
- `tabor_concordance_terms` — term, original spelling, language, evidence status, primary citation and separately attributed interpretation.
- `tabor_concordance_import_runs` — progress and verifiable receipts.

Eight source endpoints registered: English Wikipedia, Wikidata, Commons, Wikisource, Wiktionary, Wikibooks, Wikiquote, Wikiversity. Other languages and Wikimedia projects are future discoverable registry rows, not currently imported datasets.

## API authentication and licensing
Public read requests to MediaWiki Action API generally do not require a key. Identify the application via compliant User-Agent and honor published rate limits and Retry-After. Authenticated OAuth tokens, if ever needed, must live in Cloudflare Secrets, referenced by name only. Never generate, guess, harvest or copy third-party credentials. Keep source/revision/license/attribution with every content item. Wikipedia article text is generally CC BY-SA; Wikidata structured data is generally CC0; Commons media licenses vary by file. Do not blindly mirror copyrighted text or media.

## Concordance data model
1. **Source identity:** wiki project, page ID, revision, canonical URL, Wikidata Q-ID, language.
2. **Departments:** sourced category graph (multiple category memberships, cycles possible), disciplines and subject taxonomy.
3. **Terms:** original spelling, language, root/etymology hypotheses and references, explicit distinctions among earliest attestation, proto-form reconstruction and popular interpretation.
4. **Connections:** redirects, translations, interlanguage links, disambiguation, Wikidata claims, source cross-references, versioned relationships.
5. **Evidence ledger:** exact citation, retrieval timestamp, provenance, uncertainty, contradiction log.
6. **Interpretation:** Tabor-authored notes isolated from source text and AI-generated annotations.
7. **Verification:** original source is immutable by interpretation; each derived conclusion has its own audit trail.

## Bounded import plan
- Discover Wikimedia projects through official SiteMatrix API and register language/project pairs incrementally.
- Choose a department/category or bounded Wikidata property batch; use `categorymembers`, `allpages`, `revisions`, `langlinks`, and Wikidata entity APIs with pagination, checkpoints, deduplication and rate limits.
- First import metadata (IDs, titles, URLs, category, license), then add properly licensed content/claims as distinct records.
- Build reversible, idempotent SQL migrations and per-batch checksums; use queue leases to avoid duplicate worker claims.
- Provide search, cross-reference, compare, source-only, and Tabor-interpretation views. Add language-aware indexing/FTS only after checking D1 support.
- Begin with chess (#506/#507/#509), then broaden to all departments without assuming a finite list or claiming a complete copy of Wikimedia.
- For every batch: record `fetched`, `inserted`, `skipped`, source IDs, run ID, commit, test results, worker/deployment ID and blockers.

## Conductor roles
Existing App/Academy Conductor owns UI, concordance schema, root-term logic, and source separation. Fleet/Global Atlas Conductor owns authorized worker scheduling, queues, leases and health checks. Other existing conductor lanes participate only if verified and scoped. Reuse existing hourly automation schedules, no new task slots. GitHub issue is an assignment, not evidence of execution.

## Status
Schema and eight source registry rows created and verified. **No full Wikimedia data ingestion is claimed.**
