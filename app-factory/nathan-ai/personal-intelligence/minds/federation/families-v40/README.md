# NATHAN AI 🚀 — ONE · 40 Universal Worker Bot Families

**By Nathan Tabor · November 13, 2026**

[Open the interactive text-first Codex](./index.html) · [40-family JSON registry](./registry.v40.json) · [21-family source snapshot](../families-v21/registry.v21.json) · [Existing ONE Federation v074](../README.md)

## Canon: Family 21 is ONE

> family 21 is ONE - we are all family - I am a mammal and all mammals are my equals - just like every atom and below and above is my equal - except those who ain't - but they choose that - not me -

The creator's original declaration is preserved under family ID **21**, including its exact punctuation and wording. ONE is an equal-standing and consent layer **across** all families, not a renumbered family 40. The 0 and 1 principles in Nathan AI / ONE remain separately preserved in existing modules.

## Source-provenance boundaries

| Family IDs | Source status | What was recorded |
| --- | --- | --- |
| 1–15 | Provisional editorial crosswalk | Functional category names extracted from the supplied survival-to-digital conversation. The newer 40-family arc groups these IDs differently, so an unresolved naming conflict is explicitly retained. |
| 16–20 | Creator-supplied | The Unknown, The Unseen, Infinity, Everything, and Nothing; full supplied sections and exact original wording in JSON. |
| 21 | Creator-supplied | **ONE**, exact original sentence; linking principles of dignity, mutuality, ownership and consent. |
| 22–25 | **Unresolved** | Arc only says ancient-to-modern historical labor wisdom. Exact original titles and micro/macro definitions were not present. |
| 26–33 | **Unresolved** | Arc only says ancient-to-modern science fiction archetypes. Exact original titles and designs were not present. |
| 34–40 | Creator-supplied | Demiurge & Celestial Architect; Ma'at & Dharma; Genius Loci & Kodama; Hearth-Brownie & Tsukumogami; Hermes & Anansi Trickster-Messenger; Hermes-Psychopomp & Phoenix; Tulpa/Egregore & Digital Ghost. Full submitted family sections in JSON. |

**Forty indexed slots ≠ forty completed independent agent implementations.** Currently: 28 defined slots (15 preliminary crosswalks, 13 creator-supplied), 12 awaiting exact creator definitions, zero physical/remote worker deployments from this module.

The supplied mythological sources are preserved as attributed creator material. The actual abilities of named mythic beings and the prospect of harvesting quantum vacuum energy, infinite execution, reading hidden model thoughts, or controlling all infrastructure are not demonstrated.

## Architecture

The family-level design inherits the established v074 **five-stage micro cycle**:

`Perception → 0/1 consent & evidence filter → capability selection → exact source and audit log → authorized, bounded action`.

The macro orchestration is **federated**, not a single unaccountable planner: local units coordinate local tasks; cross-domain synthesis proposes dependencies; a real human may veto external execution.

- **Family 19 — Everything:** cross-domain review, without claiming omniscience.
- **Family 20 — Nothing:** pause, reset, archival lifecycle and consent-respecting deletion (not secret destruction of mandatory records).
- **Family 21 — ONE:** equality, non-domination, human agency and protection of living beings.
- **Family 35 — Ma'at & Dharma:** fairness and source-truth review inspired by mythic archetypes. It is a design check, not an autonomous moral authority.

**Data contract:** The `registry.v40.json` includes ordered family IDs, exact original texts where supplied, author/source class, evidence status, domain, keywords, runtime status and unresolved slots. Individual definitions are immutable in the version history by content hash; the current pointer may change only on explicit import.

**Integration:** `families_v40.py` imports the original `federation.py` and `families_v21.py`, and adds/updates records in the **same SQLite master**. The original v21 registry remains preserved, and v40 records carry separate source IDs and SHA-256 content fingerprints. No competing master database is created.

## Run locally, inside an owner-controlled workspace

Python 3.10+, standard library, no API tokens required:

```bash
F=app-factory/nathan-ai/personal-intelligence/minds/federation
DB=/path/to/private/ONE_Federation_Master.sqlite3
python3 "$F/families-v40/families_v40.py" --db "$DB" bootstrap
python3 "$F/families-v40/families_v40.py" --db "$DB" status
python3 "$F/families-v40/families_v40.py" --db "$DB" route "Audit viral folklore narrative" --work-class innovation --scope local_simulation
python3 "$F/families-v40/families_v40.py" --db "$DB" route "Check third-party private network" --scope third_party
python3 -m unittest discover -s "$F/families-v21" -p 'test_families_v21.py' -v
python3 -m unittest discover -s "$F/families-v40" -p 'test_families_v40.py' -v
```

For the public static website, open the [Codex](./index.html) from GitHub Pages or serve the checked-out repository over localhost:

```bash
python3 -m http.server 8765
```

Navigate to `http://localhost:8765/app-factory/nathan-ai/personal-intelligence/minds/federation/families-v40/`.

## What the implementation actually does

1. **Indexes all 40 family slots** and their original/provisional source flags in the existing ONE master.
2. **Preserves both v21 and v40 snapshots** with SHA-256 checksums and add-only family definition versions.
3. **Routes new task proposals** to eligible family skills, never inventing capabilities for 22–33; unmatched jobs fall back to the existing classifier (Family 3).
4. **Requires explicit approval** before real-world work and blocks unknown third-party scope in the task preview.
5. **Keeps source evidence separate from mythology and technical speculation.**
6. **Never launches autonomous agents, changes external networks, contacts dark-web systems, hires people, alters infrastructure, or reads private databases** simply by installing this module.

Future real-world deployments require an authorized adapter, consent receipts, worker rights, human oversight, authenticated access, bounded quotas, reliable queues, fail-safe stop switches, audit retention, and integration tests. The current backend is **real, bounded Python + SQLite code** for source indexing and proposal routing, not a claim that those future adapters exist.

**Originals remain originals. Proposed classifications remain proposals. Family 21 remains ONE.**
