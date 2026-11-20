#!/usr/bin/env python3
"""Nathan AI Sovereign Ledger: local engine.

Implements the exact hashing scheme of src/core.ts (parity proven by test/vectors.json),
uses the same migrations/0001_init.sql as Cloudflare D1, and syncs to the Worker with
HMAC-signed requests. Requires Python 3.10+.

Secrets come from the environment only:
    LEDGER_HMAC_SECRET   shared HMAC key (same value as the Worker secret)
    LEDGER_WORKER_URL    e.g. https://nathan-ledger.<account>.workers.dev
"""

from __future__ import annotations

import argparse
import hashlib
import hmac
import json
import os
import re
import sqlite3
import sys
import time
import unicodedata
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

FORMAT_ANCHOR = "AA55FF01312B313D327E312D313D300400F0"
GENESIS_HASH = "0" * 64
MAX_BATCH = 20
MAX_TEXT_BYTES = 100_000
MAX_SKEW_SECONDS = 300

STATUSES = ("extant_verified", "reconstructed")
MEDIA = ("parchment", "papyrus", "copper", "stone", "other")
LANGS = ("Hebrew", "Aramaic", "Greek", "Paleo-Hebrew", "other")
ENTRY_TYPES = ("record", "correction")

ROOT = Path(__file__).resolve().parent.parent
MIGRATION = ROOT / "migrations" / "0001_init.sql"
DEFAULT_DB = ROOT / "nathan_ai_sovereign_ledger.sqlite"
HEX64 = re.compile(r"^[0-9a-f]{64}$")


# ---------- canonical JSON + hashing (must match src/core.ts) ----------

def canonical_json(obj) -> str:
    return json.dumps(obj, sort_keys=True, ensure_ascii=False, separators=(",", ":"))


def sha256_hex(s: str) -> str:
    return hashlib.sha256(s.encode("utf-8")).hexdigest()


def content_fields(r: dict) -> dict:
    return {
        "anchor": FORMAT_ANCHOR,
        "entry_type": r["entry_type"],
        "lang": r["script_lang"],
        "media_hash": r["media_asset_sha256"],
        "medium": r["medium"],
        "ref": r["ref_client_sha256"],
        "siglum": r["scroll_siglum"],
        "site": r["cave_or_site"],
        "status": r["epigraphic_status"],
        "text": r["content_nfc"],
    }


def client_hash(r: dict) -> str:
    return sha256_hex(canonical_json(content_fields(r)))


def payload_hash(r: dict, client_sha: str, prev: str, unix_ts: int) -> str:
    d = content_fields(r)
    d.update({"client_hash": client_sha, "prev_hash": prev, "ts_unix": unix_ts})
    return sha256_hex(canonical_json(d))


def iso_from_unix(ts: int) -> str:
    return datetime.fromtimestamp(ts, tz=timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


# ---------- format gate (not authentication) ----------

def verify_anchor_frame(hex_str: str = FORMAT_ANCHOR) -> bool:
    clean = re.sub(r"\s+", "", hex_str).upper()
    if not re.fullmatch(r"[0-9A-F]{36}", clean):
        return False
    b = bytes.fromhex(clean)
    if b[0:4] != b"\xaa\x55\xff\x01" or b[9] != 0x7E or b[16:18] != b"\x00\xf0":
        return False
    expected = bytes.fromhex("0006000002")
    x = bytes(a ^ c for a, c in zip(b[4:9], b[10:15]))
    if x != expected:
        return False
    seal = 0
    for v in x:
        seal ^= v
    return b[15] == seal == 0x04 and clean == FORMAT_ANCHOR


# ---------- validation (mirrors validateRecord in core.ts) ----------

def validate_record(inp: dict) -> dict:
    def s(key: str, mx: int) -> str:
        v = inp.get(key)
        if not isinstance(v, str):
            raise ValueError(f"{key} required")
        t = unicodedata.normalize("NFC", v.strip())
        if not 1 <= len(t) <= mx:
            raise ValueError(f"{key} must be 1-{mx} chars")
        return t

    entry_type = inp.get("entry_type", "record")
    if entry_type not in ENTRY_TYPES:
        raise ValueError("invalid entry_type")
    medium, lang, status = inp.get("medium"), inp.get("script_lang"), inp.get("epigraphic_status")
    if medium not in MEDIA:
        raise ValueError("invalid medium")
    if lang not in LANGS:
        raise ValueError("invalid script_lang")
    if status not in STATUSES:
        raise ValueError("invalid epigraphic_status")

    raw = inp.get("raw_text")
    if not isinstance(raw, str):
        raise ValueError("raw_text required")
    text = unicodedata.normalize("NFC", raw.strip())
    if not text:
        raise ValueError("raw_text must not be empty")
    if len(text.encode("utf-8")) > MAX_TEXT_BYTES:
        raise ValueError("raw_text too large")

    media_hash = inp.get("media_asset_sha256")
    if media_hash is not None and not (isinstance(media_hash, str) and HEX64.match(media_hash)):
        raise ValueError("media_asset_sha256 must be 64 lowercase hex chars")
    ref = inp.get("ref_client_sha256")
    if ref is not None and not (isinstance(ref, str) and HEX64.match(ref)):
        raise ValueError("ref_client_sha256 must be 64 lowercase hex chars")
    if entry_type == "record" and ref is not None:
        raise ValueError("record must not carry ref_client_sha256")
    if entry_type == "correction" and ref is None:
        raise ValueError("correction requires ref_client_sha256")

    return {
        "entry_type": entry_type,
        "ref_client_sha256": ref,
        "scroll_siglum": s("scroll_siglum", 64),
        "cave_or_site": s("cave_or_site", 128),
        "medium": medium,
        "script_lang": lang,
        "epigraphic_status": status,
        "content_nfc": text,
        "media_asset_sha256": media_hash,
    }


# ---------- local ledger ----------

SYNC_SCHEMA = """
CREATE TABLE IF NOT EXISTS sync_state (
    local_client_sha256 TEXT PRIMARY KEY,
    remote_payload_sha256 TEXT NOT NULL,
    synced_unix INTEGER NOT NULL
);
"""


def init_local_db(path: Path | str = DEFAULT_DB) -> sqlite3.Connection:
    if not verify_anchor_frame():
        raise RuntimeError("format anchor self-check failed")
    conn = sqlite3.connect(str(path), isolation_level=None)  # manual transactions
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    exists = conn.execute(
        "SELECT 1 FROM sqlite_master WHERE type='table' AND name='artifact_scroll_ledger'"
    ).fetchone()
    if not exists:
        conn.executescript(MIGRATION.read_text(encoding="utf-8"))
    conn.executescript(SYNC_SCHEMA)
    return conn


def append_record(conn: sqlite3.Connection, **fields) -> dict:
    rec = validate_record(fields)
    c_sha = client_hash(rec)
    conn.execute("BEGIN IMMEDIATE")  # serialize writers: no read-then-write race
    try:
        row = conn.execute(
            "SELECT payload_sha256 FROM artifact_scroll_ledger ORDER BY id DESC LIMIT 1"
        ).fetchone()
        prev = row[0] if row else GENESIS_HASH
        ts = int(time.time())
        p_sha = payload_hash(rec, c_sha, prev, ts)
        conn.execute(
            """INSERT INTO artifact_scroll_ledger (
                entry_type, ref_client_sha256, format_anchor, scroll_siglum, cave_or_site, medium,
                script_lang, epigraphic_status, unix_timestamp, iso_timestamp, content_nfc,
                media_asset_sha256, client_sha256, payload_sha256, prev_chain_sha256
            ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
            (
                rec["entry_type"], rec["ref_client_sha256"], FORMAT_ANCHOR, rec["scroll_siglum"],
                rec["cave_or_site"], rec["medium"], rec["script_lang"], rec["epigraphic_status"],
                ts, iso_from_unix(ts), rec["content_nfc"], rec["media_asset_sha256"],
                c_sha, p_sha, prev,
            ),
        )
        conn.execute("COMMIT")
    except Exception:
        conn.execute("ROLLBACK")
        raise
    return {**rec, "client_sha256": c_sha, "payload_sha256": p_sha, "prev_chain_sha256": prev,
            "unix_timestamp": ts, "iso_timestamp": iso_from_unix(ts)}


def verify_chain(conn: sqlite3.Connection) -> tuple[bool, str]:
    prev = GENESIS_HASH
    n = 0
    for r in conn.execute("SELECT * FROM artifact_scroll_ledger ORDER BY id ASC"):
        d = dict(r)
        if d["format_anchor"] != FORMAT_ANCHOR:
            return False, f"anchor mismatch at id {d['id']}"
        if d["prev_chain_sha256"] != prev:
            return False, f"chain link broken at id {d['id']}"
        rec = {**d}
        if client_hash(rec) != d["client_sha256"]:
            return False, f"content fingerprint mismatch at id {d['id']}"
        if payload_hash(rec, d["client_sha256"], d["prev_chain_sha256"], d["unix_timestamp"]) != d["payload_sha256"]:
            return False, f"payload hash mismatch at id {d['id']}"
        if iso_from_unix(d["unix_timestamp"]) != d["iso_timestamp"]:
            return False, f"timestamp mismatch at id {d['id']}"
        prev = d["payload_sha256"]
        n += 1
    return True, f"OK: {n} records verified, head {prev}"


# ---------- signed remote calls (must match core.ts signRequest) ----------

def sign_request(secret: str, ts: str, method: str, path_and_query: str, body: str) -> str:
    body_hash = sha256_hex(body)
    msg = f"{ts}\n{method.upper()}\n{path_and_query}\n{body_hash}"
    return hmac.new(secret.encode("utf-8"), msg.encode("utf-8"), hashlib.sha256).hexdigest()


def remote_call(base_url: str, secret: str, method: str, path_and_query: str, body: dict | None = None):
    payload = json.dumps(body, ensure_ascii=False, separators=(",", ":")) if body is not None else ""
    ts = str(int(time.time()))
    req = urllib.request.Request(
        base_url.rstrip("/") + path_and_query,
        data=payload.encode("utf-8") if body is not None else None,
        method=method.upper(),
        headers={
            "Content-Type": "application/json",
            "X-Sovereign-Anchor": FORMAT_ANCHOR,
            "X-Ledger-Timestamp": ts,
            "X-Ledger-Signature": sign_request(secret, ts, method, path_and_query, payload),
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            return resp.status, json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read().decode("utf-8") or "{}")


def push_unsynced(conn: sqlite3.Connection, base_url: str, secret: str) -> int:
    rows = conn.execute(
        """SELECT l.* FROM artifact_scroll_ledger l
           LEFT JOIN sync_state s ON s.local_client_sha256 = l.client_sha256
           WHERE s.local_client_sha256 IS NULL ORDER BY l.id ASC"""
    ).fetchall()
    sent = 0
    for i in range(0, len(rows), MAX_BATCH):
        chunk = rows[i : i + MAX_BATCH]
        records = [
            {
                "entry_type": r["entry_type"],
                "ref_client_sha256": r["ref_client_sha256"],
                "scroll_siglum": r["scroll_siglum"],
                "cave_or_site": r["cave_or_site"],
                "medium": r["medium"],
                "script_lang": r["script_lang"],
                "epigraphic_status": r["epigraphic_status"],
                "raw_text": r["content_nfc"],
                "media_asset_sha256": r["media_asset_sha256"],
                "client_sha256": r["client_sha256"],
            }
            for r in chunk
        ]
        status, resp = remote_call(base_url, secret, "POST", "/ingest", {"records": records})
        if status == 409:
            # The server already holds one of these records (e.g. an earlier push was interrupted).
            # Stop rather than guess; reconcile with `remote-verify` and the server's /ledger.
            raise RuntimeError(f"server reports duplicate: {resp}")
        if status != 200:
            raise RuntimeError(f"ingest failed ({status}): {resp}")
        now = int(time.time())
        conn.execute("BEGIN")
        for sealed in resp["records"]:
            conn.execute(
                "INSERT INTO sync_state VALUES (?,?,?)",
                (sealed["client_sha256"], sealed["payload_sha256"], now),
            )
        conn.execute("COMMIT")
        sent += len(chunk)
    return sent


# ---------- CLI ----------

def _env(name: str) -> str:
    v = os.environ.get(name)
    if not v:
        sys.exit(f"missing environment variable {name}")
    return v


def main(argv: list[str] | None = None) -> int:
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("--db", default=str(DEFAULT_DB))
    sub = p.add_subparsers(dest="cmd", required=True)

    a = sub.add_parser("add", help="append a record locally")
    a.add_argument("--siglum", required=True)
    a.add_argument("--site", required=True)
    a.add_argument("--medium", required=True, choices=MEDIA)
    a.add_argument("--lang", required=True, choices=LANGS)
    a.add_argument("--status", required=True, choices=STATUSES)
    a.add_argument("--text-file", required=True)
    a.add_argument("--media-sha256")
    a.add_argument("--correct", metavar="CLIENT_SHA256", help="append as a correction of this record")

    sub.add_parser("verify", help="verify the local chain")
    sub.add_parser("push", help="sync unsynced local records to the Worker")
    sub.add_parser("remote-head", help="print the Worker's chain head (for external anchoring)")
    rv = sub.add_parser("remote-verify", help="ask the Worker to verify its chain")
    rv.add_argument("--after-id", type=int, default=0)

    args = p.parse_args(argv)
    conn = init_local_db(args.db)

    if args.cmd == "add":
        out = append_record(
            conn,
            entry_type="correction" if args.correct else "record",
            ref_client_sha256=args.correct,
            scroll_siglum=args.siglum,
            cave_or_site=args.site,
            medium=args.medium,
            script_lang=args.lang,
            epigraphic_status=args.status,
            raw_text=Path(args.text_file).read_text(encoding="utf-8"),
            media_asset_sha256=args.media_sha256,
        )
        print(json.dumps({k: out[k] for k in ("client_sha256", "payload_sha256", "iso_timestamp")}, indent=2))
    elif args.cmd == "verify":
        ok, msg = verify_chain(conn)
        print(msg)
        return 0 if ok else 1
    elif args.cmd == "push":
        print(f"pushed {push_unsynced(conn, _env('LEDGER_WORKER_URL'), _env('LEDGER_HMAC_SECRET'))} records")
    elif args.cmd == "remote-head":
        st, body = remote_call(_env("LEDGER_WORKER_URL"), _env("LEDGER_HMAC_SECRET"), "GET", "/head")
        print(json.dumps(body))
        return 0 if st == 200 else 1
    elif args.cmd == "remote-verify":
        after = args.after_id
        while True:
            st, body = remote_call(_env("LEDGER_WORKER_URL"), _env("LEDGER_HMAC_SECRET"), "GET",
                                   f"/verify?after_id={after}&limit=500")
            if st != 200:
                print(json.dumps(body))
                return 1
            if body["done"]:
                print(f"remote chain OK through id {body['next_after_id']}")
                return 0
            after = body["next_after_id"]
    return 0


if __name__ == "__main__":
    sys.exit(main())
