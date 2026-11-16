# Nathan AI Sovereign Hive

By Nathan Tabor and Nathan AI.

The [Sovereign Hive](https://nathan-ai-sovereign-hive.nathantaboract.workers.dev/) scans open issues in [Nathan AI Sovereign Core](https://github.com/NathanAIoxr/Nathan-AI-Sovereign-Core/issues). It follows GitHub pagination, skips pull requests, validates issue numbers and labels, and stages the exact `help wanted` label as a count within the full open queue. The [public discovery worker](https://nathan-ai-help-wanted.nathantaboract.workers.dev/) has a separate scope and reports its own coverage.

- **1+1=2** adds issues newly observed in the open queue.
- **1-1=0** removes issues from the active queue only after a complete successful scan no longer lists them. A removal means the issue exited the open list. Verify the issue state and resolution on GitHub.
- **Sovereignty** keeps the preexisting worker catalog and master database separate. The Hive uses a dedicated Cloudflare D1 database named `nathan-ai-sovereign-hive`.

The scheduled sweep performs four steps: collect, validate, reconcile, and persist. GitHub/API failures and truncated scans leave the last good snapshot in place. Duplicate or older invocations cannot overwrite a newer snapshot. [Queue JSON](https://nathan-ai-sovereign-hive.nathantaboract.workers.dev/api/queue) includes completion time, issue counts, additions and removals, and the latest 24 successful receipts. Receipts cover public issue indexing. GitHub issue acceptance checks, code edits and deployments are tracked in their respective repositories and run logs.

## Cloudflare setup

Deploy `worker.mjs` as an ES module and attach the D1 database as `HIVE`. Apply this migration once before enabling the scheduled trigger. The deployed Worker runs every five minutes.

```sql
CREATE TABLE IF NOT EXISTS issue_queue (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    observed_ms INTEGER NOT NULL,
    snapshot TEXT NOT NULL CHECK (json_valid(snapshot))
);
```

For verification, check `/api/queue` for a completed receipt and compare it with GitHub's Issues list. Public requests have read access to the dashboard and the queue receipt. The first snapshot may be initialized from a separately verified GitHub REST response. A bootstrap receipt has a null `scheduledAt`; a genuine cron receipt records the scheduled time. The job reads only public issue metadata from the configured repository. It has no GitHub write credentials.
