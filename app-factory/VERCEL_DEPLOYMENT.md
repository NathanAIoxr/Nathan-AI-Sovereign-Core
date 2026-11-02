# NATHAN AI 🚀 — Vercel Static Deployment Runbook

**Date:** 2026-11-02  
**Repository:** [NathanAIoxr/Nathan-AI-Sovereign-Core](https://github.com/NathanAIoxr/Nathan-AI-Sovereign-Core)  
**Production branch:** `main`  
**Scope:** Public static browser prototypes already present in this repository. This is an additive deployment guide; it does not change application code or release private assets.

## 1. Import the existing repository

1. Open [Vercel — New Project](https://vercel.com/new).
2. Use the connected GitHub account and import **NathanAIoxr/Nathan-AI-Sovereign-Core**.
3. Configure the project before pressing **Deploy**:

| Vercel option | Recommended value |
| --- | --- |
| Project name | `nathan-ai` (or another available name) |
| Repository | `NathanAIoxr/Nathan-AI-Sovereign-Core` |
| Production branch | `main` |
| Framework Preset | **Other** |
| Root Directory | Repository root (`./`) |
| Build Command | **Override ON, field empty** (static files; no build) |
| Install Command | Not required |
| Output Directory | `.` (repository root) |
| Environment variables | **None required** for the public static prototype |

This preserves relative links and the existing repository entry point. **Do not set the root directory to `app-factory/nathan-ai`**: the Main Hub links to sibling applications in `app-factory/one` and other locations. Do not substitute a new starter app.

> Vercel's built-in dashboard may prompt for installation of its GitHub app and a selected repository authorization. Grant access to this repository through Vercel's own consent flow. Do not paste tokens, credentials, or passwords into code or chat.

## 2. Expected public paths

The repository-root `index.html` redirects visitors to `./app-factory/nathan-ai/`. Check the following paths at the resulting Vercel deployment domain:

| Purpose | Route |
| --- | --- |
| Nathan AI Main Hub | `/app-factory/nathan-ai/` |
| ONE — The Last App | `/app-factory/one/` |
| TABOR Factory | `/app-factory/` |
| Children & Innocence | `/app-factory/nathan-ai/children-innocence/` |
| 21 Sovereign Coins demo | `/app-factory/nathan-ai/sovereign-coins/` |
| Build Recovery | `/app-factory/nathan-ai/build-recovery/` |

These are **file paths in GitHub**, not claims that a Vercel deployment has already succeeded.

## 3. Acceptance checks after deploying

- [ ] Vercel project exists and reports **Ready**, with a real deployment URL.
- [ ] Root URL loads or redirects to **Nathan AI Main Hub**.
- [ ] Main Hub stylesheet and scripts load without a 404.
- [ ] Navigate to **ONE**, **Factory**, **Children & Innocence**, **Sovereign Coins**, and **Build Recovery**.
- [ ] Browser console reports no unexpected runtime or mixed-content errors.
- [ ] Manifest icons and PWA installation are checked on HTTPS, including mobile.
- [ ] Confirm that original navigation and relative asset links behave correctly on the Vercel domain.
- [ ] Confirm the site does not imply server accounts, cloud backups, payments, or private backend services are enabled.
- [ ] Verify a preview deployment from a test branch and preserve a human release-approval step before subsequent production changes.

## 4. Privacy, IP, and release boundaries

- This GitHub repository is **public**; the Vercel site is a public deployment of its existing browser code. **Do not upload** personal originals, private manuscripts, vault exports, unreleased files, .env files, tokens, customer/child records, passwords, or sensitive medical/financial records.
- Keep original modules, filenames, source history, licensing, product identities, and user-authored text intact. This procedure **does not migrate** unrelated repositories or private Library files.
- Existing `app-factory/RELEASE_GATES.md` remains authoritative for publishing eligibility. Static hosting does **not** confer production security, multi-user identity, provider APIs, payment readiness, or app-store eligibility.
- Existing local-first browser data remains in the user's browser, not automatically synchronized with Vercel. Do not treat a hosting deployment as a cloud backup.

## 5. Operations

- Git integration can create preview deployments for changes and production deployments from the designated production branch. Confirm Vercel's exact Git settings after import.
- To roll back, select an earlier healthy deployment in the Vercel dashboard rather than deleting or rewriting authored GitHub source files.
- Keep the already-published GitHub Pages site as an independent reference during initial verification.
- Record the verified Vercel project URL, exact build commit, deployment state, and test evidence in an addendum to this file **after** first deployment; never invent a live URL or status.

Official references: [Vercel Git deployments](https://vercel.com/docs/git), [Vercel static builds](https://vercel.com/docs/builds/configure-a-build), [Vercel project configuration](https://vercel.com/docs/project-configuration).
