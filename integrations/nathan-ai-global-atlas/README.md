# Nathan AI — Global Infrastructure Atlas (Cloudflare Pages)

Native Pages project: `nathan-ai-global-atlas`.
Production URL: https://nathan-ai-global-atlas.pages.dev

## Actual work

- Cloudflare Pages project created 2026-11-18, production deployment ID `4db0e0f3-9dd5-487a-afb8-16b12958aa61`, API deployment stage `success`. This is an API direct-upload deployment, **not** a GitHub-linked build.
- Site is implemented by the local `_worker.js` file. It uses a static, explicitly dated infrastructure snapshot and links to the separate Cloudflare communications Worker's dynamic D1-backed catalog API.
- The file `source-candidates-2026-11-18.json` is a complete 205-record snapshot exported from **existing** production D1 `tabor-global-import-catalog.global_atlas_public_repos`, not invented Workers, new installations, or third-party code copied into this repository.
- D1 statuses at capture: 205 `discovered_not_installed` across 16 source categories. Installing a specific project requires license and dependency review, compatible hardware/runtime, and a distinct deployment/test receipt.
- There are 0 visible Cloudflare DNS zones in the connected account. Pages and Workers do **not** automatically create DNS zones; valid owned domain onboarding must be separate.

The first API Pages deployment failed because of a JavaScript template delimiter syntax error. The corrected second deployment reports success. Runtime public HTTP availability should be independently tested; successful deployment is not proof of every URL path.

## Source control

The Pages `_worker.js` and its D1-catalog export live in this directory on the linked GitHub feature branch; the production Pages project was deployed separately via the authorized Cloudflare API. To avoid automatic cross-account changes, repository push does not itself deploy this project. Pin deployment to a reviewed commit and verify with the Cloudflare Pages deployment API or a real HTTP health check.
