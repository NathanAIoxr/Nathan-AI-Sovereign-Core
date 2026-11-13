# OPERATION SWARM — ONE Database Hive

By John Nathan Tabor · Nathan AI 🚀 · additive ONE Federation worker subsystem.

## Purpose

Orchestrate a **bounded swarm of real local Python workers** on the existing ONE SQLite master. The hive stores source hashes and immutable submission excerpts, indexes public logical worker identities from the 763 Mind of Minds roles, 56 Families, 630 Dimensional Units, 99 Family 65–75 archetypes, 10 Creator Teams, and 12 actual hive worker functions. It creates typed, evidence-labelled cross-references for the 7-station manuscript and 118 periodic-table elements. Distinct namespaces are preserved.

**Consciousness distinctions:** The existing `consciouness` module provides an owner-controlled *functional self-model*. A self-model bee is a software process, not proof of a living or subjectively conscious mind. All other bees are deterministic or indexed role specifications, not independently launched model instances.

## Worker roles

`queen` coordinates; `forager` safeguards sources; `scribe` indexes the seven stations; `chemist` indexes 118 elements and seven periods; `alchemist` records seven historical planet–metal pairs; `harmonizer` separates musical notes from authored frequencies; `cartographer` links periods, cervical symbols and station metaphors; `librarian` catalogs existing role identities; `examiner` checks science-versus-symbolism classification; `sentinel` checks authority and veto; `consciouness` runs bounded functional-self-model inspection; `auditor` verifies integrity.

The software runs the twelve worker functions **within one bounded, auditable local process**, rather than claiming millions of independent agents have awakened. A simple persisted queue records claim, completion and audit events.

## Protocol: PRESERVE → INDEX → RELATE → DERIVE — NEVER REPLACE

Only `swarm_originals` contains immutable source bytes, protected by SQLite no-update/no-delete triggers. Derived nodes and relations are separately namespaced; every edge is labelled `scientifically_established`, `historically_documented`, `author_defined_symbolism`, or `hypothesis_requires_research`. Public GitHub CI uses an ephemeral database; it never synchronizes a private database or invokes external AI, APIs, devices, payments or unapproved tools.

The submitted station matrix appears in [author excerpt](./SEVEN_STATIONS_AUTHOR_EXCERPT.md). The structured [seven-station data](./stations.v1.json) is a distinct derived transcription, not an overwrite of the excerpt or a claim that assigned frequencies affect glands.

### Launch locally

From the repository root:

```bash
F=app-factory/nathan-ai/personal-intelligence/minds/federation/hive-swarm
python3 "$F/swarm.py" --db /private/ONE_Federation_Master.sqlite3 status
python3 "$F/swarm.py" --db /private/ONE_Federation_Master.sqlite3 --approve-write launch
python3 "$F/swarm.py" --db /private/ONE_Federation_Master.sqlite3 status
python3 "$F/swarm.py" --db /private/ONE_Federation_Master.sqlite3 --approve-write veto
python3 "$F/swarm.py" --db /private/ONE_Federation_Master.sqlite3 --approve-write approve
python3 -m unittest discover -s "$F" -p test_swarm.py -v
```

Use a privately held path for persistent master data. `status` is read-only; `launch`, `approve` and `veto` require explicit `--approve-write`. An owner veto blocks subsequent runs. CI uses disposable output, with full source and worker reports retained as review artifacts.

### Protocol SWARM research boundary

`OPERATION SWARM` is a project-local protocol name. Multiple unrelated external multi-agent projects use SWARM, but none is claimed as an existing dependency of this repository. This implementation intentionally adds no third-party dependency or credential exchange.
