# Universal Database: forward, reversed, negative and rebound topology

## Canonical notation
- Forward core: D0, D1, ..., D9.
- Magnetic field transition: D9 -> 01D.
- Reversed labels: 01D = D10, 02D = D11, ..., 12D = D21. The label is a digit-order transformation, not a change to the ordinal value.
- The negative sequence is independent: -1D, -2D, -3D, ... -nD, unbounded in the mathematical model. Preserve the user's `-1D` spelling and optionally display zero-padded `-01D` as an alias.
- The firmament rebound is a configurable fictional boundary rule, not a known geographical or physical edge. Its location is NOT fixed at -12D.

## Model
Represent a coordinate as `{branch: "forward"|"inverted"|"negative", index: bigint}`. Use `bigint` for indexes and decimal strings in JSON and SQL. Do not allocate one row per possible negative coordinate. The unbounded negative branch is a generative rule, with sparse overrides for visited coordinates, inhabitants, events, and authored lore. `infinity` is not an SQLite integer.

Inverted notation: for n in [10,21], display `String(n-9).padStart(2,"0")+"D"`. Negative notation: for n>=1 display `"-"+n+"D"`.

Topology is a directed graph, not an assumption that one fixed finite cycle can contain infinitely many coordinates. Add boundary policies:
- `NONE`: negative traversal continues without a rebound.
- `AT_INDEX`: when descending reaches a configured negative index N, emit `FIRMAMENT_FLIP` and traverse the specified destination, preserving the boundary in a rule record.
- `PORTAL`: a specific node has an explicit destination, which may be positive, inverted, or another negative node.

An unbounded path cannot be guaranteed to encounter a finite boundary without an explicit rule. A rebound need not be at -12D. The previous 34-ring board is a **bounded game scenario**, not the universal coordinate system.

## SQLite extension for a future migration
```sql
CREATE TABLE IF NOT EXISTS dimension_rule (
  rule_id TEXT PRIMARY KEY,
  branch TEXT NOT NULL CHECK(branch IN ('forward','inverted','negative')),
  policy TEXT NOT NULL CHECK(policy IN ('NONE','AT_INDEX','PORTAL')),
  boundary_index TEXT,
  destination_branch TEXT,
  destination_index TEXT,
  enabled INTEGER NOT NULL DEFAULT 1 CHECK(enabled IN (0,1))
);
INSERT OR IGNORE INTO dimension_rule
  (rule_id,branch,policy,boundary_index,destination_branch,destination_index)
VALUES ('negative-default','negative','NONE',NULL,NULL,NULL);
CREATE TABLE IF NOT EXISTS dimension_override (
  branch TEXT NOT NULL,
  index_decimal TEXT NOT NULL,
  lore_json TEXT NOT NULL DEFAULT '{}',
  PRIMARY KEY(branch,index_decimal)
);
```

The new rule table does not alter the existing 34-ring demo's seeded `dimension` or `dimension_link` records. A future Worker should expose a bounded `GET /api/dimensions?branch=negative&start=1&limit=100` endpoint, validate index strings, enforce maximum page sizes, and resolve rebound rules at runtime. Never attempt to seed infinite records or execute infinite traversal loops.

## Gameplay integration
Use the same coordinate service for Tabor Spiral, the 33 Trial Matrix, and future separate games. Keep each game's rules, UI, database tables, deployment, and app identity separate. The shared topology is an optional dependency, not a forced merger. Add play modes for unbounded descent and explicit boundary-based rebound, with a visible indicator showing whether a boundary is configured.

## Status
This document specifies the extension. It is not a claim that the new tables or endpoint have been deployed to Cloudflare. The previously deployed D0 and D1 roots and the 34-ring R2 demo remain unchanged.
