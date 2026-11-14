#!/usr/bin/env python3
"""Every physical ZERO/ONE bit in an owner-private, consistent SQLite snapshot.

Nathan Tabor · ONE Federation v074. These are deterministic virtual workers,
NOT individual AI processes. Never publish or mutate a private source snapshot.
"""
from __future__ import annotations

import argparse
from contextlib import closing
import hashlib
import json
import os
from pathlib import Path
import sqlite3
import stat

from zero_one_workers import AUTHOR, VERSION, candidate, digest, open_one, timestamp

SNAPSHOT_SCHEMA = """
CREATE TABLE IF NOT EXISTS zero_one_snapshots (
  sha256 TEXT PRIMARY KEY,
  local_path TEXT NOT NULL,
  bytes INTEGER NOT NULL CHECK(bytes >= 0),
  bits INTEGER NOT NULL CHECK(bits >= 0),
  created_at TEXT NOT NULL
);
"""


def prepare(con: sqlite3.Connection) -> None:
    con.executescript(SNAPSHOT_SCHEMA)
    con.commit()


def sha_file(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def capture(con: sqlite3.Connection, output: str | Path) -> dict:
    """Copy live ONE via SQLite backup into a new, owner-only immutable snapshot."""
    prepare(con)
    out = Path(output).expanduser().absolute()
    parent = out.parent
    if not parent.is_dir() or parent.is_symlink():
        raise ValueError("Existing non-symlink private snapshot directory required")
    if stat.S_IMODE(parent.stat().st_mode) & 0o077:
        raise ValueError("Snapshot parent directory must have owner-only permissions")
    if out.exists() or out.is_symlink():
        raise ValueError("Refusing to replace any existing file")
    fd = os.open(str(out), os.O_RDWR | os.O_CREAT | os.O_EXCL, 0o600)
    os.close(fd)
    try:
        # A consistent SQLite backup, NOT a raw copy of a potentially changing file.
        with closing(sqlite3.connect(str(out))) as dest:
            con.backup(dest)
            if dest.execute("PRAGMA quick_check").fetchone()[0] != "ok":
                raise ValueError("Private snapshot failed SQLite quick_check")
            dest.commit()
        os.chmod(out, 0o600)
        size = out.stat().st_size
        content_sha = sha_file(out)
        with con:
            con.execute(
                "INSERT OR IGNORE INTO zero_one_snapshots VALUES(?,?,?,?,?)",
                (content_sha, str(out), size, size * 8, timestamp()),
            )
        return {"snapshot_sha256": content_sha, "bytes": size, "zero_one_workers": size * 8,
                "per_bit_processes_started": 0, "source": "consistent SQLite backup",
                "snapshot_is_live_sync": False, "owner_private_copy": True}
    except Exception:
        out.unlink(missing_ok=True)
        raise


def find_snapshot(con: sqlite3.Connection, snapshot_sha256: str):
    prepare(con)
    row = con.execute(
        "SELECT local_path,bytes,bits FROM zero_one_snapshots WHERE sha256=?",
        (snapshot_sha256,),
    ).fetchone()
    if not row:
        raise ValueError("Unknown SQLite snapshot digest")
    path = Path(row[0])
    if path.is_symlink() or not path.is_file():
        raise ValueError("Snapshot is missing or is a disallowed symlink")
    if path.stat().st_size != row[1] or row[2] != 8 * row[1]:
        raise ValueError("Snapshot size changed; capture a new revision")
    return path, row[1], row[2]


def read_snapshot_worker(con: sqlite3.Connection, snapshot_sha256: str, bit_index: int) -> dict:
    """On-demand worker for ANY bit of snapshot, including SQLite pages and BLOBs."""
    if type(bit_index) is not int or bit_index < 0:
        raise ValueError("bit_index must be a nonnegative integer")
    path, size, bits = find_snapshot(con, snapshot_sha256)
    if bit_index >= bits:
        raise ValueError("bit_index outside private snapshot")
    # Verify the entire original SHA before trusting the addressed bit.
    if sha_file(path) != snapshot_sha256:
        raise ValueError("Private snapshot content hash changed")
    with path.open("rb") as stream:
        stream.seek(bit_index // 8)
        byte = stream.read(1)
    if len(byte) != 1:
        raise ValueError("Private snapshot read failed")
    value = (byte[0] >> (7 - bit_index % 8)) & 1
    worker_id = "NT01-FILE-" + digest(
        (VERSION + "|" + snapshot_sha256 + "|" + str(bit_index)).encode("ascii")
    )[:32]
    return {"id": worker_id, "by": AUTHOR, "bit": value,
            "role": "ZERO / guard-and-hold" if value == 0 else "ONE / propose-and-build",
            "snapshot_sha256": snapshot_sha256, "bit_index": bit_index,
            "covered": "entire immutable SQLite snapshot",
            "rights": "equal read-only observation; bit value NEVER confers consent",
            "live_model_process": False}


def audit_snapshot(con: sqlite3.Connection, snapshot_sha256: str) -> dict:
    """Count ALL bits in the snapshot, with SHA checked during the same scan."""
    path, size, bits = find_snapshot(con, snapshot_sha256)
    hasher = hashlib.sha256()
    ones = 0
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            hasher.update(chunk)
            ones += sum(b.bit_count() for b in chunk)
    if hasher.hexdigest() != snapshot_sha256:
        raise ValueError("Private snapshot content hash changed")
    return {"snapshot_sha256": snapshot_sha256, "zero_workers": bits - ones,
            "one_workers": ones, "total_workers": bits, "bytes_verified": size,
            "source_edits": 0, "external_execution": False}


def snapshot_status(con: sqlite3.Connection) -> dict:
    prepare(con)
    n, bits = con.execute(
        "SELECT COUNT(*),COALESCE(SUM(bits),0) FROM zero_one_snapshots"
    ).fetchone()
    return {"registered_snapshots": n, "snapshot_virtual_bits_total": bits,
            "warning": "Snapshots may contain overlapping source bytes; do not sum with record-bit coverage",
            "runtime": "on-demand logical workers; no live process per bit"}


def main() -> None:
    ap = argparse.ArgumentParser(description="Nathan Tabor / ZERO-ONE physical SQLite snapshot workers")
    ap.add_argument("--db", required=True, help="Existing owner-private ONE master")
    sub = ap.add_subparsers(dest="cmd", required=True)
    c = sub.add_parser("capture")
    c.add_argument("--output", required=True, help="New snapshot in owner-only (0700) directory")
    sub.add_parser("status")
    for name in ("inspect", "audit"):
        sp = sub.add_parser(name)
        sp.add_argument("--snapshot-sha256", required=True)
        if name == "inspect":
            sp.add_argument("--bit-index", type=int, required=True)
    args = ap.parse_args()
    with closing(open_one(args.db)) as con:
        if args.cmd == "capture":
            output = capture(con, args.output)
        elif args.cmd == "status":
            output = snapshot_status(con)
        elif args.cmd == "audit":
            output = audit_snapshot(con, args.snapshot_sha256)
        else:
            w = read_snapshot_worker(con, args.snapshot_sha256, args.bit_index)
            output = {**w, "policy": candidate(con, w)["decision"]}
    print(json.dumps(output, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
