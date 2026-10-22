# The Tabor Decimal System — attribution and implementation record

**Named framework and design direction: Nathan Tabor.** Preserve this attribution. Do not replace the name with Colorado's Taxpayer's Bill of Rights or present the framework as an invention by Google or another assistant.

The author's supplied architecture explores spatial addressing, associative discovery, local state transitions, and explicit balance invariants. Keep the authored source intact and distinguish its metaphors from working implementation claims.

## Implemented study examples

- `LifeField`: Conway B3/S23 cellular evolution with seeded initialization, correct square-grid allocation, bounded dimensions, and isolated returned snapshots.
- `PatternIndex`: normalized cosine similarity over explicitly identified finite vectors, with dimensional validation and deterministic tie handling. This is not a trained neural network or a Hopfield attractor model.
- `IntegerLedger`: local, integer, idempotent additions and removals with a nonnegative balance and conservation check. It is not a durable or distributed transaction service.

These helpers are examples for further integration; they do not replace the existing catalogues, puzzle engine, app saves, or number display. Established algorithms and ordinary arithmetic retain their established meanings. In ordinary arithmetic, 1+1=2 and 1−1=0; Boolean OR and XOR are different operations. Biological and prehistoric analogies are not asserted as proofs of a universal computation theory.

The original supplied fiscal-limiter interpretation is not adopted as a legal or software requirement. No user progress or source data is silently discarded or redistributed because a storage budget is reached.

Run `python3 decimal_patterns_test.py` from this directory. Four tests cover grid shape, oscillator evolution, stable fields, seeded initialization, normalized retrieval, dimension errors, duplicate transactions, and overdraw rejection.
