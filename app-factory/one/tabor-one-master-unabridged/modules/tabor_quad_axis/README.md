# Nathan AI — Tabor Quad-Axis Cipher & Knowledge Reconstruction

**Release:** 5.1.0 (additive, functional reconstruction of supplied Mk. IV v4.0.0 and Mk. V v5.0.0)

**1+1=2 — BUILD**  
**1-1=0 — CLEAR**  
**Yes is Yes — No is No**

## What is included

- `src/quad_axis_cipher.py`: runnable four-axis text transformations, reversible cascade, full-spectrum projection, diagnostic report, CLI.
- `tests/test_quad_axis.py`: standard-library unit tests, including multi-line, Unicode, unusual whitespace, every axis and custom keys.
- `docs/ARCHITECTURE.md`: algorithms, guarantees, boundaries, math, index behavior, and known limitations.
- `docs/KNOWLEDGE_MATRIX.md`: documentation and source-tagged research schema for the second pasted source.
- `docs/EVIDENCE_LEDGER.md`: distinguishes verbatim claims, project interpretations, and independently testable evidence.
- `original_sources/`: **both complete pasted texts preserved byte-for-byte without rewriting**.

## Run immediately

Requires Python 3.10+; no pip dependencies.

```bash
python src/quad_axis_cipher.py collapse "Tomorrow when it arrives will be today."
python src/quad_axis_cipher.py spectrum "NIGGINA / NIGLUL"
python src/quad_axis_cipher.py encode "Truth" --master raphael --key 7
python src/quad_axis_cipher.py encode "Truth" --master leonardo --layer vertical
python src/quad_axis_cipher.py cascade-encode "1+1=2 — BUILD"
python src/quad_axis_cipher.py verify "Yes is Yes — No is No"
python -m unittest discover -s tests -v
```

### Quick Python API

```python
from src.quad_axis_cipher import QuadAxisCipherSystem
engine = QuadAxisCipherSystem(raphael_key=7, donatello_square=4)
text = "Tomorrow when it arrives will be today."
encoded = engine.cascade_encode(text)
assert engine.cascade_decode(encoded) == text
print(engine.full_spectrum(text))
print(engine.collapse(text))
```

## Four axes

| Axis | Project role | Transformation | Inverse |
|---|---|---|---|
| Leonardo | Navel / Center | Whole string, individual words, or upside-down glyph projection | Reverse; vertical uses inverse glyph map |
| Raphael | Sphere / Light | Caesar shift by key modulo 26 | Negative shift |
| Donatello | Base / Square | At position `i`, shift by `(i % square)+1` | Negative positional shift |
| Michelangelo | Tension / Line | ROT13 on odd *zero-based* code-point indices | Same operation |

**Cascade:** Donatello → Raphael → Michelangelo → Leonardo. **Inverse:** Leonardo → Michelangelo → Raphael → Donatello.

## Scope and safety

The four algorithms are **educational classical ciphers**, not modern cryptography. Do not use them to secure passwords, private keys, communications, or sensitive data. Full-spectral and “collapse” modes transform or compare text; they **do not identify lies, reveal secret histories, detect malicious code, certify historical claims, remove malware, or provide a firewall**. The stored atomic-soul statement is a project invariant, not a verified scientific claim.

## Provenance policy

Source originals remain unchanged. New documentation and implementation live alongside them and may be amended without replacing original author wording. Historical statements in the supplied conversations are recorded as claims, not automatically accepted as verified. See `docs/EVIDENCE_LEDGER.md`.