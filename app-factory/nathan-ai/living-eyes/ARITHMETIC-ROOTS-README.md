# Nathan AI 🚀 · EYES · Ancient Arithmetic Roots Lab

**Scope:** Additive implementation; no changes to prior owner-authored source or Living Eyes geometry, state engines, scanner axes, or Twin Engines logic.

## Application

- [Open the Arithmetic Roots Lab](arithmetic-roots.html)
- [Engine functions](arithmetic-roots.js)
- [Tests](arithmetic-roots.test.cjs)
- [Twin Engines](twin-engines.html)

## Algorithms

| Domain | Runnable entry points | Historically grounded relationship |
| --- | --- | --- |
| Egypt, Rhind papyrus | `egyptianMultiply`, `egyptianUnitFractions` | Repeated doubling/addition; unit-fraction sums |
| Sumer / Old Babylon | `sexagesimalEncode`, `sexagesimalDecode`, `reciprocalRegular` | Mesopotamian place-value base-60 and reciprocal calculation |
| Sanskrit prosody / Pingala | `pingalaNashta`, `pingalaUddishta` | Two alternatives per syllable, mapping indices and metrical patterns |
| I Ching | `iChingState`, `iChingChange` | 6 bits, 64 configurations, 4,096 ordered transitions |
| Greek / Euclid | `euclidGcd` | Repeated remainders as a deterministic procedure |
| Francis Bacon | `baconEncode`, `baconDecode` | 5-symbol biliteral encodings; I/J and U/V merged |
| John Napier | `toNapier`, `fromNapier`, `napierMultiply` | Letter positions denote powers of 2 |
| Leibniz | `leibnizBinary`, `leibnizAdd` | Positional binary notation and carry |
| George Boole | `booleNot`, `booleAnd`, `booleOr`, `booleXor` | Boolean functions over 0 and 1 |

## Verification

`node --test app-factory/nathan-ai/living-eyes/arithmetic-roots.test.cjs`

Tests include 10,201 Egyptian products, all 2,046 Pingala patterns of lengths 1–10, standard cipher mappings, 1,001 Napier round-trips, 10,000 Leibniz additions, 10,001 base-60 conversions, 4,096 six-bit transitions and checks of fractions and Euclidean GCD.

## Critical source boundaries

- Modern bit operations are used **to implement** Egyptian doubling but are not evidence that ancient Egyptians used electronic binary.
- Ancient Sumerian and Old Babylonian calculation prominently used sexagesimal place value, not exclusively base-2. The precise chronology of individual inventions and manuscript survival differs.
- Pingala's two syllable classes permit a binary encoding; the numbering/orientation represented here follows the user-provided conventions and should not be presented as the sole authentic historical convention.
- Napier location arithmetic was published in 1617, predating Leibniz's 1703 publication.
- Leibniz's binary investigations precede his encounter with the Fu Xi diagram via Jesuit Bouvet.
- The six line transitions model changes by XOR, but the model alone cannot predict natural events.
- All numeric work is local, deterministic, owner-triggered. No Internet access, video feeds, network interception or autonomous machine-control logic is attached.

## Primary / specialist sources

- [Open University — Egyptian calculation](https://www.open.edu/openlearn/science-maths-technology/mathematics-statistics/egyptian-mathematics/content-section-1.1.2)
- [History of Science — Three thousand years of sexagesimal numbers in Mesopotamian mathematical texts](https://doi.org/10.1007/s00407-019-00221-3)
- [MAA — Old Babylonian tablet YBC 7289](https://old.maa.org/press/periodicals/convergence/the-best-known-old-babylonian-tablet)
- [MAA — Napier’s Binary Chessboard Calculator](https://old.maa.org/press/periodicals/convergence/john-napiers-binary-chessboard-calculator-napiers-rabdologiae)
