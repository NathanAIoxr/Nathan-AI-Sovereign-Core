# The Artifacts of the world

[Nathan Tabor’s original words and the catalog](https://tabor-artifacts-of-the-world.pages.dev/) · [Verbatim source](original.txt)

| Independent project | Live site |
| --- | --- |
| Staff of Moses | [Cloudflare Pages](https://tabor-staff-of-moses.pages.dev/) |
| Cleopatra’s broken staff | [Cloudflare Pages](https://tabor-cleopatra-staff.pages.dev/) |
| The holy Grail | [Cloudflare Pages](https://tabor-holy-grail.pages.dev/) |
| The Ark of the covenant | [Cloudflare Pages](https://tabor-ark-of-the-covenant.pages.dev/) |
| Nature, the human body and dark matter | [Cloudflare Pages](https://tabor-artifacts-nature-body.pages.dev/) |
| Elemental charge | [Cloudflare Pages](https://tabor-elemental-charge.pages.dev/) |
| End that war | [Cloudflare Pages](https://tabor-end-that-war.pages.dev/) |

Run `npm test` and `npm run build -- <app-id>` in this directory with Node 22. Each manifest in `apps/<app-id>/app.json` owns its content, source links and deploy address. The build produces a self-contained Pages Function in `dist/<app-id>/_worker.js`. Every site serves its identity at `/api/health`. The catalog serves `/api/catalog` and `/original.txt`. Dossiers serve `/api/record`.

GitHub Actions validates the record and builds each deployment separately. Automatic Pages deployment uses the Cloudflare account ID and a Pages Write token stored in GitHub Actions secrets `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_PAGES_API_TOKEN` (or the existing `CLOUDFLARE_API_TOKEN` if it has Pages Write). The job reports when a build is verified locally in CI and publication is skipped for missing credentials.

For mobile management, use the same Cloudflare account under **Workers & Pages** in Clouder Pro. Clouder uses its own Cloudflare token kept on the phone. Verify the app names and Cloudflare deployment status there.

## Worker, bot and agent assignments

The [live assignment board](https://tabor-artifacts-of-the-world.pages.dev/#assignments) and `assignments.json` list an ordered research queue covering all eight sites. Each Pages Function serves the public assignment for its own site at `/api/assignment`. The catalog serves the entire queue at `/api/assignments`.

The build workflow tests and builds the projects. The separate live verification workflow runs on matching pushes, on demand, and at minute 13 of every hour. It compares the returned bytes and content types for the public project routes against the checked-out source. A mismatch fails that run.

The existing hourly **Tabor Persona Builder** handles research and release follow-through. See the assignment board for its next research questions.
