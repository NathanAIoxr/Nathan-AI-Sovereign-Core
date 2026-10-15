# THE ICARUS'S OF BASEBALL — historical player archive

**Real sourced statistics, real player IDs, separate baseball and softball branches, commercial identities BLOCKED pending clearance.**

This archive is now actually populated (not a mock database): **3,997 distinct historically documented players**, **12,204 batting stints**, **4,443 pitching stints**, **20,787 fielding position stints**, **12,194 appearance rows**, and **515 team-season rows** across 12 defined league codes. Historical data are season-row facts; missing entries are not synthetic. The available source range is **1871–1948**. This is only the subset of the 202 proposed leagues for which the current SABR source provides these records; the other leagues and individual players still need sources.

## File connections

- `people.csv`: 3,997 source biographical records, keyed by `playerID`.
- `batting.csv`, `pitching.csv`, `fielding_part1.csv`, `fielding_part2.csv`, `appearances.csv`: actual sourced season-by-team/stint data; fielding partition is only for file size.
- `teams.csv`: 515 season/team records, keyed by `yearID`, `lgID`, `teamID`.
- `player_directory.csv`: derived stat totals only across imported seasons, not guaranteed full careers. Batting average = hits/at-bats, ERA = earned runs × 27 / outs pitched. Missing underlying values remain blank.
- `women_baseball_profiles.csv`: 13 players, with source-documented AAGPBL career RBI values, not complete rosters or all-season stats.
- `women_softball_profiles.csv`: 2 sourced IWPSA profiles with empty numeric stat fields; **no invented softball performance figures**.
- `league_crosswalk.csv`: only names corresponding to existing Icarus league proposals receive tentative crosswalks; unmapped source leagues stay unmapped.
- `build_sqlite.py`: produces a searchable SQLite database from the files in this folder, with historical sources and generated gameplay values separated. Run `python3 build_sqlite.py` in the directory after cloning the repo. Optional: place `leagues.csv` and `teams_master.csv` from the separate 202-entry game directory alongside this archive to load the entire proposal registry.

## Crucial distinctions

1. The historical 111-year gate applies to **verified franchise founding years**, not to source league operating years. These historic brands and player identities have **NOT** been cleared for commercial play or promotional reuse.
2. There are **202 proposed league entries** in the separate research directory. The 12 SABR source codes in this archive represent only the leagues with verified, available statistics; do **not** claim all 202 league rosters have been retrieved.
3. Negro League data in Lahman were licensed from **Seamheads** and may have additional rights conditions. This archive preserves the original stats and requires attribution and legal review before release.
4. The AAGPBL association statistics have their own source and limitations. Women's baseball is not women's softball; the two are stored separately and will not be assigned men's records.
5. Game-generated attributes must be in a distinct table and marked `GENERATED FILL-IN — NOT VERIFIED HISTORY`; historical source tables are never auto-filled.
6. The project is dedicated to James “Rawhide” Tabor per the creator's family history; no family relationship or Boston Globe phrase has been independently authenticated as part of this statistical import.

## Data attribution / license

**SABR Lahman Baseball Database** © 1996–2025 Society for American Baseball Research (SABR), through Sean Lahman's contribution. See https://sabr.org/lahman-database/ and https://creativecommons.org/licenses/by-sa/3.0/ ; data prepared here from the 2025 release through https://github.com/cbwinslow/lahman-database-csv . SABR Lahman now incorporates licensed Seamheads Negro Leagues data, and permission/licensing constraints need evaluation for commercial use. **No endorsement by SABR, Seamheads, AAGPBL Players Association, or Notre Dame.**

Women's research references: https://www.aagpbl.org/resources/stats and https://archivesspace.library.nd.edu/repositories/3/resources/2433 , https://sites.google.com/site/iwpsoftball/iwspa/the-league---1976 .
