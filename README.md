# TABOR 1-2-3 FACTORY™ / Nathan AI Sovereign Core

**Creator:** Nathan Tabor · **Workflow:** **1. CREATE → 2. CONNECT → 3. LAUNCH**.

This is the **PUBLIC**, browser-first coordination repository. It does **not** contain the owner's private full original-media library, private ZIP-only backend packages, unpublished research records, customer data, or credentials. It is not a deployed private multi-tenant SaaS backend.

## Open the currently published browser prototypes

- **Factory Home:** [Open the Factory](https://nathanaioxr.github.io/Nathan-AI-Sovereign-Core/app-factory/)
- **Public Ecosystem Directory:** [Browse documented products](https://nathanaioxr.github.io/Nathan-AI-Sovereign-Core/app-factory/ecosystem.html)
- **ONE — The Last App:** [Open ONE](https://nathanaioxr.github.io/Nathan-AI-Sovereign-Core/app-factory/one/)
- **Universal Creator Vault:** [Open the local Vault](https://nathanaioxr.github.io/Nathan-AI-Sovereign-Core/app-factory/vault.html)
- **TABOR GPS:** [Open geographic and personal-direction demo](https://nathanaioxr.github.io/Nathan-AI-Sovereign-Core/app-factory/tabor-gps/)
- **1420 — The Crowning Jewel:** [Play strategy prototype](https://nathanaioxr.github.io/Nathan-AI-Sovereign-Core/app-factory/games/crowning-jewel.html)
- **Root Constellation:** [Import and browse your private catalog locally](https://nathanaioxr.github.io/Nathan-AI-Sovereign-Core/app-factory/root-constellation.html)

The site can be **installed from a supported browser**; the Factory, ONE, TABOR GPS and 1420 each have an independent manifest/launch target. Installation does not supply missing real-provider credentials, route data or user accounts.

**Browser demos are not commercial releases.** The Vault saves originals into browser IndexedDB; the Vault's JSON index export does **not** include binary media. Keep separate original-file backups. Browsers may clear local data.

## Development and safe build workflow

- [Current verified build status](WORK_STATUS.md)
- [Work-mode cross-project handoff](WORK_BUILD_HANDOFF.md)
- [System-wide release gates and security requirements](app-factory/RELEASE_GATES.md)
- [Factory developer instructions](app-factory/README.md)
- [Privacy-scoped public product catalog](app-factory/products.json)
- [TABOR ROOT domain/asset/permission/release contracts](app-factory/core/root-contracts.js)

**Run tests locally** after cloning the repository (Node 22+, no package installation required):

```sh
node --test app-factory/quality.test.cjs
node --test app-factory/core/root-contracts.test.cjs
node --test app-factory/one/one.test.cjs
node --test app-factory/games/crowning-jewel.test.cjs
```

These are also run by [GitHub Actions](.github/workflows/factory-ci.yml). A green unit test does **not** replace mobile/browser accessibility, security, provider or real-money testing.

## Important architectural boundaries

TABOR WORLD, ONE, Nathan AI, TaborTales, TABOR INFINITUM, ChristmasToyDrive.com, and the other creations remain separate products. TABOR ROOT provides shared, **permissioned** contracts and potential infrastructure—not unrestricted cross-app access. The publicly documented product registry is intentionally **not** the full unreleased 101–901 private idea catalog.

The root `LICENSE` file is **Apache License 2.0**. Confirm that it matches the owner's intended licensing for *publicly committed code*. Do not assume it grants rights to separately held, unpublished images, game assets, brands, manuscripts or private source packages. Commercial licensing and third-party IP need review before release.

**No live payments, donation collection, financial transfer, private assistance intake or store publication is enabled by these public prototypes.** Human approval, secure server identity and provider verification are mandatory for high-impact actions.
