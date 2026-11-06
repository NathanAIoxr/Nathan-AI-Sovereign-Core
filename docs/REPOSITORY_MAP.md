# Repository map and maintenance

This public repository contains browser applications, source catalogs and optional local services. Existing URLs and original source identities stay in place.

| Location | Purpose |
| --- | --- |
| `index.html`, `landing/` | Public homepage, navigation overlay and preserved former homepage |
| `app-factory/` | Browser applications, shared contracts and optional local services |
| `app-factory/nathan-ai/` | Nathan AI modules; read its `AGENTS.md` before editing |
| `app-factory/one/` | ONE applications and library interfaces |
| `archive-index/` | Source catalogs, alphabet departments and recovery indexes |
| `standalone-apps/` | Independent launch routes and store taxonomy proposals |
| `docs/` | Deployment, launch and maintenance guidance |
| `tools/release/` | Test runner and deterministic release builder |
| `tools/capability-atlas/` | Static source inventory scanner |
| `tools/library-bridge/` | Optional local library bridge |
| `scripts/` | Static entry-page verification |
| `.github/workflows/` | Automated checks, deployment and native build workflows |

The root Sudoku files are legacy source artifacts. Keep their paths until their consumers and provenance have been reviewed. Private originals and credentials belong outside this public checkout.

## Check the whole repository

Requirements: Node.js 22+ and Python 3.12+. No package installation is required for these checks. From the repository root:

```sh
python3 -B tools/release/check.py --out ../repository-checks
python3 -B tools/release/build.py --out ../repository-release
python3 -B tools/release/build.py --verify ../repository-release/nathan-ai-site.zip
```

The checker discovers JavaScript suites across all five maintained source trees, Python unittest directories, scanner checks, bounded runtime smoke checks and static entry-page checks. Reports and numbered logs go outside the checkout. The release builder requires a clean working tree; use `--allow-dirty` only for a development preview.

The complete repository workflow runs these commands on pull requests and main pushes. Existing focused workflows remain available for module-specific diagnosis. Passing these checks establishes automated source and package integrity; device, browser, provider and production testing remain separate.

The release builder packages public assets from all public site roots, checks local HTML links and verifies original downloads. `landing/original-chat-landing.html` is a byte-preserved historical root page: its original relative links are excluded from relocation checks. Use the current root homepage to launch applications.

## Maintain the existing structure

Put application changes beside their existing implementation and tests. Put source catalog changes under the matching archive department. Add maintenance documentation here and reusable release tooling under `tools/`. Keep release ZIPs and reports outside the checkout.

Review open pull requests against current main before combining work. Many are overlapping feature or recovery branches; their age alone does not establish that they should be merged or closed. Resolve supersession and source preservation explicitly. The current build record is in `WORK_STATUS.md`, and cross-project handoff notes are in `WORK_BUILD_HANDOFF.md`.
