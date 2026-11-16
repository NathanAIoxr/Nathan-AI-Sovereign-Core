# Nathan AI free hosting bootstrap

Verified November 16, 2026. The portable starter is in `hosting/deploy-check/site` on `hosting/nathan-ai-deployment-check`. It requires no framework, package installation, build command, custom domain, or private database.

| Platform | Verified setup | Link |
| --- | --- | --- |
| GitHub | Starter HTML, Worker, tests and an Actions workflow committed to the dedicated hosting branch. A workflow run was not returned by the provider. | [Starter source](https://github.com/NathanAIoxr/Nathan-AI-Sovereign-Core/tree/hosting/nathan-ai-deployment-check/hosting/deploy-check) |
| GitHub Pages | Existing Nathan AI Main Hub returned HTTP 200. | [Main Hub](https://nathanaioxr.github.io/Nathan-AI-Sovereign-Core/app-factory/nathan-ai/) |
| Cloudflare Workers | Test page and JSON health endpoint returned HTTP 200. | [Test page](https://nathan-ai-deployment-check.nathantaboract.workers.dev/) · [Health](https://nathan-ai-deployment-check.nathantaboract.workers.dev/api/health) |
| Vercel Hobby | Static deployment returned HTTP 200 on its production alias. Updates currently use direct deployments. | [Test page](https://nathan-ai-deployment-check-nathantaboract-9022.vercel.app/) |
| Cloudflare Pages | Git project creation was blocked by the Cloudflare Pages Git installation. | [GitHub authorization guide](https://developers.cloudflare.com/pages/configuration/git-integration/github-integration/) |

## Connect the next hosts

1. For Cloudflare Pages, install and authorize the Workers & Pages GitHub app for this repository. Choose `hosting/nathan-ai-deployment-check` as the production branch and `hosting/deploy-check/site` as the build output directory. Use no framework and keep the build command blank.
2. For Vercel push-to-deploy, authorize the [Vercel GitHub app](https://github.com/apps/vercel). Use `hosting/deploy-check/site` as the root directory and `hosting/nathan-ai-deployment-check` as the production branch. The current direct deployment is already live.
3. Netlify and Render can import the same branch as a static site and publish `hosting/deploy-check/site`. Use the free tier. [Netlify import](https://docs.netlify.com/start/quickstarts/deploy-from-repository/) · [Render static sites](https://render.com/docs/static-sites)
4. For a second Git host, import a reviewed repository into [GitLab](https://about.gitlab.com/pricing/) or [Azure Repos](https://learn.microsoft.com/en-us/azure/devops/organizations/billing/overview?view=azure-devops). Match the repository's visibility when importing. [Bitbucket](https://www.atlassian.com/software/bitbucket/pricing) is another option for small teams.
5. For European hosting, use [Codeberg](https://docs.codeberg.org/getting-started/faq/) for appropriately licensed open-source projects. [Framagit](https://framasoft.frama.io/rgpd/services/framagit/) and [Gitoro](https://gitoro.com/pricing) can be evaluated as Git hosts against account access, capacity and use terms.
6. [Firebase Spark](https://firebase.google.com/pricing) adds a static hosting option. [Multos](https://multos.ai/pricing/) adds a code generation option with a free model allowance. Self-hosting [Forgejo](https://forgejo.org/docs/latest/admin/installation/), Gitea or GitBucket requires an available host and its maintenance.

## Cost and scope

GitHub repository counts and GitHub Pages storage are separate limits. [Cloudflare Pages](https://developers.cloudflare.com/pages/platform/limits/) documents 500 Free builds per month and a 100-project account limit. [Workers Free](https://developers.cloudflare.com/workers/platform/limits/) has a separate 100,000-request daily limit. [Vercel Hobby](https://vercel.com/pricing) is for personal, non-commercial use. [Netlify Free](https://www.netlify.com/pricing/personal-vs-free/) uses 300 monthly credits. Check the provider's usage page before adding more workloads.

The live deployment check uses synthetic content. The Git branch stores its source and portability notes. Data and credentials belong in the intended project's authorized environment.

## Regional hosting and offline use

Reviewed November 16, 2026. Use the same static starter from this branch to test each destination. A repository host, an application runtime, a database, and a CDN can each have different regions. Verify storage for Git objects, Git LFS, CI artifacts, application data, logs, and backups individually before treating a deployment as region-bound.

| Region | Option | What the service supports | Prerequisite for this project |
| --- | --- | --- | --- |
| Europe | Codeberg, Germany | Forgejo Git hosting and Codeberg Pages for free and open-source projects. Codeberg asks users to contact them when private storage exceeds 100 MB for permitted use cases. Hosted Woodpecker access and Forgejo Actions runners have distinct setup requirements. [FAQ](https://docs.codeberg.org/getting-started/faq/) · [Pages](https://docs.codeberg.org/codeberg-pages/) · [Docs](https://docs.codeberg.org/) | Codeberg account and a suitably licensed project selected for mirroring. |
| Europe | Framagit, France | Framasoft operates this GitLab instance and documents CI-driven Pages on `frama.io`. Check account eligibility and runner quotas for the workspace. [Framasoft account setup](https://docs.framasoft.org/fr/gitlab/2-creation-configuration-compte.html) · [Pages](https://docs.framasoft.org/fr/gitlab/gitlab-pages.html) | Authenticated Framagit project. |
| Europe | Gitoro, Denmark | European Git hosting with a free starting plan and separate seats, storage, and CI allowances. [Pricing](https://gitoro.com/pricing) | Authorized workspace and confirmation of its live allowance. |
| Europe | Wasmer Edge | GitHub-connected application deployments on a WebAssembly platform. The official Hobby listing shows six compute hours and is for personal, noncommercial projects. Choose a supported template or runtime for each app. [Pricing](https://wasmer.io/pricing) · [Git](https://docs.wasmer.io/edge/git/) · [Regions](https://docs.wasmer.io/edge/learn/regions/) | Wasmer account and repository authorization. |
| Europe | Koyeb | One free Web Service instance per organization. Frankfurt is the free European region. It scales to zero after one hour without traffic and free instances cannot attach a persistent volume. Koyeb documents card verification and possible charges based on the signup plan and usage. [Instances](https://www.koyeb.com/docs/reference/instances) · [Billing FAQ](https://www.koyeb.com/docs/faqs/pricing) | User completes account validation and confirms the selected plan and usage terms. |
| Asia | Gitee, China | Git hosting and collaboration. Gitee's help center labels Gitee Pages discontinued. [Gitee Help](https://gitee.com/help.com/) | Authenticated workspace to check actual repository and collaborator limits. Web hosting needs another provider. |
| Asia / Eurasia | GitVerse | Advertises unlimited public and private repositories on Free, with storage and CI limits. Standard private CI allowance is 2,000 minutes per month. Public CI has separate terms. [Pricing](https://gitverse.ru/home/pricing/) · [CI limits](https://gitverse.ru/docs/limits-lfs-cicd/limits-cicd/) | Account eligibility, account access, and an owner-approved repository to mirror. |
| South America | Forgejo or Gitea on OCI in São Paulo or Vinhedo | OCI lists both Brazilian regions. Always Free compute must be provisioned in the tenancy's home region and depends on capacity. Vultr lists São Paulo as a paid fallback. Contabo's published VPS regions omit Brazil. [OCI regions](https://docs.oracle.com/en-us/iaas/Content/General/Concepts/regions.htm) · [OCI Free](https://docs.oracle.com/en-us/iaas/Content/FreeTier/freetier_topic-Always_Free_Resources.htm) · [Vultr São Paulo](https://blogs.vultr.com/Ol-Brasil-Vultrs-20th-Cloud-Location-is-in-So-Paulo) · [Contabo](https://docs.contabo.com/docs/servers-hosting/vps/) | Access to a Brazilian home-region tenancy or an existing local server. |
| Africa | Forgejo or Gitea on OCI in Johannesburg. AWS Cape Town is a time-limited trial candidate. | OCI lists Johannesburg. AWS's current Free account plan for new customers lasts up to six months or until credits run out. Cloudflare lists edge locations in Cairo, Lagos, Nairobi, Johannesburg, and Cape Town. Confirm the separate origin and data regions. [OCI regions](https://docs.oracle.com/en-us/iaas/Content/General/Concepts/regions.htm) · [AWS Free Tier](https://docs.aws.amazon.com/awsaccountbilling/latest/aboutv2/free-tier.html) · [Cloudflare locations](https://www.cloudflarestatus.com/locations) | Access to an eligible account and available compute in the intended region. |
| Australia / Oceania | OCI in Sydney or Melbourne for a self-hosted forge. Bitbucket Cloud for general collaboration. | OCI lists both Australian regions. Bitbucket Free supports five users and 50 Pipelines minutes per month. Atlassian's published Bitbucket Cloud residency rollout does not establish Australian pinning. [OCI regions](https://docs.oracle.com/en-us/iaas/Content/General/Concepts/regions.htm) · [Bitbucket limits](https://support.atlassian.com/bitbucket-cloud/docs/limitations-of-bitbucket-pipelines/) · [Atlassian residency update](https://community.atlassian.com/forums/discussion/3282761/bitbucket-multi-region-architecture-and-eu-data-residency-coming-soon) | Access to an Australian home-region tenancy or an existing Australian server for physical placement. |
| Antarctica / disconnected networks | Git bundles, Radicle, or Fossil | Git bundles transfer Git objects by file. Radicle syncs Git repositories when peers can connect. Fossil is a separate distributed SCM with its own repository format and a built-in web interface, wiki, and issue tracker. [Git bundles](https://git-scm.com/docs/git-bundle) · [Radicle](https://radicle.dev/faq) · [Fossil](https://fossil-scm.org/home/doc/trunk/www/index.wiki) | A local machine and an offline transport or reachable peers. |

For a regional self-hosted forge, choose the country and host first. Install Forgejo or Gitea with a persistent volume and a local SQLite database for a small installation. Set up authenticated HTTPS, create a new private test repository, and test clone and restore before importing project repositories. Put CI runners, logs, external storage, and backups in the intended region when they are part of the residency requirement. Oracle documents capacity limits and possible reclamation of idle Always Free instances. [Forgejo install](https://forgejo.org/docs/latest/admin/installation/) · [Forgejo database setup](https://forgejo.org/docs/latest/admin/database-preparation/) · [OCI Free capacity and idle resources](https://docs.oracle.com/en-us/iaas/Content/FreeTier/freetier_topic-Always_Free_Resources.htm)

### Prepare a disconnected copy

Run the first command while connected. This example uses the public hosting branch and carries that branch's Git history. A static-only copy can carry just the `hosting/deploy-check/site` folder. For repositories with Git LFS or submodules, prepare those objects and repositories separately.

```sh
git clone --single-branch --branch hosting/nathan-ai-deployment-check https://github.com/NathanAIoxr/Nathan-AI-Sovereign-Core.git nathan-ai-portable
git -C nathan-ai-portable bundle create ../nathan-ai-starter.bundle refs/heads/hosting/nathan-ai-deployment-check
git -C nathan-ai-portable bundle verify ../nathan-ai-starter.bundle
git clone --branch hosting/nathan-ai-deployment-check ./nathan-ai-starter.bundle nathan-ai-restored
python3 -m http.server 8000 --bind 127.0.0.1 --directory nathan-ai-restored/hosting/deploy-check/site
```

With Python 3 installed, open `http://127.0.0.1:8000/` locally. The static starter needs no internet once the files are on the device. This runbook records provider capabilities. The regional accounts and servers above are pending connection.
