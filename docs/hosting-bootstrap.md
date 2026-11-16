# Nathan AI hosting bootstrap

## Active deployments

| Workload | Provider | Verification on 2026-11-16 |
| --- | --- | --- |
| [Nathan AI Sovereign Core](https://github.com/NathanAIoxr/Nathan-AI-Sovereign-Core) | GitHub | Existing public repository, default branch `main` |
| [Hook & Ring by Nathan Tabor](https://hook-and-ring.nathantaboract.workers.dev/) | Cloudflare Workers | Active deployment and HTTP 200 with the game UI |
| [Grapple It by Nathan Tabor](https://grapple-it.nathantaboract.workers.dev/) | Cloudflare Workers | Active deployment and HTTP 200 with the game UI |
| [Dual-Screen Arcade by Nathan Tabor](https://dual-screen-arcade.nathantaboract.workers.dev/) | Cloudflare Workers | Active deployment and HTTP 200 with the game UI |
| [Nathan AI Hosting Check](https://nathan-ai-hosting-check-nathantaboract-9022.vercel.app/) | Vercel Hobby | Standalone noncommercial test. A signed-in request returned HTTP 200 and `STATIC_ASSET_OK`. Vercel sign-in is required. |

The [portable static check](hosting-verification/index.html) has no runtime dependencies. Use it to verify new hosts with a small test instead of copying an app or account data during onboarding.

## Repository hosts

| Provider | Workload and activation |
| --- | --- |
| GitHub | Primary history, pull requests and existing releases. GitHub Pages can serve a public static project page. Use a private repo for new closed-source work. [Plans](https://docs.github.com/en/get-started/learning-about-github/githubs-plans) |
| GitLab.com | First secondary Git host. Create a private pilot project and push an initial copy. GitLab Pages can serve static docs with project access controls. The Free plan includes 400 hosted CI minutes/month. Built-in pull mirroring is a paid feature. [Pricing](https://about.gitlab.com/pricing/) · [Mirroring](https://docs.gitlab.com/user/project/repository/mirror/) · [Pages access](https://docs.gitlab.com/user/project/pages/pages_access_control/) |
| Bitbucket | Add a private test repo for Atlassian/Pipelines compatibility. The Free plan has five users and 50 build minutes/month. A workspace can serve one static site on `bitbucket.io`. [Pricing](https://www.atlassian.com/software/bitbucket/pricing) · [Static hosting](https://support.atlassian.com/bitbucket-cloud/docs/publishing-a-website-on-bitbucket-cloud/) |
| Azure DevOps | Add Azure Repos and test Azure Pipelines with a private pilot. The first five Basic users and private Git repos are included. Enable the Microsoft-hosted grant before scheduling builds. [Billing](https://learn.microsoft.com/en-us/azure/devops/organizations/billing/overview) · [Pipeline grant](https://learn.microsoft.com/en-us/azure/devops/pipelines/licensing/concurrent-jobs) |
| Gitoro | Pilot for private EU Git hosting. Start with a free workspace, confirm repository, storage and CI quotas, then test an import and restoration with a sample repo. Gitoro says repository, CI and upload data are on EU infrastructure. [Gitoro](https://gitoro.com/) · [Pricing](https://gitoro.com/de/preise) |
| Codeberg | Publish a deliberately licensed free/open-source library or public docs with Codeberg Pages. Private storage is for work supporting qualifying free/libre projects and usage above 100 MB should be discussed with Codeberg. [Eligibility and quotas](https://docs.codeberg.org/getting-started/faq/) · [Pages](https://docs.codeberg.org/codeberg-pages/) |
| Framagit | Pilot a project appropriate for Framasoft with optional static docs or CI. Its documentation lists **42 projects per person**, public or private. [Framasoft documentation](https://docs.framasoft.org/fr/gitlab/) |
| TuxFamily | Track as an open-source hosting option. Its signup documentation says it is closed to new projects. [Project intake](https://faq.tuxfamily.org/Welcome/EN) |
| Gitee | Verify account eligibility with an already-public sample before adding this regional remote. Gitee's help center lists Pages and Pages Pro as offline. [Help center](https://help.gitee.com/) |
| GitVerse | Test account eligibility and Git/CI with an already-public sample. Hosted CI has build and artifact quotas. [CI limits](https://gitverse.ru/docs/cicd/docs/limits/) |
| Forgejo, Gitea or GitBucket | Use one self-hosted forge when hosting is available. Forgejo is the default for this map. Use existing hardware for a no-new-subscription test. Hetzner, Scaleway and Hostinger are paid VPS options when an owned European Git host is needed. [Forgejo](https://forgejo.org/) · [Gitea](https://docs.gitea.com/) · [GitBucket](https://github.com/gitbucket/gitbucket) · [Hetzner](https://www.hetzner.com/cloud/) · [Scaleway](https://www.scaleway.com/en/pricing/) · [Hostinger](https://www.hostinger.com/vps-hosting) |

## App and site hosts

| Provider | Workload and activation |
| --- | --- |
| Cloudflare Workers | Public game host. Keep browser gameplay on static assets and add Worker/D1 routes when shared data is needed. For Git-driven builds, authorize the specific source repository and set its production branch. [Static assets](https://developers.cloudflare.com/workers/static-assets/) · [Git integration](https://developers.cloudflare.com/workers/ci-cd/builds/git-integration/) |
| Netlify | Deploy the portable static check, then use it for a spare demo or landing page. The Free plan has 300 shared credits/month. [Credits](https://docs.netlify.com/manage/accounts-and-billing/billing/billing-for-credit-based-plans/credit-based-pricing-plans/) |
| Vercel | Keep the existing pilot for personal/noncommercial tests under Hobby. [Terms](https://vercel.com/legal/terms) |
| Render | Deploy a disposable conventional backend or a static test. Free web services sleep after 15 minutes of inactivity and use ephemeral disk. [Free services](https://render.com/docs/free) |
| Azure Static Web Apps | Publish the static check or a spare frontend after connecting the selected source repo. [Hosting plans](https://learn.microsoft.com/en-us/azure/static-web-apps/plans) |
| Koyeb | Deploy a disposable Docker, Node or Python service in Frankfurt to test an EU execution region. The Free plan allows one instance per organization and offers Frankfurt or Washington, D.C. [Instance limits](https://www.koyeb.com/docs/reference/instances) |
| Wasmer | Test a personal/noncommercial WebAssembly or static deployment. Its advertised Hobby allowance includes 150 GB bandwidth and six compute hours. Confirm effective app and storage quota in the account because the public pricing page contains different app counts. Verify region and data terms before choosing a residency workload. [Pricing](https://wasmer.io/pricing) |
| Multos AI | Prototype with sample inputs and export the resulting source to a selected Git repo. The vendor advertises unlimited projects and a monthly generation allowance. Deployment quotas come from the selected host. [Builder and source export](https://multos.ai/ai/ai-app-builder-unlimited-projects/) |

## Activation order

1. **GitLab and Gitoro.** Sign in to each provider and create an empty private pilot repository. Push the same sample Git history to both and compare the default-branch commit to the source. Check the plan limits before moving a larger repo.
2. **Koyeb Frankfurt, Netlify and Azure Static Web Apps.** Deploy the check or a sample endpoint on the free plan. Verify the deployed content, region where selectable, and quota from the provider dashboard.
3. **Codeberg and Framagit.** Choose a small eligible project with an explicit license. Publish project docs and run a minimal CI job if enabled.
4. **Bitbucket, Azure Repos, Wasmer, Multos, Gitee and GitVerse.** Start with a sample repo or static page sized to the requested feature, then record whether signup, push, the build and export all worked.
5. **Forgejo, Gitea and GitBucket.** Choose one implementation and use an available machine. Record a restore test before treating it as a backup target. Review renewal pricing before provisioning a VPS.

For each target record the source commit, account plan, destination URL, access level, branch or deployment version, and restoration or HTTP check. A repository copy needs a separate check for Git LFS or release artifacts. Issue history, pull requests, and build secrets require their own migration. For EU-only workloads, verify the contracting entity, storage and build regions, subprocessors, and any backup or support access before importing production data.

### Verify a first Git copy

Use a small sample source and an empty destination. Sign in with the provider's normal Git credential flow before pushing.

```sh
git clone --bare "$SOURCE_URL" bootstrap-pilot.git
git -C bootstrap-pilot.git push "$DEST_URL" --all
git -C bootstrap-pilot.git push "$DEST_URL" --tags

source_sha=$(git ls-remote --exit-code "$SOURCE_URL" refs/heads/main | cut -f1)
destination_sha=$(git ls-remote --exit-code "$DEST_URL" refs/heads/main | cut -f1)
test -n "$source_sha" && test "$source_sha" = "$destination_sha"
```

Replace `main` with the upstream default branch when needed. Clone the destination into a clean directory and build it to verify restoration.
