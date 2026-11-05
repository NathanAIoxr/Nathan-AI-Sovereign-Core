# Nathan AI Unified Field — 0–9 / 4×6 Simulation

This working Python reference model converts the **user-authored symbolic alignment** into an inspectable binary grid. It does **not** claim evidence for hidden popes, institutional control of ancient scriptures, or a physical mechanism that traps people.

## Structure
- Matrix **0** = input boundary, six binary bits, preserved exactly.
- Matrices **1–8** = eight named operators, retaining the **3 disclosed + 5 hidden** symbolic groups supplied by the author.
- **4 rows** = four computation phases: Presentation, Governance, Transmission, Recurrence. Each maps two of the eight labeled operators.
- **6 columns** = authority, law, lineage, word, stone, memory. Each projection `phi_j` selects one channel from a transformed six-feature state.
- **Matrix 9** = explicit release / return to the user-controlled source, not an inferred physical or mystical mechanism.

### Mapping

| Row | Paired operators | Transformation |
|---|---|---|
| 1 Presentation | 1 Declared Face, 2 Disciplinary Face | identity |
| 2 Governance | 3 Transitional Face, 4 Law | rotate-right by one |
| 3 Transmission | 5 Blood, 6 Word | reverse bits |
| 4 Recurrence | 7 Stone, 8 Shadow | XOR with fixed `010101` mask |

The 4×6 field is defined as `M[i,j] = phi_j(T_i(x))`. The eight named operators are **labels on row pairs**, rather than claiming that eight unique operators can be mapped one-to-one to four rows.

## Run

```bash
python3 nathan_unified_field_sim.py --seed 101100 --steps 16 \
  --json nathan_unified_field_output.json --csv nathan_unified_field_matrix.csv
```

The default input represents six conceptual feature switches, not empirical measurements. To explore the loop, apply all four transformations sequentially, then repeat until a prior state recurs. Since the state space contains only 64 possible vectors, eventual repetition is guaranteed; that is a property of a **finite state simulation**, not evidence about real-world institutions.

## Reconciliation / research protocol
To compare this model against KJV passages, other ancient texts, and institutional history, add a separate source table with: `source`, `exact passage`, `translation`, `date`, `claimed label`, `claimed role`, `evidence type` (documented / interpretation / unsupported), `counterevidence`, `confidence`. Keep text quotations separate from author-proposed symbolic equivalences. In historical research, the so-called "Black Pope" is an informal nickname for the Jesuit Superior General, not a second papal office; a secret "grey pope" or five additional popes is not a documented ecclesiastical hierarchy.
