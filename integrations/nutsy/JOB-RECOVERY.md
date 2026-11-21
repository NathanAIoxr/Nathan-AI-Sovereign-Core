# NUTSY job recovery

The Ubuntu Conductor and Cloudflare build workers have separate queues. GitHub handoffs can describe runnable work, and require a dispatch ID or destination receipt to prove execution. In particular, the merged Labs recovery wrapper documents its Cloudflare schedule and an existing Independent App Builds rotation. A Labs transition can therefore occur while the Ubuntu health counts are unchanged.

## Repeat the comparison

1. In the existing Cloudflare account, query `tabor-autonomous-builds` for per-status counts. Repeat this read-only statement for the fixed list of known tables below.

   ```sql
   SELECT status, COUNT(*) AS count FROM lab_recovery_jobs_v1 GROUP BY status ORDER BY status;
   ```

   Tables are `app_store_release_jobs_v1`, `game_station_jobs_v1`, `lab_recovery_jobs_v1`, `release_fleet_jobs_v1` and `supercomputer_jobs`. Save a JSON object keyed by table, with an array of `{"status":"queued","count":1}` shaped rows for each table. Use each provider's source-specific state names.

2. On NUTSY, run the verifier with a read-capable operator account against the live ledger so SQLite can read committed WAL data. Leave existing services running.

   ```sh
   python3 integrations/nutsy/reconcile.py --cloud-snapshot cloud-counts.json
   python3 integrations/nutsy/reconcile.py --cloud-snapshot cloud-counts.json --record-id RECORD_ID
   ```

3. For an approved D1 write, correlate the exact ID with `nathan-conductor.records` and the matching Ubuntu queue row. A missing correlation stays unresolved. For other tasks, record the actual destination receipt, such as a GitHub commit/PR or an R2 object checksum. Never move an external queue row into Ubuntu based solely on its title or aggregate counts.

## Observed November 21, 2026

| Provider and table | Recorded state |
|---|---|
| Ubuntu authenticated Conductor health | 0 pending, 8 completed, 0 failed |
| Cloudflare app store release queue | 1,092 queued |
| Cloudflare game station queue | 69 queued, 19 verified |
| Cloudflare Labs recovery queue | 5 queued, 4 blocked, 10 verified |
| Cloudflare release fleet queue | 42 queued, 3 blocked, 542 verified |
| Cloudflare Supercomputer queue | 7 complete with results, comprising five digest jobs, one matrix job and one verification job |
| Cloudflare NUTSY tunnel | Inactive, zero connections |

The arithmetic probe's exact record ID returned zero matches in `nathan-conductor.records`. The authenticated plugin can read health and prepare approved dispatches. Per-job Ubuntu readback requires access to the host ledger or a separately available authenticated status interface. To restore the tunnel, check the connector on the Linux host and confirm a live connection in Cloudflare before relying on the tunnel. The available health connector can respond through its existing route while the Cloudflare tunnel is inactive.

The [source crosswalk](recovered-sources.json) preserves the hardware track rows, individual reference models, supercomputer systems, Labs title entries, job IDs and repository sources. The [Labs handoff](https://github.com/NathanAIoxr/Nathan-AI-Sovereign-Core/pull/528) links the original private recovery archive and its public source manifest. Private original records remain at their existing destination. For the Tabor OS Family Kernel Lock, see [the original boot packet](https://github.com/NathanAIoxr/Nathan-AI-Sovereign-Core/issues/508). CLEAR applies to a derived state and preserves originals, physical inventory and unresolved evidence.
