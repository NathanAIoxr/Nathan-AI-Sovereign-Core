# Engineering Report — THE NATHAN TABOR WAY

Date: 2026-11-13  |  Scope: general technology, 16 domains, 128 proposed failure classes.

## Result

An executable evidence-first *case registry and test harness* was created. This does not constitute remediation of the 128 cataloged problems. No production systems were modified or inspected for vulnerabilities in this work.

## Domain coverage

| Domain | Hypotheses | What reverse engineering should examine |
| --- | ---: | --- |
| Requirements and architecture | 8 | Outcomes, requirements, coupling, contracts |
| Software execution | 8 | Logic, state, concurrency, deployment |
| Data storage and semantics | 8 | Source, units, schema, lineage, recovery |
| Cybersecurity and trust | 8 | Authorization, injection, provenance, incident response |
| Identity privacy and consent | 8 | Authentication, least privilege, retention, revocation |
| Networks and distributed systems | 8 | Ordering, retries, partitions, congestion |
| Cloud operations and reliability | 8 | Redundancy, observability, capacity, recovery |
| AI models and agents | 8 | Grounding, prompt injection, agent controls, evaluation |
| Hardware and firmware | 8 | Heat, fatigue, firmware update, calibration |
| Robotics and control systems | 8 | Real-time constraints, sensing, feedback and interlocks |
| Human interfaces and accessibility | 8 | Task usability, assistive tech, keyboard access, consent |
| Energy resources and environment | 8 | Work per joule, lifecycle, cooling, materials |
| Interoperability and standards | 8 | Protocols, encoding, identity, time zones |
| Supply chain and product lifecycle | 8 | Origin, maintenance, build trust, traceability |
| Measurement and scientific integrity | 8 | Controls, uncertainty, samples, causality |
| Economics governance and institutions | 8 | Incentives, accountability, portability, access |

**Result: 128 unassessed hypotheses.** The catalog's addressability estimates are 26 `fixable`, 86 `reducible`, and 16 `constrained`. These labels have no statistical meaning and cannot be extrapolated as global success rates.

## Four layers of verification

1. **Schema truth:** a problem record is present, well-formed, uniquely identified and has a falsifiable test.
2. **Demonstration truth:** small, artificial mechanisms behave according to controlled unit tests.
3. **System truth:** the proposed correction is actually deployed to a particular authorized system and meets measured acceptance criteria.
4. **External truth:** an independent reviewer reproduces the result, checks evidence provenance and residual risk, and confirms the bounded claim.

**This package demonstrates layers 1 and 2 only.** Layer 3 and 4 require real systems, data, permission and field evaluation.

## Root causes vs symptoms

Observed failure **does not automatically identify root cause**. Each case should maintain competing hypotheses. A passing test of an alternative implementation shows that an implementation behaves better under the test, but it does not prove why the real failure occurred. Falsification and counterexamples are required.

## Prioritization without invented probabilities

A case should be ranked only after gathering observed severity, actual exposure, affected users, reversibility and verified control effectiveness. Do not fabricate risk figures from the catalog. Prefer immediate handling of observed, severe or irreversible harm; use engineering triage for all remaining cases.

## Local test evidence

Run: `python -m unittest discover -s tests -v` from the module root.

Initial local execution: **18 tests run, 18 passed, 0 failures**. They cover 128-record catalog integrity; default `UNASSESSED` status; rejecting unsupported `VERIFIED_IN_USE` claims; SHA-256 canonical JSON digest; single-process idempotent duplicate handling (including a threaded demonstration); default-deny permissions; isolation of optional analytics failure; physical unit normalization; stale-record refusal; tool-permission insulation from untrusted text; and bounded retry schedule.

**Important:** passing a one-process threaded demo does not prove distributed or durable exactly-once execution. The tool-permission demo is a simple permission predicate, not a security evaluation of a model. The exception handling example must be strengthened with proper logging before any production use.

## Proposed next-stage field validation

1. Choose one repository subsystem or authorized deployment, and define the intended end-to-end user result.
2. Capture a true baseline and a single reproducible failure with safely redacted logs.
3. Trace its dependency graph, test at least one competing hypothesis, and define a corrective mechanism.
4. Run targeted regression/security tests and use a safe rollout; verify via live metrics against the baseline.
5. Request independent review; mark the case verified only for the tested environment, scope and time period.

## Limitations and integrity

There cannot be a finite guaranteed list of *every* present and future technology failure. This catalog is a broad starter taxonomy. Success remains scoped to verifiable interventions, not promises of universal elimination of all risks. All source text from Nathan Tabor is preserved separately and marked verbatim. Neither source authorship nor unverified technical performance is altered by this report.