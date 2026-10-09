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
- Publish this dashboard as a static site (e.g. GitHub Pages) and add it to iPhone Home Screen.
- Connect Codex to the intended repositories.
- Configure Expo/EAS cloud build and Apple developer signing for native iOS releases.
- Set up App Store Connect and required developer enrollment for App Store distribution.
- For Google Play, configure a Google Play developer account and Android build pipeline.
- Configure store metadata, privacy disclosures, screenshots, age rating, billing/tax details, and release approval.
- Add per-app CI, tests, versioning, backups, and revenue reporting.

## Architecture
- Keep this repository as the control hub.
- Create separate repositories for individual products.
- Use reusable project templates and workflows, not copied apps.
- The dashboard at app-factory/index.html is a navigation-only starter. It does NOT perform cloud builds or store submissions.
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

## What is not yet automated
There is no server-side access to all of a user's past ChatGPT chats or ChatGPT Library imagery via this public website; users must provide an export or compatible files. The Factory cannot silently access other people's files or auto-publish them. A production user account and explicit, scoped authorization are prerequisites for online/cloud synchronization.
