# THE ICARUS’S OF BASEBALL — Sourced Historical Player Database

**Branch:** `icarus-players-2026-10-15` — historical player archive, not a commercially cleared identity library.

This project contains **4,878 uniquely identified historical male baseball players (1871–1915)**, with **17,442 batting-season**, **6,168 pitching-season**, **28,240 fielding-season**, **17,407 player appearance-season**, and **732 historical team-season** records, all sourced from SABR's Lahman 2025 release.

This is a **source coverage window**, not a claim that all 202 proposed historical leagues or all people who ever played baseball are represented. In particular, SABR Lahman does not serve as a comprehensive roster for the Caribbean, historic independent leagues, women's baseball or softball.

## Build SQLite locally

With Python 3 and this directory downloaded:

```bash
python3 import_sqlite.py
```

Creates `icarus_players.sqlite` with normalized indexed tables for players, team seasons, batting, pitching, fielding and appearances. Preserves *every original imported CSV field* in `raw_record`. It also includes a small, individually sourced staging set for historical women's baseball and softball: these are explicitly **NOT complete rosters**.

The generated `players_index.json` is a browse-ready search index, not an independent statistical source. Missing original cells remain NULL in SQLite; historical missing data are never synthesized.

## Provenance and license

* Original: SABR Lahman Baseball Database, © 1996–2025 SABR, derived from work donated by Sean Lahman: https://sabr.org/lahman-database/
* Download mirror used: https://github.com/cbwinslow/lahman-database-csv
* Extracted unmodified CSV rows within the 1871–1915 year range. People rows are filtered to these seasons.
* **Dataset licensed under CC BY-SA 3.0**: https://creativecommons.org/licenses/by-sa/3.0/
* Attribution applies to both source-data subset and transformed search index. Reusers of adapted licensed database material must comply with Attribution–ShareAlike terms.
* Women's baseball research links point to https://aagpbl.org/ and softball staging references to https://sites.google.com/site/iwpsoftball; only individual factual assertions are curated. The associated archives and photographs have not been copied.

## Commercial and gameplay boundary

**Historical records ≠ automatic player/brand/likeness rights clearance.** All historical identities are marked `rights_review_required`; they're staged for research and factual lookup, not automatically for commercial playable impersonation, team logos, or likeness rendering. The separate Legacy 111 rule for historical franchise admission requires a **verified founding year of 1915 or earlier**, plus rights review; *the date a player competed is NOT that franchise founding date*.

Women's baseball and women's softball live in separate sports with independently sourced stats. The 1943–1954 and 1976–1979 circuits do not pass the Legacy 111 gate merely because they are historical. Do not relabel them as pre-1916.

Unknown facts: **UNKNOWN — RESEARCH REQUIRED**.
Fictional content: **GENERATED FILL-IN — NOT VERIFIED HISTORY**.

## SQL examples

```sql
SELECT full_name,year,team_id,at_bats,hits,home_runs FROM players
JOIN batting_seasons USING(player_id) WHERE year=1871 ORDER BY hits DESC LIMIT 20;
SELECT * FROM batting_career WHERE at_bats>1000 ORDER BY hits DESC LIMIT 25;
SELECT player_name,sport,stat_name,stat_value,source_url FROM "women's_research";
```

`index.html` is the player explorer. `data/players_index.json` can be used by offline and web game clients after importing locally.
