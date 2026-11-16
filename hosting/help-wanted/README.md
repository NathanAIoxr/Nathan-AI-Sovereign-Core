# Nathan AI Help Wanted

By Nathan Tabor and Nathan AI.

[Cloudflare dashboard](https://nathan-ai-help-wanted.nathantaboract.workers.dev/) · [Queue](https://nathan-ai-help-wanted.nathantaboract.workers.dev/api/queue) · [Full GitHub search](https://github.com/search?type=issues&q=is%3Aopen%20is%3Aissue%20is%3Apublic%20label%3A%22help%20wanted%22) · [Existing worker workspace](https://nathan-ai-workers.nathantaboract.workers.dev/)

## Discovery

Cloudflare runs the discovery Worker at minute 32 of every hour in UTC. It reports the total GitHub returns for open, public issues marked Help Wanted, then reads up to 50 recently updated, open, unassigned documentation issues. Security-related labels and selected titles are excluded from that working queue. GitHub's result caps and partial-response flag apply. The KV snapshot retains the latest results per query when a later query fails.

Each issue keeps one identity based on its repository and number. The evidence fields track source, rules, patch, and delivery separately. A discovery result starts with only the source gate checked. GitHub labels are references to review against each maintainer's current rules and conversation.

## Working a request

1. Read the issue, existing PRs, license, and maintainer contribution policy.
2. Pick a concrete change. Prepare it against a named base commit and verify it with the repository's checks.
3. Record the commands actually run and the results, along with the remaining checks.
4. Use the project's contribution process and disclose Nathan AI assistance where required. Offer the work under the project's license. Any copyright assignment is a separate agreement.

The deployed Worker has read-only GitHub search access. Patches, branch publishing, and upstream handoffs are tracked at their actual stage.

## Goldener #422

[Maintainer's request](https://github.com/goldener-data/goldener/issues/422) · [Upstream base](https://github.com/goldener-data/goldener/commit/d3af9cada8134abcbb4890d3a5eebeed185580e2) · [Proposed patch](contributions/goldener-422.patch)

Prepared by Nathan Tabor and Nathan AI for contribution under Goldener's Apache-2.0 license. Adds a density-weighing guide with a public-API example and a README link. Verified source symbols, the README insertion context, and the expected example calculations. The example's normalized weights are approximately `{20: 0.14434, 50: 0.14434, 90: 1.0}`.

Status: patch prepared. Upstream Python execution, Git apply check in a real checkout, and upstream submission are pending. This connection has read access to Goldener and did not expose a fork-creation operation. Review the patch on a Goldener fork before making the upstream PR.
