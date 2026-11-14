#!/usr/bin/env python3
"""Generate local SQLite for THE MODERN DAY BIBLE BY NATHAN TABOR; source-preserving."""
import sqlite3,json,pathlib
root=pathlib.Path(__file__).resolve().parent
repo=root.parents[2]
records=json.loads((root/"stories_102_201.json").read_text(encoding="utf-8"))["records"]
kinpath=repo/"data/tabor/biblical_kinship_52_entities_2026-11-14.json"
kin=json.loads(kinpath.read_text(encoding="utf-8"))["records"] if kinpath.exists() else []
dest=root/"The_Modern_Day_Bible_RECOVERED.sqlite"
if dest.exists(): dest.unlink()
db=sqlite3.connect(dest)
db.executescript("""
CREATE TABLE stories(
entry_id TEXT PRIMARY KEY,
source_sequence INTEGER NOT NULL UNIQUE,
title_as_supplied TEXT NOT NULL,
bible_reference_as_supplied TEXT NOT NULL,
description_as_supplied TEXT NOT NULL,
verbatim_entry_line TEXT NOT NULL,
source_section_as_supplied TEXT NOT NULL,
source_text_status TEXT NOT NULL);
CREATE TABLE kinship_index(
id TEXT PRIMARY KEY,
source_sequence INTEGER,
title_as_supplied TEXT,
bible_reference_as_supplied TEXT,
section_as_supplied TEXT,
validation TEXT);
CREATE TABLE recovery_info(key TEXT PRIMARY KEY,value TEXT NOT NULL);
""")
db.executemany("INSERT INTO stories VALUES(?,?,?,?,?,?,?,?)",[(v["entry_id"],v["number"],v["title_as_supplied"],v["bible_reference_as_supplied"],v["description_as_supplied"],v["original_line"],v["source_section_as_supplied"],v["source_text_status"]) for v in records])
db.executemany("INSERT INTO kinship_index VALUES(?,?,?,?,?,?)",[(v.get("id"),v.get("source_sequence"),v.get("title_as_supplied"),v.get("bible_reference_as_supplied"),v.get("section_as_supplied"),v.get("validation")) for v in kin])
db.executemany("INSERT INTO recovery_info VALUES(?,?)",[("title","THE MODERN DAY BIBLE BY NATHAN TABOR"),("story_count",str(len(records))),("kinship_index_count",str(len(kin))),("missing_202","yes"),("verified_all_404","no")])
db.commit()
assert db.execute("PRAGMA integrity_check").fetchone()[0]=="ok"
print(f"CREATED {dest} : {len(records)} numbered stories; {len(kin)} separate kinship index rows")
db.close()
