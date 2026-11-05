# Nathan AI — GitHub Pages publication and verification

The public web code is deployed from the repository's **main** branch through
`.github/workflows/nathan-ai-pages.yml`. This deployment workflow is additive:
it does not rewrite existing app programs or publish private Library files.

## Public entry points

- Main Hub: `https://nathanaioxr.github.io/Nathan-AI-Sovereign-Core/app-factory/nathan-ai/`
- D native gateway: `https://nathanaioxr.github.io/Nathan-AI-Sovereign-Core/app-factory/nathan-ai/d-archive/`
- Original D source explorer: `https://nathanaioxr.github.io/Nathan-AI-Sovereign-Core/archive-index/alphabet/d/`
- HOP IN chatbox: `https://nathanaioxr.github.io/Nathan-AI-Sovereign-Core/app-factory/nathan-ai/hop-in/chatbox/`
- Websites & Worlds: `https://nathanaioxr.github.io/Nathan-AI-Sovereign-Core/app-factory/nathan-ai/websites/`
- My Desktop: `https://nathanaioxr.github.io/Nathan-AI-Sovereign-Core/app-factory/nathan-ai/websites/launchpad.html`

All links above are *expected* URLs, not proof that GitHub Pages is enabled or
has successfully published them. The Pages workflow runs local tests first,
then uploads public repository content and deploys it, then checks seven live
file responses plus exact author title fidelity.

## One-time repository setting, if publication is disabled

GitHub repo > **Settings** > **Pages** > **Build and deployment** >
**Source: GitHub Actions**. This setting needs a repository administrator. The
standard GitHub Actions `GITHUB_TOKEN` cannot always enable Pages on a repository
where Pages is disabled; the publishing job will report that state rather than
pretend the website is live. No token should be put in browser JavaScript.

Next open **Actions** > **Nathan AI · Publish GitHub Pages** > **Run workflow**,
or merge a change to `main` affecting the public files. A successful
`publish` job and a successful **verify-live** job together are the
publication evidence.

## Local validation

```sh
python3 scripts/verify_d_pages.py --root .
node --test archive-index/alphabet/d/d-family.test.mjs
node --test archive-index/alphabet/d/canonical-d-sequences.test.mjs
node --test app-factory/nathan-ai/hop-in/chatbox/engine.test.cjs
node --test app-factory/nathan-ai/websites/site.test.cjs
```

A Pages release is a static site. HOP IN's optional model provider integration,
external domains, secure services and private file vaults are **not** enabled
by GitHub Pages alone.

## Ownership

Existing public source remains in its original repository location. The D
gateway *links to and embeds* the original D explorer; it does not fork or
replace author text. `canonical-d-sequences.json` retains five original D
source strings, while generated inversions remain separately classified.
