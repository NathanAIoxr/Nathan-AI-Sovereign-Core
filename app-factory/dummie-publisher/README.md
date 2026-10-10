# DUMMIE™ — The Big Red Button Publisher

**Creator:** Nathan Tabor · **Parent:** TABOR 1-2-3 FACTORY · **Status:** Working offline-first browser packaging prototype, manual provider handoff. No authenticated external publication.

## Name and UX

**DUMMIE** is the playful name selected by the founder—“dummy, put an IE on the end”—for the deliberately simple few-big-red-buttons workflow.

1. **CREATE PROJECT** — name your app/game/book, add the description and locally select your original files.
2. **MAKE MY ZIP** — immediately produce a real portable ZIP archive containing the unchanged selected bytes, `README.md` and `tabor-publish.json`. Empty projects also receive a working `index.html` starter.
3. **SHOW ME WHERE TO POST** — pick GitHub, GitLab, Codeberg, Bitbucket, Hugging Face Spaces, itch.io, Netlify or Vercel. Opens the correct official provider starting page and lists actual next steps. **Manual handoff only.**

No local files, credentials or source data are uploaded by the app. It does not persist uploaded binary files to localStorage and does not touch the private Creator Vault.

## Existing engines reused

- Existing Factory home and PWA offline shell, project concepts and public registry.
- Existing Universal Creator Vault for preserving original input assets, independent from packaging.
- The existing shared ROOT permission/release contracts and dependency-aware build planner.
- The real `publisher.js` ZIP builder and provider registry is a *single reusable publishing adapter*, not eight independent apps.

## Anti-duplication design

The outbound contract `tabor.dummie.publish-package.v1` can be consumed by a future trusted server-side publishing orchestrator. The contract preserves identity, requested visibility, original file names, project description and explicit unlaunched state. A `visibility:public` choice is **not** publication authorization.

A true “one-tap publish everywhere” service requires a **private backend**, provider-specific OAuth/apps/scopes, token vault, target ownership checks, repository creation, upload or Git push, release verification, retry/idempotency support, audit events and approval confirmation before each externally visible action. Publishing a private project to a public destination must require an explicit final review. Provider API availability and platform terms differ. Some providers host source repositories; others host built websites or distribution packages, and marketplace approval cannot be bypassed.

Never ask users to paste GitHub PATs, Shopify keys or private passwords into a public GitHub Pages page. Work and GitHub connectors may help the user authorize specific publication in authenticated workflows.

## Test and limitations

Run `node --test app-factory/dummie-publisher/publisher.test.cjs`.

- Source files are wrapped unchanged in a standard uncompressed ZIP, max 80 MiB; preserve larger originals separately through Vault.
- Secret-style filenames (`.env`, `*.pem`, SSH private keys) are blocked, but this is **not a comprehensive secret-content scanner**. Owner must review before publication.
- GitHub Pages is static; it cannot securely store permanent publishing OAuth credentials or run provider webhooks.
- Browser download is handled locally and requires the user to save the file; browsers may not support all download patterns.
- Some providers require extracting the ZIP, uploading a compiled build, or linking a Git repository.
- No production credentials or automatic posting have been installed. Publishing status is never displayed as successful without an external confirmation.

## Next reusable adapter milestones

1. Authenticated private user/project identity and approval records.
2. Provider OAuth adapters and credential vault (GitHub/GitLab/Codeberg first).
3. Publish preparation analysis: rights/license/secret scanning, build-type detection and cost review.
4. Validate, preview, approve and post to selected sites, with detailed per-destination feedback and idempotency tokens.
5. Git-style publish first; extend to sites, games marketplaces, digital products, crowdfunding and commerce with appropriate legal and provider-specific checks.
6. Upload verified publication references, not raw private secrets, back to the public Factory.

**Never claim the user published a project simply because they clicked a button that opened another website.**
