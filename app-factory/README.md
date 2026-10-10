# TABOR APP FACTORY — iPhone-first setup

## Operating model
1. BUILD: use ChatGPT/Codex to specify and generate each distinct app.
2. SAVE: one GitHub repository per product; review and commit changes.
3. PUBLISH: Expo EAS cloud build, then submit to selected stores with explicit approval.

## Verified
- GitHub account: NathanAIoxr
- Hub repository: Nathan-AI-Sovereign-Core
- The hub repository is PUBLIC. Never commit API keys, certificates, provisioning profiles, passwords, or store credentials.

## Still needs setup
- Verify the GitHub Pages deployment after updates and confirm iPhone Home Screen behavior on a physical device.
- Connect Codex to the intended repositories.
- Configure Expo/EAS cloud build and Apple developer signing for native iOS releases.
- Set up App Store Connect and required developer enrollment for App Store distribution.
- For Google Play, configure a Google Play developer account and Android build pipeline.
- Configure store metadata, privacy disclosures, screenshots, age rating, billing/tax details, and release approval.
- Extend the working public-code GitHub Actions CI into real iPhone/browser testing, secure backups, per-app release pipelines and verified revenue reporting.

## Architecture
- Keep this repository as the control hub.
- Create separate repositories for individual products.
- Use reusable project templates and workflows, not copied apps.
- The dashboard at app-factory/index.html is an interactive local-first prototype for projects, story briefs, launch checklists and navigation. It does NOT perform cloud builds or store submissions.
- Never automatically publish without a human review and explicit release approval.

## iPhone quick launch
After deploying the dashboard to a website, open it in Safari > Share > Add to Home Screen.


## Universal Creator Vault (implemented local prototype)
- Open `vault.html` (also linked in Factory Home, Settings and top navigation).
- Import original media, documents, code and other files using the iPhone file chooser.
- Supports Factory starter ZIP packs and ChatGPT `conversations.json` / export ZIP where supported by the browser. Large/compressed archives may need extraction in iPhone Files.
- Original bytes live in **browser IndexedDB** with search, type/project filters, thumbnails, preview, tags, duplicate detection, downloads, and links to Factory Projects.
- Keep an original ZIP backup; **Export Vault Index** saves metadata only, not the actual image/video bytes.
- Reimport files or updated ChatGPT exports for ongoing work. Identical imports are skipped; changed ChatGPT conversations can be retained as new revisions.
- **Other users:** each person can use the prototype in their own browser profile; accounts, multi-user isolation, cloud backup, provider OAuth, recurring background sync and shared team workspaces are **not yet connected**. On a shared browser profile, local data is not private from other people using that profile.
- No private personal media are copied to this **public GitHub repository** by the local importer.
- Full security, service adapters, scopes, cloud architecture and acceptance tests: [UNIVERSAL-CREATOR-VAULT.md](./UNIVERSAL-CREATOR-VAULT.md).

## Public ecosystem directory and shared contracts
- [Public product directory](./ecosystem.html): the searchable index is deliberately curated to exclude unreleased/private concepts. It is not the full owner's 101–901 private portfolio.
- [Cross-product validation contracts](./core/root-contracts.js) define namespaces, references, scope checks and release-review gates. They do not implement real authentication.
- [Release gates](./RELEASE_GATES.md) describe backups, permissions, rights, payments, minors and publishing.
- ONE, 1420 and TABOR GPS now have separate install manifests. iPhone/Android field testing is still required.
- [Public test suite](./quality.test.cjs) and [GitHub CI](../.github/workflows/factory-ci.yml) check source integrity, links, Vault, GPS, ONE, 1420 and permission contracts.

## What is not yet automated
There is no server-side access to all of a user's past ChatGPT chats or ChatGPT Library imagery via this public website; users must provide an export or compatible files. The Factory cannot silently access other people's files or auto-publish them. A production user account and explicit, scoped authorization are prerequisites for online/cloud synchronization.


## 1420: The Crowning Jewel
Play: [1420: The Crowning Jewel](./games/crowning-jewel.html). Source: [game engine](./games/crowning-jewel.js) and [historical blueprint](./games/CROWNING-JEWEL-BLUEPRINT.md). Offline-capable browser prototype features a 1420 Tábor community-defense chapter, a separate 1872 Knights and Daughters of Tabor civic chapter, and a jointly unlocked historical archive puzzle. Historical era links are clearly identified as creative fiction. Validate rules with `node app-factory/games/crowning-jewel.test.cjs`. The actual cloud/native app builds and store submissions remain future tasks.

## ONE — The Last App
An independent universal personal OS project that can replace supported life modules or connect to other services with user grants. [Open ONE](./one/index.html) · [Architecture & constraints](./one/ONE-TECHNICAL-BUILD.md) · `node app-factory/one/one.test.cjs`. This is a local browser prototype, not an app with unrestricted access to all installed iPhone/Android apps.
