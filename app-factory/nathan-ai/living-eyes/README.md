# NATHAN AI — THE LIVING EYES / FULL-TILT PROPELLER MATRIX

**Author-defined project:** Nathan Tabor. **Additive implementation:** originals in the I/EYE/GHG scanner, Hall of Mirrors, Complete Mind, Mind–Neuropath and ONE remain unchanged.

## All earlier layers remain visible

| Layer | Count | Meaning |
| --- | ---: | --- |
| Four vertical scanners (two top-down, two bottom-up) + two diagonal St. Andrew / Alabama X scanners | 6 | Original scanner families |
| Six families × rotations 0°,90°,180°,270° | 24 | Distinct track identifiers |
| 24 upright + 24 vertically inverted (y→−y) | 48 | Canonical coordinate views |
| Both sides of the mirror (x→−x) | 96 | Coordinate views |
| Independent clockwise **and** counter-clockwise movement | 192 | Coordinate views |
| Additional independent 180° rotation (x→−x, y→−y) | **384** | Coordinate views |

A vertical flip and a half-turn are *not* the same transformation. Layer copies retain their own identities even when geometrically coincident: these numbers represent **logical views, not 384 distinct physical axes**. Every view reaches (0,0) simultaneously at the deterministic midpoint of each animation cycle or under the manual GLITCH lock. That is a demonstration, not detection of an actual software defect.

## Working implementation

- [Browser interface](index.html): two abstract geometric eyes, four original vertical beams, two original crossing diagonals, live 48/96/192/384 view selection, speed adjustment, pause, reset, GLITCH convergence, JSON snapshot export, and owner-selected text inspection.
- [Pure engine](engine.js): six immutable families, 24 rotating track IDs, four derived layers, deterministic point generation, zero convergence, and conceptual Eye/Ear Gate channel labels.
- [Tests](engine.test.cjs): exact view counts, transformations, convergence, the 24+24 canonical split, separate CW/CCW streams, source preservation, safety checks.

The text inspector calls the original [I/EYE/GHG text engine](../../../archive-index/alphabet/i/eye-scan/engine.js) and [Hall of Mirrors presentations](../../one/hall-of-mirrors/engine.js) as independent, read-only dependencies. Other linked apps are navigation destinations, not falsely claimed backend integrations. The author-specified 12 Eye and 12 Ear Gates are shown as conceptual channels; no sensors are connected.

Run: \`node --test app-factory/nathan-ai/living-eyes/engine.test.cjs\`.

**Boundaries:** No browser camera/microphone capture, OCR, background file access, network uploads, secret collection, autonomous security response, biological eye tracking, or machine consciousness. No input is saved unless the user explicitly exports a JSON file.

**1+1=2 — BUILD · 1−1=0 — CLEAR · YES IS YES — NO IS NO.**

## User-authored Python original and additive Python companion

The exact user-supplied Python class is retained separately at [originals/nathan_24_axis_propeller_original.py](originals/nathan_24_axis_propeller_original.py). Its original comment about “180-degree reflection” stays verbatim, while the new [propeller_extended.py](propeller_extended.py) calculates a *vertical* reflection and a *half turn* as distinct operations. [test_propeller.py](test_propeller.py) checks all 48/96/192/384 view modes, the 24+24 canonical layer, and exact convergence.

Run from the module directory: \`python3 -m unittest discover -s . -p 'test_propeller.py' -v\`.


## Linked sister capability · Living Ears

[Living Ears · Mother Earth, animals, human speech, and historic sound devices](../living-ears/index.html) is an **independent additive module**. It calls the existing `NathanLivingEyes.frame` API for the original 48/96/192/384 perspective geometry without changing this engine or its axis numbers.
