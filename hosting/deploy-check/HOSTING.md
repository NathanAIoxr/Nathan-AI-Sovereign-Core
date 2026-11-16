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
