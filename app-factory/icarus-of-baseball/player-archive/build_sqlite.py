#!/usr/bin/env python3
"""Build a source-faithful, offline SQLite historical baseball archive."""
import csv
import os
import sqlite3
from pathlib import Path

HERE = Path(__file__).resolve().parent
OUT = HERE / "icarus_players.sqlite3"
DATASETS = ["people", "batting", "pitching", "fielding_part1", "fielding_part2", "appearances", "teams", "player_directory", "women_baseball_profiles", "women_softball_profiles", "league_crosswalk"]
TABLES = {"fielding_part1":"fielding","fielding_part2":"fielding"}
INT_COLUMNS = {"yearID","stint","G","AB","R","H","2B","3B","HR","RBI","SB","CS","BB","SO","IBB","HBP","SH","SF","GIDP","W","L","GS","CG","SHO","SV","IPouts","ER","WP","BK","BFP","GF","PO","A","E","DP","PB","birthYear","birthMonth","birthDay","deathYear","deathMonth","deathDay","height","weight","Rank","Rk","Ghome","attendance","stat_value","birth_year","death_year","first_archived_season","last_archived_season","batting_games","pitching_games","putouts","assists","errors"}
REAL_COLUMNS={"ERA","BAOpp","FP","AVG","batting_average","calculated_ERA"}

def quoted(x):
    return '"' + x.replace('"','""') + '"'

def create_data_table(conn,name,path):
    with path.open(encoding="utf-8-sig",newline="") as f:
        rd=csv.DictReader(f)
        columns=rd.fieldnames
        if not columns: return 0
        cols=",".join(quoted(c)+" "+("REAL" if c in REAL_COLUMNS else "INTEGER" if c in INT_COLUMNS else "TEXT") for c in columns)
        conn.execute("CREATE TABLE IF NOT EXISTS "+quoted(name)+" ("+cols+")")
        placeholders=",".join(["?"]*len(columns))
        sql="INSERT INTO "+quoted(name)+" ("+",".join(map(quoted,columns))+") VALUES ("+placeholders+")"
        batch=[];count=0
        for row in rd:
            batch.append(tuple(None if row.get(c,"")=="" else row[c] for c in columns))
            if len(batch)>=1000:
                conn.executemany(sql,batch);count+=len(batch);batch=[]
        if batch: conn.executemany(sql,batch);count+=len(batch)
        return count

def main():
    db=sqlite3.connect(OUT)
    db.execute("PRAGMA journal_mode=WAL")
    db.execute("PRAGMA foreign_keys=ON")
    db.execute("CREATE TABLE IF NOT EXISTS source_manifest (source TEXT PRIMARY KEY,license TEXT,release_status TEXT)")
    db.execute("INSERT OR REPLACE INTO source_manifest VALUES(?,?,?)",("SABR Lahman 2025 / Seamheads component","CC BY-SA 3.0 plus upstream restrictions","RESEARCH_ONLY_RIGHTS_REVIEW"))
    db.execute("CREATE TABLE IF NOT EXISTS game_attributes (player_id TEXT PRIMARY KEY,ability_json TEXT NOT NULL,status TEXT NOT NULL CHECK(status='GENERATED FILL-IN — NOT VERIFIED HISTORY'))")
    db.execute("CREATE TABLE IF NOT EXISTS release_review (identity_type TEXT,identity_id TEXT,rights_status TEXT NOT NULL DEFAULT 'BLOCKED_PENDING_REVIEW',PRIMARY KEY(identity_type,identity_id))")
    for dataset in DATASETS:
        path=HERE/(dataset+".csv")
        if not path.exists():
            print("MISSING",path.name);continue
        name=TABLES.get(dataset,dataset)
        count=create_data_table(db,name,path)
        print("IMPORTED",name,count)
    for col,table in [("playerID","people"),("playerID","batting"),("playerID","pitching"),("playerID","fielding"),("playerID","appearances"),("player_id","player_directory"),("yearID","batting"),("yearID","pitching"),("yearID","teams"),("source_league_code","league_crosswalk")]:
        row=db.execute("SELECT 1 FROM sqlite_master WHERE type='table' AND name=?",(table,)).fetchone()
        if row:db.execute("CREATE INDEX IF NOT EXISTS "+quoted("idx_"+table+"_"+col)+" ON "+quoted(table)+" ("+quoted(col)+")")
    db.execute("CREATE VIEW IF NOT EXISTS searchable_historical_players AS SELECT player_id,display_name,first_archived_season,last_archived_season,batting_average,calculated_ERA,record_status FROM player_directory")
    db.commit()
    for tbl in ["player_directory","batting","pitching","fielding","women_baseball_profiles","women_softball_profiles"]:
        try: print("COUNT",tbl,db.execute("SELECT COUNT(*) FROM "+quoted(tbl)).fetchone()[0])
        except sqlite3.OperationalError: pass
    db.execute("PRAGMA wal_checkpoint(TRUNCATE)")
    db.close();print("WROTE",OUT)
if __name__=="__main__":main()
