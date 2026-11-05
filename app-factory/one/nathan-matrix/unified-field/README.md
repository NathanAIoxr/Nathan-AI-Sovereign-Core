# Nathan AI / ONE · Unified Field 0–9 and 4×6

**Independent ONE Matrix module.** This is the sovereign home for the creator's 10-position field concept, separate from the Snow Family story, HOP IN chatbox, other ONE matrices, and historical manuscript research.

## Where each original belongs

| Part | Canonical source | Status |
|---|---|---|
| Creator-supplied Matrix 0–9 and eight operator descriptions | [Creator input](./CREATOR_INPUT_2026-11-05.md) | Creator text archived separately, neither accepted nor denied as historical fact |
| Original Python reference program | [nathan_unified_field_sim.py](./reference-python/nathan_unified_field_sim.py) | Preserved byte-for-byte from original conversation artifact |
| Python methodology notes | [nathan_unified_field_README.md](./reference-python/nathan_unified_field_README.md) | Preserved byte-for-byte |
| Original 4×6 CSV result | [nathan_unified_field_matrix.csv](./reference-python/nathan_unified_field_matrix.csv) | Preserved byte-for-byte |
| Original JSON result | [nathan_unified_field_output.json](./reference-python/nathan_unified_field_output.json) | Preserved byte-for-byte |
| JavaScript game/symbolism simulation | [Snow Family Field Experience](../../../nathan-ai/trinity-of-snow/field-experience/index.html) | Derived independent model, not a rewrite of Python |

## Two distinct algorithm models

The **Python model** uses four transformations on one raw six-bit input:
- row 1 = identity
- row 2 = rotate right one bit
- row 3 = reverse bits
- row 4 = XOR with 010101

For the printed field, each row evaluates its own `T_i(x)` against the same input. For the feedback cycle, the model applies rows 1 through 4 *sequentially* and repeats until an input repeats.

The **Snow Family JavaScript model** applies four row-specific XOR masks sequentially (101100, 010110, 001101, 111001) and uses a second pass to illustrate feedback. Its row outputs therefore differ from those in the Python reference, and its mask choices are educational, not measurements. Do not silently replace or conflate these two algorithms.

Both use the formula **M(i,j) = phi(j)(T(i)(x))**, six conceptual channels, eight symbolic operator labels (1–8) and boundary labels **0** and **9**. The choice of transform is an explicit implementation decision; the formula by itself does not specify a unique transform.

## Authorship, evidence and protection

The creator's names "White Pope," "Black Pope," "Grey Pope" and five hidden keepers are archived as named roles in his symbolic framework. Historical inquiry, source annotations, and claims about actual institutions must remain in a distinct layer. This code does not demonstrate eight real papal offices, control mechanisms, or a literal physical Earth matrix.

The original **nineteen-level Snow Family** convention is **another** independent numbering system, in a different module:
- ABOVE / NORTH: +9, +8, +7, +6, +5, +4, +3, +2, +1
- MIDDLE / EQUATOR / VOID: 0
- BELOW / SOUTH: -9, -8, -7, -6, -5, -4, -3, -2, -1

Cross-link concepts; do not collapse these systems into a single list.

## Verification

From this directory, or from the repository root with paths adjusted:

    python3 reference-python/nathan_unified_field_sim.py --seed 101100 --steps 16

The archived report for this input yields the two-step cycle **101100 → 001111 → 101100** and Matrix 9 explicit release **101100**.

Use **1+1=2 BUILD** to add versions and **1-1=0 CLEAR** to reset a working state without deleting originals. Retain existing ONE and owner-held code unchanged. Commit no private manuscripts, credentials, or family records.
