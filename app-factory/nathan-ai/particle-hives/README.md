# Nathan AI — Proton / Neutron / Electron Particle Hives

**User-directed design, November 2026.** Each registered *logical particle address* has **exactly one hive**, and each hive has **50,000 uniquely addressed worker slots**. These slots are allocated across the existing 100 epistemic roles (`#1233`–`#1332`): **500 replicas × 100 roles = 50,000**. A given particle type does **not** share its hive identity with another particle type. Each registered particle receives its own hive.

## Materialized demonstration

Run from this directory using Python 3.10+ (no third-party packages):

```bash
python -m unittest -v test_hives.py
python hives.py --database particle_hives_demo.sqlite seed --materialize
python hives.py --database particle_hives_demo.sqlite status
python hives.py --database particle_hives_demo.sqlite worker DEUTERIUM-DEMO-001/proton/000001 0
python hives.py --database particle_hives_demo.sqlite review DEUTERIUM-DEMO-001/proton/000001 review_example.json
python hives.py --database particle_hives_demo.sqlite work DEUTERIUM-DEMO-001/proton/000001 0 review_example.json
python hives.py --database particle_hives_demo.sqlite families DEUTERIUM-DEMO-001/proton/000001 review_example.json
python hives.py capacity 232000000000000000000000000000000000000000000000000000000000000000000000000000000
```

The demonstration registers a *symbolic deuterium atom* (1 proton, 1 neutron, 1 electron) and **persists 150,000 individually addressable worker records in SQLite**, three hives, 100 role IDs per hive, 500 copies per role. Inspect `particle_hives_demo.sqlite` with a SQLite viewer. The `--materialize` flag is intentionally explicit; omitted, a particle gets a persistent 50k-slot hive manifest without consuming 50k worker rows. The design creates as many additional registered particle hives as resources permit, never conflating virtual capacity with active autonomous AI inference.

Run an additional custom atom with an explicitly given task/purpose:

```bash
python hives.py register CUSTOM-ATOM-001 --protons 2 --neutrons 2 --electrons 2 --purpose "Evidence classification and human-approved verification" --materialize
```

## Purpose and work

Three particle *analogies* serve distinct organizational purposes:

- **Proton hive** — identity, provenance and stable addressing.
- **Neutron hive** — integrity checks, anomaly review and operational safeguards.
- **Electron hive** — communication, handoffs and result routing.

Every worker slot has a real stable database identity, family, role ID, and replica number. The `work` action runs a deterministic handler for any individually addressed materialized worker; `families` runs one actual handler per each of the ten epistemic families. The `review` action performs actual deterministic validation checks and persists results and SHA-256 *integrity hashes*. It is **not** 50,000 running independent LLM models, a cryptographic signature, or a verified scientific representation of one real particle. Future AI model backends can be connected behind constrained, explicitly authorized execution adapters; none are enabled here.

## Arithmetic

- One particle: `1 × 50,000 = 50,000` logical worker slots.
- One example deuterium atom: `(1 + 1 + 1) × 50,000 = 150,000` slots.
- For any arbitrary nonnegative integer count `N`, symbolic capacity is `N × 50,000` **exactly**, using Python integers. For scientific estimates supplied by a user, label them as assumptions, not physically measured inventories.

The universe-wide numbers in earlier conversation are only hypothetical capacity extrapolations. No implementation can allocate or run `10^85` actual processes, and the number of particles in the *entire* universe is not established. Protons and neutrons are composite, and physical quark/gluon dynamics are much more complex than three independent permanent simple workers.

## Evidence and safety

- **CERO:** preserve exact creator-supplied instructions and wording.
- **UNO:** actual verified code outputs, computations, tests, and cited scientific facts.
- **DOS:** analogies between physical particles and distributed software, speculative extrapolations, untested theories.

The validator only partially operationalizes the earlier 13-root-error model. It reports which checks ran and never claims to have automatically certified all 13. Log records are append-only at the API layer; deployed databases additionally need access controls, backups, and an authentication strategy. No secrets are stored, external actions require separate human authorization, and the default purpose avoids destructive activities.

## Integrity invariants

1. Every `(atom ID, particle kind, particle index)` maps to exactly one hive ID.
2. Every hive has a declared 50,000-slot capacity.
3. Every `(hive, slot)` maps to one unique worker identity.
4. The 100 epistemic IDs are contiguous and preserved (`#1233–#1332`).
5. Each role receives exactly 500 slots per hive; total = `100 × 500 = 50,000`.
6. Zero is a real value; undefined denominators and incomplete source claims are flagged rather than silently repaired.
7. 'Materialized records' and 'addressable slots' are separate reported metrics.

## Integration

This is an **additive extension** suited for `app-factory/nathan-ai/particle-hives/` in `NathanAIoxr/Nathan-AI-Sovereign-Core`. It does not overwrite the Cosmic Body Atlas, 246-pillar registry, 40-pillar proposal, or any existing avatars. Status depends on whether a GitHub PR is subsequently created and merged; merely producing local files is not a merge or live deployment.