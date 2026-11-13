# THE NATHAN TABOR WAY — REVERSE, ENGINEER / FORWARD, ENGINEER

**Method authored by Nathan Tabor.** 2026-11-13 engineering expansion and independent test harness.

## Original author statement — verbatim

> THE NATHAN TABOR WAY: Start with the result. Reverse-engineer its functionality. Reconstruct the mechanisms. Test the connections. Build forward from what the evidence establishes.

The quoted line is user-authored; everything else in this module is an *engineering elaboration* and must not be presented as a verbatim Nathan Tabor quotation.

## What exists

- `problems.json`: **128 hypotheses** across **16 technology domains**, each with failure mechanism, forward correction, falsifiable test, and a limits label. Every entry is explicitly `UNASSESSED`.
- `engine.py`: standard-library command-line interface for finding problems, generating case templates, and auditing staged evidence claims. This is a *documentation* gate, not automatic root-cause discovery or proof of real-world correctness.
- `tests/test_engine.py`: **18** local tests for catalog structure, evidence-gate behavior and miniature corrective mechanisms.
- `index.html`: text-first browser for the catalog, search, domain filters and expansion of problem records. It loads `problems.json` locally or on GitHub Pages.
- `catalog-standalone.html`: single-file offline browser with all 128 records embedded and no server requirement.
- `docs/ENGINEERING_REPORT.md`: engineering interpretation, prioritization, measured local results and limitations.
- `cases/`: examples for the ledger, not production case evidence.

## Seven disconnects (analysis categories, not a universal law)

1. **Intent ↔ Requirements:** What users need differs from what is specified.
2. **Requirements ↔ Implementation:** The built program does not implement the intended contract.
3. **Component ↔ Component:** Interfaces, ordering or formats disagree.
4. **Action ↔ Authority:** An operation exceeds valid permissions.
5. **Result ↔ Evidence:** A success claim lacks a reproducible measurement.
6. **System ↔ Environment:** Reality deviates from assumptions about resources, loads or threats.
7. **Technology ↔ People:** Designs conflict with usability, institutions, economic incentives or rights.

## Reverse/forward procedure

1. **Observe** the actual result and capture time, scope, inputs and impact.
2. **Specify** the intended result as a measurable, falsifiable acceptance criterion.
3. **Reverse-trace** observations through functionality, implementation, components and dependencies to evidence.
4. **Test competing causes**; distinguish a hypothesis from a demonstrated causal link.
5. **Forward-engineer** the smallest safe correction and its contract, while preserving original evidence.
6. **Test** unit, integration, security, human and system constraints as appropriate.
7. **Compare** before/after using equivalent conditions; run fault-injection and regression tests.
8. **Verify in use**, repeat observations, independent review, enumerate residual risks.
9. **Reverse again** to check whether new results still agree with the proposed mechanism.
10. **Publish** a scoped claim and an auditable evidence trail; reopen whenever the conditions change.

## Status definitions

`UNASSESSED → OBSERVED → REPRODUCED → ROOT_CAUSE_SUPPORTED → CORRECTED → TEST_PASSED → VERIFIED_IN_USE`

`engine.py audit-case` checks for documentation fields, evidence-link structure and minimum stage gates, not the truth of submitted material. **A completed record is not automatically proof of the claimed result.** Real external verification still requires inspecting source artifacts, reproducing tests, and independently validating system measurements.

## Run it

Python 3.10+; no third-party dependencies.

```bash
python engine.py validate-catalog
python engine.py summary
python engine.py list-domain "AI models"
python engine.py new-case NTRP-057 --out my-case.json
python engine.py audit-case my-case.json
python -m unittest discover -s tests -v
```

`new-case` refuses to overwrite an existing file. It creates an `UNASSESSED` template; fill the fields with real, authorized project evidence and advance stage only as the checks are met.

To browse without a server, open `catalog-standalone.html` directly in a browser.

To browse the linked catalog locally:

```bash
python -m http.server 8000
```

Then open `http://localhost:8000/index.html` in a local browser. Do not place private case records in a public GitHub Pages directory.

## Scope and non-claims

- **Not** a claim to have solved 128 technology problems, fixed a deployed system or proved a universal theorem.
- Catalog `fixable`, `reducible` and `constrained` labels describe *hypothesized addressability in a specific environment*, not effectiveness percentages or a guarantee of success.
- It does **not** scan infrastructure, reach into private databases, run autonomously, or modify production assets.
- It deliberately does **not** store API keys, private data, passwords, secrets or uploaded documents.
- Access control, concurrent idempotency, injection isolation and other demonstrations are intentionally simplified; they are not production-ready security controls.
- Sources below provide standards context only. This project is not affiliated with or certified by those organizations.

## Reference links

- NIST SSDF, SP 800-218: https://csrc.nist.gov/pubs/sp/800/218/final
- OWASP Top 10:2025: https://top10.owasp.org/
- NIST AI RMF Generative AI Profile: https://www.nist.gov/publications/artificial-intelligence-risk-management-framework-generative-artificial-intelligence
- ISO/IEC 25010:2023 quality reference: https://www.iso.org/standard/78176.html
- W3C WCAG 2.2: https://www.w3.org/TR/WCAG22/

## Suggested repository integration

Keep this module under `research/the-nathan-tabor-way/` in a **reviewable branch**. Existing `main` source, books and original wording remain untouched until a human approves a PR. Any later direct integration into the repository's ONE, website indexes, GitHub Actions or private database needs separate project-specific validation, and secrets must remain outside GitHub.