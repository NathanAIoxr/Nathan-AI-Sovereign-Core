# Google Has Fencepost Error Syndrome — by Nathan Tabor
## Nathan AI 🚀 / ONE | Technology-v108 | Boundary Integrity Contract

**Creator attribution:** Nathan Tabor | **Source supplied:** November 13, 2026
**Implementation:** A reproducible, local, standard-library validator and additive
worker-role registry. **No claim of access to Google code, remote systems, private
databases or actual autonomous hardware.** The creator's phrase names the concern;
it is not independent evidence of Google's design or intent.

[108-unit machine-readable registry](registry.tech108.json) ·
[Executable boundary contract and simulation](boundary_contract.py) ·
[Regression tests](test_boundary_contract.py) ·
[Earlier ONE Families 65–75](../families-v75/README.md) ·
[Existing ONE Federation master adapter](../federation.py)

### Every declared unit retained, no renumbering

The creator supplied **12 technological families x 9 named members = 108 role
definitions** from stone tools to quantum/nanotech/bioengineering. Registry fields
preserve the supplied family names, technology roots, missions and individual member
names, without inventing detailed technical capabilities for individual roles.
Technology family IDs **1–12** and technology unit IDs **1–108** form their **own
namespace**. They do not replace the earlier 40/75-family archetype codices,
Family 21 (ONE), or members numbered 65–163. Source preservation is additive.

Every role is marked **indexed_only**. Names describing aircraft, electricity,
genomics, cybersecurity, navigation or autonomous machines are taxonomy entries,
not authorization to operate infrastructure or conduct experiments.

### The exact arithmetic and the glitch class

| Question | Explicit contract | Result |
| --- | --- | ---: |
| Number of integers 65 through 163 | inclusive: last - first + 1 | 99 |
| Final one-based position after 64 existing + 99 new items | 64 + 99 | 163 |
| Positions of the 99 new items | inclusive IDs 65..163 | 99 |
| Seven-day schedule, Sunday 00:00 to next Sunday 00:00 | half-open dates [start,end) | 7 dates |
| All named calendar dates including both Sundays | both endpoints inclusive | 8 dates |
| Dates strictly between those Sundays | both endpoints excluded | 6 dates |
| Total seven-day capacity of 108 unit roles | 108 x 7 | 756 unit-days |

**Rule:** do not silently equate "positions", "items", "calendar dates",
"elapsed time", "physical intervals", or "both endpoints". A named counting
convention is mandatory at each boundary. Inclusive last index of N one-based
items is N; the exclusive stop index is N+1. An expected off-by-one *difference*
is not necessarily a software bug; applying the wrong rule is.

**Time warning:** date counts are not a claim that every civil day has exactly
24 elapsed hours. Timezones, DST transitions, leap days, and timestamp precision
require separate explicit tests.

### Seven-day deterministic simulation

Assume one *synthetic assignment slot* per listed role per calendar day.
No actual worker is executed or dispatched.

| Scheduler | Valid unique unit-days | Omissions | Duplications | Invalid unit-days |
| --- | ---: | ---: | ---: | ---: |
| Wrong: exclude each family's final member | 672 | 84 | 0 | 0 |
| Wrong: include one beyond each family | 756 | 0 | 77 | 7 |
| **Correct: each family's 9 inclusive IDs** | **756** | **0** | **0** | **0** |

The extra endpoint duplicates the next family's first unit for families 1–11
on each simulated day (11 x 7 = 77). The twelfth family generates nonexistent
unit #109 on each day (7 invalid slots). Excluding each family's final member
loses 12 x 7 = 84 valid role-days.

These are deterministic *test scenarios*, not measured incidents at Google or
in Nathan AI's other apps. Do not extrapolate the simulation to breach numbers,
economic savings, bug prevalence or a 100% defect-free system.

### System-wide adoption policy for all Nathan AI projects

This policy is **applicable** to the entire catalog; it is **not yet wired into
every existing module**. Apply it incrementally without changing any creator
source or independently numbered registries:

1. **Preserve** exact original source bytes/text, title, authorship claim, and
   SHA-256 whenever source files are available; store normalized interpretations
   separately. Never silently overwrite original statements.
2. **Declare** the boundary domain, inclusion mode, index origin, unit of
   measure, timezone where relevant, and the expected total in every new data
   contract. Do not interchange one-based creator IDs with zero-based array
   offsets or database row positions.
3. **Check** empty/one/last/last+1 cases, cross-family transitions, calendar
   ends, leap days, DST, negative/zero quantities, and duplicate/missing IDs.
4. **Reject** incomplete or duplicate enumerations before write, billing,
   scheduled execution, export or release. Repair only with tested source-backed
   semantics; otherwise produce a review report and leave originals unchanged.
5. **Audit** programs, websites, games, wearable sensor streams, publishing
   exports, schedules, research indexes, databases, and optional physical-tech
   designs for the boundaries they actually use. No unverifiable blanket pass.
6. **Approve** external actions through the existing ONE / Family 21 human
   authorization and evidence gates. Cataloging a worker grants it no physical
   control, remote access, independent authority or continuous runtime.
7. **Verify** integration with an actual project-specific regression test and
   rollback record before calling that project corrected.

**Compliance terminology:** "100% (108/108)" means the currently indexed
technology-unit roster passed its *specified roster/boundary contract*. It does
**not** mean 100% of every current or historical Nathan AI project is fixed,
or that Google has been repaired or audited.

### Run, simulate and integrate with the existing main database

Python 3.10+; standard library only:

~~~sh
F=app-factory/nathan-ai/personal-intelligence/minds/federation
python3 -m unittest discover -s "$F/technology-v108" -p 'test_boundary_contract.py' -v
python3 "$F/technology-v108/boundary_contract.py" --days 7 --out /tmp/tech108-simulation.json
~~~

For an **explicit, owner-authorized** import to the **existing local/private**
ONE Federation SQLite master (no second master is created):

~~~sh
DB=/owner/private/ONE_Federation_Master.sqlite3
python3 "$F/federation.py" --db "$DB" ingest "$F/technology-v108/registry.tech108.json"
python3 "$F/technology-v108/boundary_contract.py" --verify-db "$DB"
python3 "$F/federation.py" --db "$DB" status
~~~

**Do not put the private master database in GitHub.** The automated repository
workflow runs a disposable *temporary* SQLite copy and checks all 108 ingested
records, not the owner's actual private master.

### Current evidence/status

- **Committed design:** 12 families, all 108 supplied unit names, roots and missions.
- **Implemented gate:** exact indexing, date counting, simulation and failure on
  incomplete, extra, duplicated or unauthorized roster entries.
- **Regression tests:** local + CI commands; CI results must be checked separately.
- **Integration path:** tested against a temporary database in CI, with explicit
  owner-run instructions for the existing local/private master.
- **Not performed here:** edits to every other project, private database changes,
  worldwide fixes, external provider patches, 108 live bots, or unattended 24/7
  execution. Those require actual adapters, permissions, review and evidence.

**PRESERVE → DECLARE → COUNT → VALIDATE → TEST → REVIEW → AUTHORIZE.**
