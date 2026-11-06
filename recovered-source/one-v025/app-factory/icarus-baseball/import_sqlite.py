#!/usr/bin/env python3
"""THE ICARUS'S OF BASEBALL — build a sourced, searchable SQLite archive."""
import csv
import json
import sqlite3
import sys
from pathlib import Path

ROOT=Path(__file__).resolve().parent
DATA=ROOT/"data"
OUT=Path(sys.argv[1]) if len(sys.argv)>1 else ROOT/"icarus_players.sqlite"
SCHEMA="""
PRAGMA foreign_keys=ON;
CREATE TABLE source_info(source_id TEXT PRIMARY KEY, citation TEXT NOT NULL, license TEXT, note TEXT);
CREATE TABLE players(player_id TEXT PRIMARY KEY, full_name TEXT NOT NULL,
 birth_year INTEGER, death_year INTEGER, bats TEXT, throws TEXT, sport TEXT NOT NULL,
 historical_status TEXT NOT NULL DEFAULT 'SOURCED', commercial_use_status TEXT NOT NULL DEFAULT 'REVIEW_REQUIRED');
CREATE TABLE team_seasons(year INTEGER NOT NULL,team_id TEXT NOT NULL,league_code TEXT NOT NULL,
 display_name TEXT, wins INTEGER, losses INTEGER,stat_source TEXT NOT NULL,
 PRIMARY KEY(year,team_id,league_code));
CREATE TABLE batting_seasons(id INTEGER PRIMARY KEY,player_id TEXT NOT NULL REFERENCES players(player_id),
 year INTEGER NOT NULL,team_id TEXT,league_code TEXT,stint INTEGER,
 games INTEGER,at_bats INTEGER,runs INTEGER,hits INTEGER,doubles INTEGER,triples INTEGER,home_runs INTEGER,
 runs_batted_in INTEGER,stolen_bases INTEGER,walks INTEGER,strikeouts INTEGER,
 source_id TEXT NOT NULL DEFAULT 'SABR_LAHMAN_2025',raw_record TEXT NOT NULL);
CREATE TABLE pitching_seasons(id INTEGER PRIMARY KEY,player_id TEXT NOT NULL REFERENCES players(player_id),
 year INTEGER NOT NULL,team_id TEXT,league_code TEXT,stint INTEGER,
 wins INTEGER,losses INTEGER,games INTEGER,starts INTEGER,innings_outs INTEGER,
 earned_runs INTEGER,strikeouts INTEGER,source_id TEXT NOT NULL DEFAULT 'SABR_LAHMAN_2025',raw_record TEXT NOT NULL);
CREATE TABLE fielding_seasons(id INTEGER PRIMARY KEY,player_id TEXT NOT NULL REFERENCES players(player_id),
 year INTEGER NOT NULL,team_id TEXT,league_code TEXT,stint INTEGER,position TEXT,games INTEGER,
 putouts INTEGER,assists INTEGER,errors INTEGER,source_id TEXT NOT NULL DEFAULT 'SABR_LAHMAN_2025',raw_record TEXT NOT NULL);
CREATE TABLE appearance_seasons(id INTEGER PRIMARY KEY,player_id TEXT NOT NULL REFERENCES players(player_id),
 year INTEGER NOT NULL,team_id TEXT,league_code TEXT,games_all INTEGER,
 source_id TEXT NOT NULL DEFAULT 'SABR_LAHMAN_2025',raw_record TEXT NOT NULL);
CREATE TABLE women_research(id TEXT PRIMARY KEY,sport TEXT NOT NULL,player_name TEXT NOT NULL,
 league_name TEXT,team_name TEXT,season TEXT,stat_name TEXT,stat_value REAL,
 source_url TEXT NOT NULL, verification TEXT NOT NULL,commercial_use_status TEXT NOT NULL);
CREATE INDEX ix_batting_player_year ON batting_seasons(player_id,year);
CREATE INDEX ix_pitching_player_year ON pitching_seasons(player_id,year);
CREATE INDEX ix_fielding_player_year ON fielding_seasons(player_id,year);
CREATE INDEX ix_appearances_player_year ON appearance_seasons(player_id,year);
CREATE INDEX ix_players_name ON players(full_name);
CREATE VIEW batting_career AS SELECT p.player_id,p.full_name,MIN(b.year) first_year,MAX(b.year) last_year,
 SUM(COALESCE(b.games,0)) games,SUM(COALESCE(b.at_bats,0)) at_bats,
 SUM(COALESCE(b.hits,0)) hits,SUM(COALESCE(b.home_runs,0)) home_runs,
 CASE WHEN SUM(COALESCE(b.at_bats,0))>0 THEN ROUND(1.0*SUM(COALESCE(b.hits,0))/SUM(COALESCE(b.at_bats,0)),3) ELSE NULL END average
 FROM players p JOIN batting_seasons b USING(player_id) GROUP BY p.player_id,p.full_name;
"""
def rows(filename):
    with (DATA/filename).open(encoding="utf-8-sig",newline="") as f:
        yield from csv.DictReader(f)
def n(x):
    try: return int(x) if x not in ("",None) else None
    except ValueError: return None
def raw(r): return json.dumps(r,ensure_ascii=False,separators=(",",":"))
def check_year(r):
    y=n(r.get("yearID"))
    if y is None or not 1871<=y<=1915:
        raise ValueError("Historical 1871–1915 source window violated: "+str(y))
    return y
def load(db):
    db.execute("INSERT INTO source_info VALUES(?,?,?,?)",(
        "SABR_LAHMAN_2025",
        "SABR Lahman Baseball Database, CSV release 1871–2025; subset 1871–1915; https://sabr.org/lahman-database/",
        "CC BY-SA 3.0","Curated subset preserves original sourced values; unknown values remain NULL."))
    for r in rows("People_1871_1915.csv"):
        name=(" ".join(x for x in (r["nameFirst"],r["nameLast"]) if x)).strip() or r["playerID"]
        db.execute("INSERT INTO players(player_id,full_name,birth_year,death_year,bats,throws,sport) VALUES(?,?,?,?,?,?,?)",(
            r["playerID"],name,n(r["birthYear"]),n(r["deathYear"]),r["bats"] or None,r["throws"] or None,"mens_baseball"))
    for r in rows("Teams_1871_1915.csv"):
        db.execute("INSERT OR IGNORE INTO team_seasons VALUES(?,?,?,?,?,?,?)",(
            check_year(r),r["teamID"],r.get("lgID") or "",r.get("name"),n(r.get("W")),n(r.get("L")),"SABR_LAHMAN_2025"))
    for r in rows("Batting_1871_1915.csv"):
        db.execute("""INSERT INTO batting_seasons(player_id,year,team_id,league_code,stint,games,at_bats,
            runs,hits,doubles,triples,home_runs,runs_batted_in,stolen_bases,walks,strikeouts,raw_record)
            VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",(
            r["playerID"],check_year(r),r["teamID"],r.get("lgID"),n(r["stint"]),n(r["G"]),n(r["AB"]),
            n(r["R"]),n(r["H"]),n(r["2B"]),n(r["3B"]),n(r["HR"]),n(r["RBI"]),n(r["SB"]),n(r["BB"]),n(r["SO"]),raw(r)))
    for r in rows("Pitching_1871_1915.csv"):
        db.execute("""INSERT INTO pitching_seasons(player_id,year,team_id,league_code,stint,wins,losses,
            games,starts,innings_outs,earned_runs,strikeouts,raw_record) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)""",(
            r["playerID"],check_year(r),r["teamID"],r.get("lgID"),n(r["stint"]),n(r["W"]),n(r["L"]),
            n(r["G"]),n(r["GS"]),n(r["IPouts"]),n(r["ER"]),n(r["SO"]),raw(r)))
    for r in rows("Fielding_1871_1915.csv"):
        db.execute("""INSERT INTO fielding_seasons(player_id,year,team_id,league_code,stint,position,games,
            putouts,assists,errors,raw_record) VALUES(?,?,?,?,?,?,?,?,?,?,?)""",(
            r["playerID"],check_year(r),r["teamID"],r.get("lgID"),n(r["stint"]),r["POS"],n(r["G"]),
            n(r["PO"]),n(r["A"]),n(r["E"]),raw(r)))
    for r in rows("Appearances_1871_1915.csv"):
        db.execute("""INSERT INTO appearance_seasons(player_id,year,team_id,league_code,games_all,raw_record)
            VALUES(?,?,?,?,?,?)""",(r["playerID"],check_year(r),r["teamID"],r.get("lgID"),n(r["G_all"]),raw(r)))
    for r in rows("women_softball_research.csv"):
        db.execute("INSERT INTO women_research VALUES(?,?,?,?,?,?,?,?,?,?,?)",(
            r["id"],r["sport"],r["player_name"],r["league_name"],r["team_name"] or None,
            r["season"] or None,r["stat_name"] or None,float(r["stat_value"]) if r["stat_value"] else None,
            r["source_url"],r["verification"],r["commercial_use_status"]))
def main():
    OUT.parent.mkdir(parents=True,exist_ok=True)
    if OUT.exists():OUT.unlink()
    db=sqlite3.connect(OUT)
    try:
        db.executescript(SCHEMA)
        with db:load(db)
        audit={table:db.execute(f"SELECT COUNT(*) FROM {table}").fetchone()[0] for table in
            ("players","team_seasons","batting_seasons","pitching_seasons","fielding_seasons","appearance_seasons","women_research")}
        expected={"players":4878,"team_seasons":732,"batting_seasons":17442,
            "pitching_seasons":6168,"fielding_seasons":28240,"appearance_seasons":17407}
        for k,v in expected.items():
            if audit[k]!=v:raise AssertionError(f"{k} expected {v}, got {audit[k]}")
        violations=db.execute("PRAGMA foreign_key_check").fetchall()
        if violations:raise AssertionError(f"FK violations: {violations[:5]}")
        print(json.dumps({"path":str(OUT),"counts":audit,"foreign_keys":"passed"},indent=2))
    finally:db.close()
if __name__=="__main__":main()
