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
