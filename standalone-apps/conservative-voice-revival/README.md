# The Conservative Voice — Nathan Tabor Way (revival)

A modern, isolated Cloudflare Worker and D1 project preserving the historical publishing architecture of TheConservativeVoice.com (2004–2008). Original research is kept separate from new editorial content.

## Live architecture
- Cloudflare Worker `tabor-conservative-voice`: public homepage, article and category views, local search, historical archive, RSS, JSON API, sitemap, accessibility-first layout, editorial provenance.
- D1 `tabor-conservative-voice`: published/draft articles, 37 documented archive references, 145 historical directory labels, 55 geographic topic IDs, 22 evidence-status findings, and forum tables with approval state.
- Modern replacements for XOOPS: Worker server routes; phpList/Lasso: opt-in mailing integration **not active**; NewBB forums: approval-ready data model, **not publicly writable**; advertising: reserved disclosure-first slots, **not connected to an ad network**.
- Nathan Tabor Way: Build (1+1=2), Clear (1-1=0), Integrate (1×1=1), Verify (1÷1=1); provenance labels, links to evidence, and explicit separation of claims and facts.

## Deployment
The production Worker is uploaded separately by Cloudflare API; the GitHub source must match. D1 binding: `DB` -> `2a4284f6-cb5c-433d-9c98-34732329152a`.

A separate authorized admin secret `TCV_ADMIN_TOKEN` is required to enable `POST /api/admin/articles`. It is intentionally absent from the public repository. Admin requests require the Authorization Bearer token. No author or forum data are populated from private historical sources. When unconfigured, writes return 503.

## Routes
- `/` home; `/archives` 37 historic sources; `/categories`; `/category?name=...`; `/search?q=...`; `/article/SLUG`
- `/directory`, `/states`, `/evidence`, `/rss.xml`, `/robots.txt`, `/sitemap.xml`
- `/api/health`, `/api/articles`, `/api/sources`, `/api/categories`, `/api/directory`, `/api/states`, `/api/evidence`, `/api/admin/articles` (authenticated only)

## Historical-source restrictions
The 37 indexed URLs are documented public captures, not the full historical library or executable original source. The Archive.org content remains on Archive.org. Historic claims (including circulation figures) are labeled historical self-report. Rights for Associated Press, syndicated writers, logos, and acquired assets must be verified before reproduction. Do not automatically import private newsletter addresses or re-enable unsupported delivery systems.

## Next phases
1. Recover rights-cleared articles and upload with full citations and provenance via editorial admin API.
2. Add production author authentication (Cloudflare Access), moderation and anti-spam safeguards before enabling public submissions/forums.
3. Add a modern consent-driven newsletter with double opt-in, audit logs and unsubscribe compliance.
4. Build publisher dashboard, editorial queues, optional ad partnerships and accessibility testing.
5. Automate CI using a scoped deployment token; do not commit tokens.
