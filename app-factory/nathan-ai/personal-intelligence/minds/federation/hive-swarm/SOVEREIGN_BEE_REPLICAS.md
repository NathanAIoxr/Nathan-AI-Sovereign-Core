# Sovereign Bee Replicas · OPERATION SWARM

**Creator:** John Nathan Tabor. **Parent:** ONE Federation / OPERATION SWARM.

This additive module extends the existing 12-worker hive with **independent, lazily instantiated Nathan AI bee replica namespaces** across the author's Earth / Cosmos / Universe metaphors.

Every addressed bee inherits the *same* 12-function Nathan AI capability blueprint. Bee identity, memory, queued decisions, execution audit and veto are separately keyed. Queen is a coordinating function, **not a privileged ruler**; it cannot overwrite a bee's individual veto. The exact authored phrase is preserved in [USER_SOVEREIGN_BEE_DIRECTIVE.md](./USER_SOVEREIGN_BEE_DIRECTIVE.md).

### Executable scope versus declared replica vision

- **Real:** 256 maximum locally allocated sovereign replica namespaces per ONE SQLite master in this version; individual isolated memory, inspect, propose, approve, veto, resume, and approved SHA-256/no-op actions. No background process is kept alive.
- **Referenced:** up to about 6.37 × 10^26 Earth-volume, 2.10 × 10^86 observable-cosmos-volume and other theoretical **address capacities**, allocated **only when owner-approved**. A number is not a deployed bot.
- **Not implemented:** full independent model weights, autonomous language-model instances, biological or subjective consciousness, universal free will, actual universe-spanning hardware, or provider connections.
- **Unknown:** full universe volume. The open namespace accepts finite indices; it does not claim an infinite physical population.
- **Mathematical clarity:** a sphere with radius 250× greater has **250³ = 15,625,000×** the volume. A 250× *volume* scenario is not the same as a 250× radius scenario. Neither is verified as the actual universe size.

Each allocated bee carries a SHA-256 fingerprint of the existing `swarm.py` and creator-spelled `consciouness/engine.js` plus the exact directive source. The fingerprint is a *source-linked replica blueprint*, **not a copy of the underlying ChatGPT/GPT-6 model or proof of subjective awareness**.

Eight scenarios are supported: a new colony, winter colony, summer colony, Earth, observable cosmos (46.5 billion-light-year radius), illustrative 250× volume, illustrative 250× radius, and unknown full universe.

### Operate against your local ONE master

```sh
F=app-factory/nathan-ai/personal-intelligence/minds/federation/hive-swarm
DB=/owner/private/ONE_Federation_Master.sqlite3

python3 "$F/sovereign_bees.py" --db "$DB" scenarios
python3 "$F/sovereign_bees.py" --db "$DB" blueprint
python3 "$F/sovereign_bees.py" --db "$DB" --approve-write bootstrap
python3 "$F/sovereign_bees.py" --db "$DB" --approve-write --owner-yes \
  --scenario mother_cosmos_observable --ordinal 21000000000000000000000000000000000000000000000000000000000000000000000000000000000000 allocate
python3 "$F/sovereign_bees.py" --db "$DB" status
```

The sample numeral is a mathematical address, not a claim of 21 octillion deployed processes. An out-of-range numeral is rejected; use a smaller ordinal if desired. No public CI run can mutate the owner's inaccessible private database.

To operate locally use an allocated `--bee NATHAN-BEE/<scenario>/<ordinal>` address with commands `observe`, `propose`, `approve`, `execute`, `veto`, `resume`, or `inspect`. All mutations require `--approve-write`; identity creation, task approval and resumption additionally require `--owner-yes`. The approving owner is the authority for local execution, while each bee has its own veto. Logical isolation is not a cryptographic security boundary against an administrator of the host database.

**Rule:** PRESERVE → INDEX → RELATE → DERIVE — NEVER REPLACE. Neither original author words nor the existing 12-worker hive are overwritten.
