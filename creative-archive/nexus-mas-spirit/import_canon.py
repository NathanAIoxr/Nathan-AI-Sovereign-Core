#!/usr/bin/env python3
"""Idempotent canonical graph import; python3 import_canon.py <database.sqlite> [canon.json]"""
import json
import pathlib
import sqlite3
import sys
db = pathlib.Path(sys.argv[1] if len(sys.argv)>1 else "nexus_canon.sqlite")
source = pathlib.Path(sys.argv[2] if len(sys.argv)>2 else pathlib.Path(__file__).with_name("canon.json"))
canon = json.loads(source.read_text(encoding="utf-8"))
conn = sqlite3.connect(str(db))
try:
    conn.executescript(pathlib.Path(__file__).with_name("schema.sql").read_text(encoding="utf-8"))
    with conn:
        for node in canon["nodes"]:
            conn.execute("""INSERT INTO nexus_nodes(id,name,type,description,authority,version) VALUES(?,?,?,?,?,?)
            ON CONFLICT(id) DO UPDATE SET name=excluded.name,type=excluded.type,description=excluded.description,
            authority=excluded.authority,version=excluded.version""",
            (node["id"],node["name"],node["type"],node["description"],node["authority"],node.get("version",canon["version"])))
        for edge in canon["edges"]:
            conn.execute("INSERT OR IGNORE INTO nexus_edges(source_node,target_node,relation) VALUES(?,?,?)",
                         (edge["from"],edge["to"],edge["relation"]))
        conn.execute("INSERT OR IGNORE INTO nexus_sources(source_id,title,kind,created_at) VALUES(?,?,?,?)",
                     ("nexus-original-20261113","Nexus/MAS SPIRIT source transcript","user_upload","2026-11-13"))
        for q in canon.get("verification_queue",[]):
            conn.execute("INSERT OR IGNORE INTO nexus_verification(question,status) VALUES(?,?)",(q,"unverified"))
        conn.execute("""CREATE TABLE IF NOT EXISTS humanoid_levels
              (level INTEGER PRIMARY KEY, authored_text TEXT NOT NULL, author TEXT NOT NULL, date TEXT NOT NULL)""")
        for item in canon["humanoid"]["verbatim"]:
            conn.execute("""INSERT INTO humanoid_levels(level,authored_text,author,date) VALUES(?,?,?,?)
                ON CONFLICT(level) DO UPDATE SET authored_text=excluded.authored_text,author=excluded.author,date=excluded.date""",
                (item["level"],item["text"],"Nathan Tabor","2026-11-14"))
    print(f"Imported {len(canon['nodes'])} nodes, {len(canon['edges'])} edges, 10 levels into {db}")
    print("integrity_check:",conn.execute("PRAGMA integrity_check").fetchone()[0])
finally:
    conn.close()
