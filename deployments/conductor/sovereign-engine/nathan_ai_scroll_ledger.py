"""Seal, audit, import and sync Nathan AI artifact and scroll records."""

import argparse
from contextlib import closing
from datetime import datetime, timezone
import hashlib
import json
import os
from pathlib import Path
import re
import sqlite3
import time
import unicodedata
from urllib import request

from organism import NoRedirect
from verify_144bit_anchor import ANCHOR_FRAME

ANCHOR = ANCHOR_FRAME.hex().upper()
GENESIS = "0" * 64
ENDPOINT = "https://unified-operations-cockpit.nathantaboract.workers.dev/tabor-sites/conductor/api/artifact-scroll/ingest"
MIGRATIONS = Path(__file__).with_name("migrations")
MEDIA = ("parchment", "papyrus", "copper", "stone")
LANGUAGES = ("Hebrew", "Aramaic", "Greek", "Paleo-Hebrew")
STATUSES = ("extant_verified", "reconstructed")


def seal(value):
    return hashlib.sha256(json.dumps(value, ensure_ascii=False, sort_keys=True,
                                     separators=(",", ":")).encode("utf-8")).hexdigest()


def text_field(value, maximum):
    if not isinstance(value, str):
        raise ValueError("Expected text field.")
    result = unicodedata.normalize("NFC", value.strip(" \t\r\n"))
    if not result or len(result.encode("utf-8")) > maximum:
        raise ValueError("Invalid text field length.")
    return result


def canonical(item, default_timestamp):
    medium, lang, status = (item[key] for key in ("medium", "script_lang", "epigraphic_status"))
    if medium not in MEDIA or lang not in LANGUAGES or status not in STATUSES:
        raise ValueError("Invalid artifact metadata.")
    stamp = item.get("unix_timestamp")
    if stamp is None:
        stamp = default_timestamp
    if type(stamp) is not int or not (0 <= stamp <= 253402300799):
        raise ValueError("Invalid UTC timestamp.")
    media_hash = item.get("media_asset_sha256")
    if media_hash is not None and (not isinstance(media_hash, str) or not re.fullmatch("[0-9a-f]{64}", media_hash)):
        raise ValueError("Invalid media hash.")
    return {
        "anchor": ANCHOR, "lang": lang, "media_hash": media_hash, "medium": medium,
        "siglum": text_field(item["scroll_siglum"], 96), "site": text_field(item["cave_or_site"], 256),
        "status": status, "text": text_field(item["raw_text"], 8192), "ts_unix": stamp,
    }


def iso(stamp):
    return datetime.fromtimestamp(stamp, timezone.utc).isoformat().replace("+00:00", "Z")


def open_ledger(path):
    fd = os.open(path, os.O_CREAT | os.O_WRONLY, 0o600)
    os.close(fd)
    db = sqlite3.connect(path)
    db.row_factory = sqlite3.Row
    try:
        fields = {row["name"] for row in db.execute("PRAGMA table_info(artifact_scroll_ledger)")}
        if fields and "fingerprint_sha256" not in fields:
            raise ValueError("Original ledger detected. Use import-sqlite into a new ledger and retain the original database.")
        for migration in sorted(MIGRATIONS.glob("000[23]*.sql")):
            db.executescript(migration.read_text(encoding="utf-8"))
    except Exception:
        db.close()
        raise
    return db


def append_batch(db, items):
    now = int(time.time())
    records = [(canonical(item, now)) for item in items]
    inserted = 0
    with db:
        db.execute("BEGIN IMMEDIATE")
        row = db.execute("SELECT payload_sha256 FROM artifact_scroll_ledger ORDER BY id DESC LIMIT 1").fetchone()
        head = row[0] if row else GENESIS
        for record in records:
            fingerprint = seal(record)
            if db.execute("SELECT 1 FROM artifact_scroll_ledger WHERE fingerprint_sha256=?", (fingerprint,)).fetchone():
                continue
            payload = seal({**record, "prev_hash": head})
            db.execute(
                """INSERT INTO artifact_scroll_ledger
                (anchor_hex, scroll_siglum, cave_or_site, medium, script_lang, epigraphic_status,
                unix_timestamp, iso_timestamp, content_nfc, payload_sha256, prev_chain_sha256,
                media_asset_sha256, fingerprint_sha256) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)""",
                (ANCHOR, record["siglum"], record["site"], record["medium"], record["lang"], record["status"],
                 record["ts_unix"], iso(record["ts_unix"]), record["text"], payload, head,
                 record["media_hash"], fingerprint),
            )
            head = payload
            inserted += 1
    return {"inserted": inserted, "head_sha256": head}


def to_input(row):
    return {**{key: row[key] for key in ("scroll_siglum", "cave_or_site", "medium", "script_lang",
                                       "epigraphic_status", "unix_timestamp", "media_asset_sha256")},
            "raw_text": row["content_nfc"]}


def verify_entire_chain(db):
    head = GENESIS
    count = 0
    for row in db.execute("SELECT * FROM artifact_scroll_ledger ORDER BY id"):
        item = canonical(to_input(row), None)
        expected = seal({**item, "prev_hash": head})
        if (row["anchor_hex"] != ANCHOR or row["prev_chain_sha256"] != head
                or row["payload_sha256"] != expected or row["fingerprint_sha256"] != seal(item)
                or row["iso_timestamp"] != iso(item["ts_unix"]) or row["content_nfc"] != item["text"]):
            raise ValueError(f"1-1=0_PURGE: invalid record {row['id']}")
        head = expected
        count += 1
    return {"status": "1+1=2_VERIFIED", "count": count, "head_sha256": head}


def encode_batch(records):
    return json.dumps({"records": records}, ensure_ascii=False, separators=(",", ":")).encode()


def push_batch_to_worker(records, token):
    payload = encode_batch(records)
    req = request.Request(ENDPOINT, data=payload, headers={
        "Content-Type": "application/json", "X-Sovereign-Anchor": ANCHOR, "Authorization": f"Bearer {token}",
    })
    with request.build_opener(NoRedirect()).open(req, timeout=20) as response:
        result = json.load(response)
    fingerprints = [seal(canonical(row, None)) for row in records]
    if result.get("status") != "1+1=2_COMMITTED" or result.get("anchor") != ANCHOR or [
        row.get("fingerprint_sha256") for row in result.get("records", [])
    ] != fingerprints:
        raise ValueError("Cloud acknowledgement did not match the submitted fingerprints.")
    return result


def sync(db, token):
    if not token:
        raise ValueError("Set SCROLL_LEDGER_TOKEN in the environment.")
    with db:
        db.execute("BEGIN")
        verify_entire_chain(db)
        cursor = db.execute("SELECT * FROM artifact_scroll_ledger ORDER BY id")
        batch = []
        for row in cursor:
            item = to_input(row)
            if len(batch) == 20 or len(encode_batch([*batch, item])) > 196608:
                yield push_batch_to_worker(batch, token)
                batch = []
            batch.append(item)
        if batch:
            yield push_batch_to_worker(batch, token)


def parse_markdown(path):
    content = path.read_text(encoding="utf-8")
    parts = content.split("\n---\n", 1)
    if len(parts) != 2 or not parts[0].startswith("---\n"):
        raise ValueError("Markdown must start with a JSON object between --- lines.")
    return [{**json.loads(parts[0][4:]), "raw_text": parts[1]}]


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--db", type=Path, default=Path("nathan_ai_sovereign_ledger.sqlite"))
    actions = parser.add_subparsers(dest="action", required=True)
    for name in ("import-json", "import-markdown", "import-sqlite"):
        actions.add_parser(name).add_argument("file", type=Path)
    actions.add_parser("verify")
    actions.add_parser("sync")
    args = parser.parse_args()
    try:
        with closing(open_ledger(args.db)) as db:
            if args.action == "verify":
                print(json.dumps(verify_entire_chain(db)))
            elif args.action == "sync":
                for result in sync(db, os.environ.get("SCROLL_LEDGER_TOKEN")):
                    print(json.dumps(result))
            else:
                if args.action == "import-json":
                    data = json.loads(args.file.read_text(encoding="utf-8"))
                    items = data if isinstance(data, list) else data["records"]
                elif args.action == "import-markdown":
                    items = parse_markdown(args.file)
                else:
                    with closing(sqlite3.connect(args.file.resolve().as_uri() + "?mode=ro", uri=True)) as prior:
                        prior.row_factory = sqlite3.Row
                        items = [to_input(row) for row in prior.execute("SELECT * FROM artifact_scroll_ledger ORDER BY id")]
                print(json.dumps(append_batch(db, items)))
    except (OSError, KeyError, ValueError, TypeError, sqlite3.Error) as error:
        parser.exit(1, f"{error}\n")


if __name__ == "__main__":
    main()
