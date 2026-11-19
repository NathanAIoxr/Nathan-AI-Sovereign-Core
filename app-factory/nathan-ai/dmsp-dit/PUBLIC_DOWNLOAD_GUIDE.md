# Get Nathan Tabor DMSP + DIT

**Public app:** https://nathan-ai-dmsp-dit.nathantaboract.workers.dev/

This is a web-first digital IT service catalog and local service-plan builder. The public app is free to explore and does not require an account.

## Three public ways to use it

1. **Open in any browser.** Visit the public app and explore the 28 service departments. Filter/search the catalog and choose DMSP, DIT or Co-managed.
2. **Install as a Progressive Web App.** On an iPhone or iPad: open in Safari, tap Share, then **Add to Home Screen**. On compatible Android/desktop browsers: choose **Install app** in the browser menu. PWA installation is browser-managed; it is not an App Store listing.
3. **Download offline edition.** Use [Download standalone HTML](https://nathan-ai-dmsp-dit.nathantaboract.workers.dev/download). The downloaded HTML includes the service catalog, styling and client-side plan builder. Open it directly in a browser from the file system. It needs no login and runs without Cloudflare once downloaded.

## Developer/source access

- [Repository](https://github.com/NathanAIoxr/Nathan-AI-Sovereign-Core)
- [DMSP + DIT app source](https://github.com/NathanAIoxr/Nathan-AI-Sovereign-Core/tree/main/app-factory/nathan-ai/dmsp-dit)
- [Public service catalog JSON](https://nathan-ai-dmsp-dit.nathantaboract.workers.dev/download/catalog.json)
- [Open source pull request and history](https://github.com/NathanAIoxr/Nathan-AI-Sovereign-Core/pull/356)
- [Cloudflare Workers deployment documentation](https://developers.cloudflare.com/workers/)

This project's repository-level `LICENSE` is Apache License 2.0. Upstream integration candidates have their own licenses and are **not bundled or automatically installed**.

## What users can do now

- Search and filter 28 digital IT service departments.
- Choose a delivery mode: outsourced DMSP, internal DIT or co-managed.
- Build a custom service-plan selection (stored in current browser memory, not sent to a server).
- Download a machine-readable JSON plan or copy a text summary.
- Export the service catalog as JSON.
- Save a standalone offline HTML edition for demos/education.
- Read the old IT → MSP → DMSP/DIT comparison and improvement priorities.
- Install the PWA on supported browsers, using a manifest and public-only service worker.

## What this does not yet do

The public app is **not** a staffed help desk, an authenticated customer portal, a working subscription payment service, a fleet of endpoint agents, or an RMM that controls remote devices. These require identity and tenant authorization, consent, billing, production monitoring providers, validated backups, security assessment and contractual service coverage. Existing private API routes are intentionally unavailable without secure configuration.

## Architecture and deployment

`worker.js` is the source for the Cloudflare module Worker. It serves a public HTML app, CSS, JS, install manifest, icon, public-only service worker, downloads, public catalog APIs, and guarded private API routes. Existing Cloudflare D1 database is bound as `DB`. GitHub Actions validates the Worker using Node tests.

- **Cloudflare Worker**: `nathan-ai-dmsp-dit`
- **Cloudflare D1**: `nathan-ai-dmsp-dit`
- **GitHub PR**: #356 (draft; not yet merged into main)
- **Deployment evidence**: `DEPLOYMENT_RECEIPT_2026-11-18.md`

### Clouder versus Cloudflare

**Clouder** is a third-party account-management application for Cloudflare. It is not the software distribution channel for visitors. The **Cloudflare Workers public URL** hosts the app; **GitHub** holds the code and change history. Users do not need a Clouder account or GitHub login to explore the public app.

### Privacy

The service-plan builder performs its selection and export locally in the browser. It does not send selected service plans to the backend. The service worker caches only enumerated public shell URLs and public API routes; it does not cache private ticket or tenant endpoints.
