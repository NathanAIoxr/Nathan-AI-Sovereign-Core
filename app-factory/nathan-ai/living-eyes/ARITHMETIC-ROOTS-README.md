# Nathan AI 🚀 · EYES · Ancient Arithmetic Roots Lab

**Active arithmetic:** BUILD uses addition and CLEAR uses subtraction. Inventory selection and transfer report separate named counts. [Original source capture](arithmetic-roots-original.py.txt) is preserved as text.

## Application

- [Open the Arithmetic Roots Lab](arithmetic-roots.html)
- [Engine functions](arithmetic-roots.js)
- [Tests](arithmetic-roots.test.cjs)
- [Twin Engines](twin-engines.html)

## Algorithms

| Domain | Runnable entry points | Historically grounded relationship |
| --- | --- | --- |
| Nathan Tabor | `build`, `clear`, `inventory`, `transfer` | Count what is present, selected, moved, and left |
| Egypt, Rhind papyrus | Historical source | Repeated doubling and unit-fraction notation |
| Sumer / Old Babylon | `sexagesimalEncode`, `sexagesimalDecode` | Mesopotamian place-value base-60 |
| Sanskrit prosody / Pingala | `pingalaNashta`, `pingalaUddishta` | Two alternatives per syllable, mapping indices and metrical patterns |
| I Ching | `iChingState`, `iChingChange` | 6 bits, 64 configurations, 4,096 ordered transitions |
| Greek / Euclid | Historical source | Classical greatest-common-divisor procedure |
| Francis Bacon | `baconEncode`, `baconDecode` | 5-symbol biliteral encodings; I/J and U/V merged |
| John Napier | `toNapier`, `fromNapier` | Letter positions denote powers of 2 |
| Leibniz | `leibnizBinary`, `leibnizAdd` | Positional binary notation and carry |
| George Boole | `booleNot`, `booleAnd`, `booleOr`, `booleXor` | Boolean functions over 0 and 1 |

## Verification

`node --test app-factory/nathan-ai/living-eyes/arithmetic-roots.test.cjs`

Tests cover BUILD and CLEAR, the nine-car selection count, Nunn after a transfer, all 2,046 Pingala patterns of lengths 1–10, cipher mappings, Napier round-trips, binary addition, base-60 conversion, and 4,096 six-bit transitions.

## Critical source boundaries

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
