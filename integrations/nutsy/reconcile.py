"""Compare Ubuntu Conductor's read-only SQLite queue with an observed Cloudflare snapshot."""

import argparse
from collections import Counter
import json
from pathlib import Path
import sqlite3


def load_cloud_snapshot(path):
    snapshot = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(snapshot, dict):
        raise ValueError("Expected a Cloudflare table-to-status-counts JSON object")
    for table, rows in snapshot.items():
        if not isinstance(rows, list):
            raise ValueError(f"{table}: expected status-count rows")
        statuses = set()
        for row in rows:
            if (
                not isinstance(row, dict)
                or not isinstance(row.get("status"), str)
                or not row["status"]
                or row["status"] in statuses
                or type(row.get("count")) is not int
                or row["count"] < 0
            ):
                raise ValueError(f"{table}: invalid or duplicate status count")
            statuses.add(row["status"])
    return snapshot


def reconcile(ledger, cloud, record_id=None):
    # SQLite must see the live WAL. Never use immutable=1 for a running Conductor database.
    uri = ledger.resolve().as_uri() + "?mode=ro"
    with sqlite3.connect(uri, uri=True, timeout=5) as db:
        db.execute("PRAGMA query_only=ON")
        db.execute("BEGIN")
        ubuntu = [
            dict(task_type=task_type, status=status, count=count)
            for task_type, status, count in db.execute(
                "SELECT task_type, status, COUNT(*) FROM task_queue "
                "GROUP BY task_type, status ORDER BY task_type, status"
            )
        ]
        matching_dispatches = None
        if record_id:
            matching_dispatches = [
                dict(queue_id=queue_id, status=status, attempts=attempts)
                for queue_id, status, attempts in db.execute(
                    "SELECT id, status, attempts FROM task_queue WHERE task_type='D1_WRITE' "
                    "AND CASE WHEN json_valid(payload) THEN json_extract(payload, '$.id') END = ? "
                    "ORDER BY id",
                    (record_id,),
                )
            ]

    cloud_counts = Counter()
    for rows in cloud.values():
        for row in rows:
            cloud_counts[row["status"]] += row["count"]
    return {
        "ubuntu": ubuntu,
        "cloudflare": cloud,
        "cloudflare_totals": dict(cloud_counts),
        "record_lookup": None if not record_id else {"id": record_id, "ubuntu_dispatches": matching_dispatches},
        "correlation": "Aggregate counts describe separate queues. Use a recorded stable ID and destination receipt for a per-job match.",
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--ledger", type=Path, default=Path("/opt/conductor/data/ledger.db"))
    parser.add_argument("--cloud-snapshot", type=Path, required=True)
    parser.add_argument("--record-id", help="find the exact D1 record ID in the Ubuntu queue")
    args = parser.parse_args()
    try:
        result = reconcile(args.ledger, load_cloud_snapshot(args.cloud_snapshot), args.record_id)
    except (OSError, sqlite3.Error, ValueError) as error:
        parser.exit(1, f"{error}\n")
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
