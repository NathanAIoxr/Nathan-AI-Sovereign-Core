"""Durable local intake and a metadata-only outbox for the Sovereign Engine."""

import argparse
from contextlib import closing
import hashlib
import json
import os
from pathlib import Path
import sqlite3
import time
from urllib import request
from uuid import uuid4

from verify_144bit_anchor import ANCHOR_FRAME

MAX_INPUT = 1_048_576
ENDPOINT = "https://unified-operations-cockpit.nathantaboract.workers.dev/tabor-sites/conductor/api/sovereign-engine/receipts"
SOURCES = ("hop-in", "voice-box")
class NoRedirect(request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None


SCHEMA = """
CREATE TABLE IF NOT EXISTS inbox (
    id TEXT PRIMARY KEY, source TEXT NOT NULL, content BLOB NOT NULL,
    input_hash TEXT NOT NULL, available INTEGER NOT NULL, lease TEXT,
    attempts INTEGER NOT NULL DEFAULT 0, verdict TEXT, evidence_hash TEXT,
    delivered INTEGER NOT NULL DEFAULT 0
);
"""


def digest(data):
    return hashlib.sha256(data).hexdigest()


def connect(path):
    path.parent.mkdir(parents=True, exist_ok=True, mode=0o700)
    descriptor = os.open(path, os.O_CREAT | os.O_WRONLY, 0o600)
    os.close(descriptor)
    if path.stat().st_mode & 0o077:
        raise PermissionError("The intake database must be accessible only to its owner.")
    db = sqlite3.connect(path)
    db.row_factory = sqlite3.Row
    db.executescript(SCHEMA)
    return db


def bounded_read(path):
    with path.open("rb") as stream:
        data = stream.read(MAX_INPUT + 1)
    if len(data) > MAX_INPUT:
        raise ValueError("Input exceeds 1 MiB.")
    return data


def enqueue(db, source, data):
    data.decode("utf-8")
    if not data:
        raise ValueError("Input is empty.")
    job_id = digest(source.encode() + b"\0" + data)
    with db:
        db.execute(
            "INSERT OR IGNORE INTO inbox (id, source, content, input_hash, available) VALUES (?,?,?,?,?)",
            (job_id, source, data, digest(data), int(time.time())),
        )
    return {"id": job_id}


def claim(db, now=None):
    now = int(time.time()) if now is None else now
    lease = uuid4().hex
    with db:
        row = db.execute(
            """UPDATE inbox SET lease=?, available=?, attempts=attempts+1
               WHERE id=(SELECT id FROM inbox WHERE verdict IS NULL AND available<=?
                         ORDER BY available, id LIMIT 1)
               RETURNING id, source, content, input_hash, lease, attempts""",
            (lease, now + 900, now),
        ).fetchone()
    return None if row is None else {**dict(row), "content": row["content"].decode("utf-8")}


def stage(db, kind, output):
    # Exclusive creation prevents replacing a different candidate or broadening its permissions.
    with open(output, "x", opener=private_opener, encoding="utf-8") as stream:
        job = claim(db)
        if job is None:
            stream.write("{}\n")
            return {"state": "idle", "path": str(output)}
        packet = {**job, "candidate_kind": kind, "required_checks": {
            "worker": ["Runtime tests", "Wrangler dry-run", "Conductor Lasso release gate"],
            "schema": ["Test migration on a scratch database", "Run replay and rollback checks", "Conductor Lasso release gate"],
            "python": ["Python compile", "Affected unit tests", "Conductor Lasso release gate"],
        }[kind]}
        json.dump(packet, stream, ensure_ascii=False, indent=2)
        stream.write("\n")
    return {"state": "staged", "id": job["id"], "path": str(output)}


def private_opener(path, flags):
    return os.open(path, flags, 0o600)


def finish(db, job_id, lease, verdict, evidence, now=None):
    now = int(time.time()) if now is None else now
    with db:
        result = db.execute(
            """UPDATE inbox SET verdict=?, evidence_hash=?, lease=NULL
               WHERE id=? AND lease=? AND available>? AND verdict IS NULL""",
            (verdict, digest(evidence), job_id, lease, now),
        )
        if result.rowcount != 1:
            raise ValueError("Lease expired or no longer owns this job.")
    return {"id": job_id, "state": "receipt_queued"}


def flush(db, token):
    if not token:
        raise ValueError("Set ENGINE_TOKEN in your environment.")
    rows = db.execute(
        """SELECT id, source, verdict, input_hash AS input_sha256, evidence_hash AS evidence_sha256
           FROM inbox WHERE verdict IS NOT NULL AND delivered=0 ORDER BY rowid LIMIT 20"""
    ).fetchall()
    pairs = []
    for row in rows:
        receipt = {key: row[key] for key in ("source", "verdict", "input_sha256", "evidence_sha256")}
        pairs.append((row["id"], receipt))
    if not pairs:
        return {"acknowledged": 0, "pending_in_batch": 0}
    payload = json.dumps([receipt for _, receipt in pairs], separators=(",", ":")).encode()
    req = request.Request(ENDPOINT, data=ANCHOR_FRAME + payload, headers={
        "Authorization": f"Bearer {token}", "Content-Type": "application/octet-stream",
    })
    with request.build_opener(NoRedirect()).open(req, timeout=15) as response:
        receipts = json.load(response)["receipts"]
    if len(pairs) != len(receipts):
        raise ValueError("Unexpected receipt count from Worker.")
    confirmed = []
    for (job_id, sent), received in zip(pairs, receipts):
        expected = digest(json.dumps(sent, separators=(",", ":")).encode())
        if received.get("seal") != expected:
            raise ValueError("Worker receipt seal did not match submitted metadata.")
        if received.get("state") in ("committed", "already_committed"):
            confirmed.append((job_id,))
    with db:
        db.executemany("UPDATE inbox SET delivered=1 WHERE id=?", confirmed)
    return {"acknowledged": len(confirmed), "pending_in_batch": len(pairs) - len(confirmed)}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--db", type=Path, default=Path.home() / ".nathan-ai" / "sovereign-engine.sqlite")
    commands = parser.add_subparsers(dest="action", required=True)
    add = commands.add_parser("enqueue")
    add.add_argument("source", choices=SOURCES)
    add.add_argument("file", type=Path)
    commands.add_parser("claim")
    plan = commands.add_parser("stage")
    plan.add_argument("kind", choices=("worker", "schema", "python"))
    plan.add_argument("output", type=Path)
    done = commands.add_parser("finish")
    done.add_argument("id")
    done.add_argument("lease")
    done.add_argument("verdict", choices=("verified", "rejected"))
    done.add_argument("evidence", type=Path)
    commands.add_parser("flush")
    args = parser.parse_args()
    try:
        with closing(connect(args.db)) as db:
            if args.action == "enqueue":
                result = enqueue(db, args.source, bounded_read(args.file))
            elif args.action == "claim":
                result = claim(db)
            elif args.action == "stage":
                result = stage(db, args.kind, args.output)
            elif args.action == "finish":
                result = finish(db, args.id, args.lease, args.verdict, bounded_read(args.evidence))
            else:
                result = flush(db, os.environ.get("ENGINE_TOKEN"))
    except (ValueError, OSError, sqlite3.Error, KeyError) as error:
        parser.exit(1, f"{error}\n")
    print(json.dumps(result, ensure_ascii=False))


if __name__ == "__main__":
    main()
