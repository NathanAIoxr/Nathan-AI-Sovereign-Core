#!/usr/bin/env python3
"""Export a checked SQLite database as a D1 SQL snapshot."""

import argparse
import hashlib
import json
import sqlite3
from pathlib import Path


def identifier(name):
    return '"' + name.replace('"', '""') + '"'


def literal(value):
    if isinstance(value, str):
        if "\x00" in value:
            return "CAST(X'" + value.encode("utf-8").hex() + "' AS TEXT)"
        return "'" + value.replace("'", "''") + "'"
    if isinstance(value, bytes):
        return "X'" + value.hex() + "'"
    if value is None:
        return "NULL"
    if isinstance(value, (int, float)):
        return repr(value)
    raise TypeError(type(value))


def export_snapshot(source, output):
    with sqlite3.connect(source.resolve().as_uri() + "?mode=ro", uri=True) as db:
        if db.execute("PRAGMA integrity_check").fetchone() != ("ok",):
            raise ValueError(f"Integrity check failed on {source}")
        if db.execute("PRAGMA foreign_key_check").fetchone():
            raise ValueError(f"Foreign key violations in {source}")
        kinds = {name: kind for schema, name, kind, *_ in db.execute("PRAGMA table_list") if schema == "main"}
        schema = db.execute("SELECT type,name,sql FROM sqlite_schema WHERE sql IS NOT NULL ORDER BY rowid").fetchall()
        tables = [(name, sql) for kind, name, sql in schema
                  if kind == "table" and kinds.get(name) in ("table", "virtual")
                  and not name.startswith(("sqlite_", "_cf_"))]
        deferred = [sql for kind, name, sql in schema if kind in ("view", "index", "trigger")
                    and not name.startswith(("sqlite_", "_cf_"))]
        counts = {}
        with output.open("w", encoding="utf-8", newline="\n") as out:
            for _, sql in tables:
                out.write(sql.rstrip(";") + ";\n")
            for name, _ in tables:
                table = identifier(name)
                columns = [identifier(row[1]) for row in db.execute(f"PRAGMA table_xinfo({table})") if row[6] == 0]
                visible = ",".join(columns)
                rows = db.execute(f"SELECT {visible} FROM {table}")
                counts[name] = 0
                for row in rows:
                    sql = f"INSERT INTO {table} ({visible}) VALUES (" + ",".join(map(literal, row)) + ");\n"
                    if len(sql.encode("utf-8")) > 100_000:
                        raise ValueError(f"D1 statement limit exceeded for {name}")
                    out.write(sql)
                    counts[name] += 1
            for sql in deferred:
                out.write(sql.rstrip(";") + ";\n")

    with sqlite3.connect(":memory:") as check:
        check.execute("PRAGMA foreign_keys=ON")
        check.executescript(output.read_text(encoding="utf-8"))
        verified = {name: check.execute(f"SELECT count(*) FROM {identifier(name)}").fetchone()[0] for name in counts}
        if verified != counts or check.execute("PRAGMA foreign_key_check").fetchone():
            raise ValueError("Export did not reproduce source table counts and foreign keys")
    payload = output.read_bytes()
    return {"file": output.name, "bytes": len(payload), "md5": hashlib.md5(payload, usedforsecurity=False).hexdigest(),
            "sha256": hashlib.sha256(payload).hexdigest(), "tables": counts}


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("source", type=Path)
    parser.add_argument("output", type=Path)
    args = parser.parse_args()
    if args.source.resolve() == args.output.resolve():
        parser.error("source and output must differ")
    print(json.dumps(export_snapshot(args.source, args.output), sort_keys=True))
