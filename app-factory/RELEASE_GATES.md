# TABOR ROOT — Cross-Product Release Gates
**Created:** October 10, 2026 · **Scope:** Every Factory product, game, charity, AI system, invention and commerce adapter.

## Fundamental distinction

A picture, design document, JSON example, green unit test, draft order or connected-service *descriptor* is **not** proof of a running production integration. Each product retains independent identity and ownership. The TABOR ROOT bridge shares **contracts only** until authenticated providers and storage are installed.

The current public host is a **static GitHub Pages site**, not a private multi-user application server. Never copy private research archives, unreleased original artwork, user chat data, customer records, payment information, credentials or private source packages into this public repository.

## Gate 0 — Source and intellectual-property integrity
- Preserve supplied originals byte-for-byte where possible; record the original name, project, checksum or explicit **unverified** state, attribution and version.
- Keep separate namespaces: original `TW-001`–`TW-101` and newer `TW001` conceptual labels are **not aliases**. ONE's technical 101–901 taxonomy and the Factory's creative/historical 101–901 taxonomy are independent.
- Review the existing public repo **Apache License 2.0** and determine precisely which *public code* is intended to be open source. Do not presume that unpublished games, designs, characters, trademarks, music, images or private ZIP archives are licensed by this file. A license decision must be made by the rights owner with qualified advice as appropriate; do not silently rewrite history or licensing.
- Every generated/historical artifact must retain evidence tags: fact, sourced interpretation, analogy, allegation, folklore, creative fiction.

## Gate 1 — Data safety and recovery
- Browser-local `localStorage` and `IndexedDB` are demos, **not guaranteed backups** or secure per-user accounts.
- **High-priority missing capability:** Vault export is a metadata index, **not the binary contents** of images and videos. Implement a tested full-original-byte export/restore process with size and checksum validation before promoting the Vault to primary storage.
- Preserve different originals even if their filenames and sizes match. If SHA-256 could not be calculated, keep both with `sha256:null` instead of pretending to have verified identity.
- Prevent accidental data loss by automated backup/restore tests, retention review, and rollback capability.

## Gate 2 — Identity and isolation
- Replace development-only headers such as `X-Owner` and `X-Demo-Workspace` with authenticated, trusted server-side identity (OIDC/passkeys or equivalent).
- Every database row, file, object-store key, queue job, cache and event needs a tenant/owner policy enforced at the server.
- No cross-user reads, writes, shares, app linking or project publishing without explicit, scoped authorization and an auditable approval.
- The local `core/root-contracts.js` only validates *data shape and caller-supplied evaluation context*: it **cannot authenticate anybody or authorize real-world actions**.

## Gate 3 — High-impact action safety
- All real monetary transactions, refunds, donation collections, crowdfunding charges, purchases, bank activity, content publication and remote deletion need provider-backed, independently verified results.
- Shopify Cart API checkout links are distinct from Admin Draft Orders. Do not convert an unpaid draft order into a claim of a completed charge.
- Real Kickstarter/Indiegogo/Etsy/Amazon/app-store publishing must use supported provider workflows and explicit human release approval.
- Never expose API keys, private payment tokens, financial details or credentials inside a PWA or public Git repo.

## Gate 4 — Human services and child protection
- ChristmasToyDrive.com, Handling Life and other humanitarian products require secure recipient intake, privacy, consent, qualified local referrals, safeguarding, fraud controls, organizational/legal review and verified delivery outcomes.
- Do not enable public assistance intake or claim nonprofit tax-deductibility without confirmation.
- Children’s educational and gaming experiences require age-appropriate content, privacy controls, original/licensed assets and protective design—no high-pressure monetization.

## Gate 5 — Science and evidence
- TABOR GPS is an educational Earth-centered WGS84 demonstration, **not certified navigation**. Require native sensor fusion, true vs magnetic heading calibration, WMM model metadata, location uncertainty, real routing and physical tests before location-safety claims.
- The five environmental layers are **not five independent geomagnetic fields**.
- LET/TET/PPL hash integrity, ethical checklists and AI text outputs do not by themselves prove a historical or scientific proposition.
- Religious traditions must not be presented as literal criminal enemy factions; distinguish historical abuses and documented actions from conspiracy claims and fantasy game adversaries.

## Gate 6 — Actual operational acceptance
Before a release is called **working in production**, independently verify:
1. Source lives in the correct public or private repository with reviewed rights.
2. Secure sign-in, tenant isolation, authorization and consent are tested.
3. Database migrations, encrypted backups, restoration and observability work.
4. UI keyboard/touch/accessibility tests and real iPhone/Android tests pass.
5. API integration runs against an authorized sandbox/real account with receipt and webhook verification.
6. Security, privacy, performance, availability and recovery checks pass.
7. The owner's explicit publishing approval and provider acceptance are recorded.
8. Work Status includes verified URLs, test reports, scope and any known failures.

## Implementation order
**P0**: private source ownership + backup strategy + authentic identity/tenant isolation + high-impact disabled by default.
**P1**: cross-product typed contracts, production databases, provider integrations, device and browser E2E, accessibility.
**P2**: scalable async workers, video pipelines, rich graphics, multiplayer, analytics and public-store launches **after** earlier gates.

**Moral engines:** Empathy recognizes need; Sympathy evaluates dignity and consent; Compassion acts and verifies impact. They never replace independent evidence, permissions or expert review.
