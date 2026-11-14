#!/usr/bin/env python3
"""NATHAN AI / ONE v074: 0-and-1 virtual worker sovereignty gate.

Authorial framework: Nathan Tabor. Every bit of each exact federated source
record is an on-demand, addressable logical worker; no per-bit process is
spawned, no original record is edited, and no external action is executed.

Run only against an owner-controlled, PRIVATE ONE_Federation_Master.sqlite3.
"""
from __future__ import annotations

import argparse
import base64
from contextlib import closing
from datetime import datetime, timezone
import hashlib
import hmac
import json
import os
from pathlib import Path
import secrets
import sqlite3
import time

VERSION = "nathan.one.v074.zero-one-bit-workers.v1"
AUTHOR = "Nathan Tabor"
ACTIONS_REQUIRING_GRANT = frozenset(("database_write", "external_call", "export"))
SIGNING_KEY_ENV = "NATHAN_ONE_OWNER_SIGNING_KEY"
SCHEMA = """
CREATE TABLE IF NOT EXISTS zero_one_control(
  id INTEGER PRIMARY KEY CHECK(id=1),
  author TEXT NOT NULL,
  paused INTEGER NOT NULL DEFAULT 0 CHECK(paused IN(0,1))
);
CREATE TABLE IF NOT EXISTS zero_one_grant_uses(
  nonce TEXT PRIMARY KEY,
  worker_id TEXT NOT NULL,
  action TEXT NOT NULL,
  used_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS zero_one_audit(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  at TEXT NOT NULL,
  event TEXT NOT NULL,
  worker_id TEXT,
  action TEXT,
  result TEXT NOT NULL
);
"""


def digest(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def timestamp() -> str:
    return datetime.now(timezone.utc).isoformat()


def open_one(path: str | Path) -> sqlite3.Connection:
    """Never create or overwrite the owner's master as a side effect."""
    path = Path(path).expanduser()
    if path.is_symlink() or not path.is_file():
        raise ValueError("Existing private master SQLite file required; symlinks denied")
    con = sqlite3.connect(str(path))
    try:
        row = con.execute(
            "SELECT 1 FROM sqlite_master WHERE type='table' AND name='federation_records'"
        ).fetchone()
        if not row:
            raise ValueError("Not an existing ONE Federation master database")
        con.executescript(SCHEMA)
        con.execute(
            "INSERT OR IGNORE INTO zero_one_control(id,author,paused) VALUES(1,?,0)",
            (AUTHOR,),
        )
        con.commit()
        return con
    except Exception:
        con.close()
        raise


def control(con: sqlite3.Connection) -> dict:
    author, paused = con.execute(
        "SELECT author,paused FROM zero_one_control WHERE id=1"
    ).fetchone()
    return {"author": author, "paused": bool(paused)}


def coverage(con: sqlite3.Connection) -> dict:
    """Every UTF-8 source-text bit is addressable WITHOUT allocating worker rows."""
    count, byte_count = con.execute(
        "SELECT COUNT(*), COALESCE(SUM(LENGTH(CAST(exact_source_text AS BLOB))),0) "
        "FROM federation_records"
    ).fetchone()
    return {
        "schema": VERSION,
        "author": AUTHOR,
        "records": count,
        "covered_source_bytes": byte_count,
        "logical_zero_one_workers": byte_count * 8,
        "materialized_per_bit_processes": 0,
        "scope": "exact UTF-8 bytes of federation_records; not SQLite pages or unimported tables",
        "owner_controls": control(con),
        "external_execution": "not implemented; no outbound adapters",
    }


def audit_counts(con: sqlite3.Connection) -> dict:
    """Optional complete checksum + 0/1 cardinality audit, source text unchanged."""
    zeros = ones = records = 0
    for original, expected in con.execute(
        "SELECT exact_source_text,content_sha256 FROM federation_records"
    ):
        raw = original.encode("utf-8")
        if digest(raw) != expected:
            raise ValueError("Federation original SHA-256 mismatch")
        bit_ones = sum(byte.bit_count() for byte in raw)
        ones += bit_ones
        zeros += len(raw) * 8 - bit_ones
        records += 1
    return {
        "records_sha256_verified": records,
        "zero_workers": zeros,
        "one_workers": ones,
        "total_workers": zeros + ones,
        "source_mutations": 0,
    }


def worker(con: sqlite3.Connection, source: str, record: str, sha256: str, bit_index: int) -> dict:
    """One deterministic logical worker for one original bit, MSB first."""
    if isinstance(bit_index, bool) or not isinstance(bit_index, int) or bit_index < 0:
        raise ValueError("bit_index must be a nonnegative integer")
    if len(sha256) != 64 or any(c not in "0123456789abcdef" for c in sha256):
        raise ValueError("A complete lowercase original content SHA-256 is required")
    row = con.execute(
        "SELECT exact_source_text,tier FROM federation_records "
        "WHERE source_id=? AND record_id=? AND content_sha256=?",
        (source, record, sha256),
    ).fetchone()
    if not row:
        raise ValueError("Source record and exact revision not found")
    raw = row[0].encode("utf-8")
    if digest(raw) != sha256:
        raise ValueError("Original content changed without matching SHA-256")
    if bit_index >= len(raw) * 8:
        raise ValueError("bit_index outside original record bytes")
    value = (raw[bit_index // 8] >> (7 - bit_index % 8)) & 1
    identity = digest(
        json.dumps([VERSION, source, record, sha256, bit_index], ensure_ascii=False,
                   separators=(",", ":")).encode("utf-8")
    )
    return {
        "id": "NT01-" + identity[:32],
        "by": AUTHOR,
        "bit": value,
        "role": "ZERO / guard-and-hold" if value == 0 else "ONE / propose-and-build",
        "source_id": source,
        "record_id": record,
        "content_sha256": sha256,
        "bit_index": bit_index,
        "evidence_tier": row[1],
        "rights": "equal read-only observation; data value NEVER implies permission",
        "live_model_process": False,
    }


def candidate(con: sqlite3.Connection, w: dict, action: str = "propose") -> dict:
    """0 and 1 propose or hold, but neither authorizes external side effects."""
    if action not in ("inspect", "propose", *sorted(ACTIONS_REQUIRING_GRANT)):
        raise ValueError("Unknown action")
    if action == "inspect":
        result = "READ_ONLY_ALLOWED"
    elif control(con)["paused"]:
        result = "DENIED_OWNER_PAUSE"
    elif action in ACTIONS_REQUIRING_GRANT:
        result = "DENIED_OWNER_GRANT_REQUIRED"
    else:
        result = "PROPOSAL_ONLY_NO_EXECUTION"
    return {"worker_id": w["id"], "action": action, "decision": result,
            "executed": False, "owner_veto_precedence": True}


def _key() -> bytes:
    secret = os.environ.get(SIGNING_KEY_ENV, "")
    if len(secret.encode("utf-8")) < 32:
        raise ValueError("Owner signing key must be set locally as 32+ bytes; never commit it")
    return secret.encode("utf-8")


def _encoded(body: dict) -> bytes:
    return json.dumps(body, ensure_ascii=False, sort_keys=True,
                      separators=(",", ":")).encode("utf-8")


def issue_owner_grant(w: dict, action: str, seconds: int = 300) -> str:
    """Owner-only local grant, tied to ONE bit, ONE action, short expiry."""
    if action not in ACTIONS_REQUIRING_GRANT:
        raise ValueError("No grant required or invalid action")
    if not isinstance(seconds, int) or not 1 <= seconds <= 3600:
        raise ValueError("Grant lifetime must be 1..3600 seconds")
    body = {"schema": VERSION, "worker_id": w["id"], "action": action,
            "owner": AUTHOR, "expires": int(time.time()) + seconds,
            "nonce": secrets.token_hex(16)}
    payload = base64.urlsafe_b64encode(_encoded(body)).decode("ascii").rstrip("=")
    signature = hmac.new(_key(), payload.encode("ascii"), hashlib.sha256).hexdigest()
    return payload + "." + signature


def authorize_handoff(con: sqlite3.Connection, w: dict, action: str, token: str) -> dict:
    """Verify owner grant once; NEVER perform or delegate external side effects."""
    if action not in ACTIONS_REQUIRING_GRANT:
        raise ValueError("Only separately permissioned actions may use grants")
    if control(con)["paused"]:
        return {"decision": "DENIED_OWNER_PAUSE", "executed": False}
    try:
        payload, signature = token.split(".")
        if len(payload) > 2048 or len(signature) != 64:
            raise ValueError("grant length invalid")
        expected = hmac.new(_key(), payload.encode("ascii"), hashlib.sha256).hexdigest()
        if not hmac.compare_digest(signature, expected):
            raise ValueError("signature does not match")
        body = json.loads(base64.urlsafe_b64decode(
            payload + "=" * (-len(payload) % 4)
        ).decode("utf-8"))
        if (body.get("schema") != VERSION or body.get("owner") != AUTHOR
            or body.get("worker_id") != w["id"] or body.get("action") != action
            or type(body.get("expires")) is not int
            or not int(time.time()) < body["expires"] <= int(time.time()) + 3600
            or not isinstance(body.get("nonce"), str) or len(body["nonce"]) != 32
            or any(c not in "0123456789abcdef" for c in body["nonce"])):
            raise ValueError("scope, expiry, or nonce mismatch")
    except (ValueError, TypeError, AttributeError, UnicodeError, json.JSONDecodeError) as exc:
        raise ValueError("Invalid or expired owner grant") from exc
    try:
        with con:
            con.execute(
                "INSERT INTO zero_one_grant_uses(nonce,worker_id,action,used_at) "
                "VALUES(?,?,?,?)",
                (body["nonce"], w["id"], action, timestamp()),
            )
            con.execute(
                "INSERT INTO zero_one_audit(at,event,worker_id,action,result) "
                "VALUES(?,?,?,?,?)",
                (timestamp(), "owner_grant_checked", w["id"], action,
                 "AUTHORIZED_HANDOFF_ONLY_NO_EXECUTION"),
            )
    except sqlite3.IntegrityError as exc:
        raise ValueError("Owner grant replay rejected") from exc
    return {"decision": "AUTHORIZED_HANDOFF_ONLY_NO_EXECUTION",
            "worker_id": w["id"], "action": action, "executed": False}


def set_paused(con: sqlite3.Connection, paused: bool) -> dict:
    """Operator must control private DB access; local OS permissions are trust root."""
    with con:
        con.execute("UPDATE zero_one_control SET paused=? WHERE id=1",
                    (int(paused),))
        con.execute("INSERT INTO zero_one_audit(at,event,result) VALUES(?,?,?)",
                    (timestamp(), "owner_pause" if paused else "owner_resume", "APPLIED"))
    return control(con)


def main() -> None:
    ap = argparse.ArgumentParser(description="Nathan Tabor / ONE per-bit virtual workers")
    ap.add_argument("--db", required=True, help="Existing OWNER-PRIVATE ONE master SQLite")
    sub = ap.add_subparsers(dest="cmd", required=True)
    sub.add_parser("init")
    sub.add_parser("status")
    sub.add_parser("audit-bits")
    sub.add_parser("pause")
    sub.add_parser("resume")
    for command in ("inspect", "propose", "grant", "authorize"):
        sp = sub.add_parser(command)
        sp.add_argument("--source", required=True)
        sp.add_argument("--record", required=True)
        sp.add_argument("--sha256", required=True)
        sp.add_argument("--bit-index", type=int, required=True)
        if command in ("grant", "authorize"):
            sp.add_argument("--action", choices=sorted(ACTIONS_REQUIRING_GRANT), required=True)
        if command == "grant":
            sp.add_argument("--seconds", type=int, default=300)
        if command == "authorize":
            sp.add_argument("--token", required=True)
    args = ap.parse_args()
    with closing(open_one(args.db)) as con:
        if args.cmd in ("init", "status"):
            result = coverage(con)
        elif args.cmd == "audit-bits":
            result = {**coverage(con), **audit_counts(con)}
        elif args.cmd in ("pause", "resume"):
            result = set_paused(con, args.cmd == "pause")
        else:
            w = worker(con, args.source, args.record, args.sha256, args.bit_index)
            if args.cmd == "inspect":
                result = w
            elif args.cmd == "propose":
                result = candidate(con, w, "propose")
            elif args.cmd == "grant":
                result = {"grant": issue_owner_grant(w, args.action, args.seconds),
                          "warning": "Private single-use token; do not publish"}
            else:
                result = authorize_handoff(con, w, args.action, args.token)
    print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
