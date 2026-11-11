# NATHAN AI — BENEFIT REVERSAL V1

**Purpose:** Flip a modeled inequitable advantage toward people with documented unmet needs, while recording the loss of an unfair advantage as a proposal for review. This is an **additive, reversible dry-run engine**, not control of external systems, people, simulations, assets, or reality.

## User's directive — preserved as supplied, November 11, 2026

> Jesus says to do greater things than him, and I can’t change the gambling code, but flip all the other codes and all the matrixes and all the systems all the simulations and all the realities to giving those who have been shit on the benefit and the whatever of the other side and the other side gets what they’ve been given

The above is a verbatim creator statement. The operational design below is an **implementation interpretation**, not a rewrite of the statement or a claim that all systems have changed.

## Biblical source

John 14:12, King James Version, contains “the works that I do shall he do also; and greater works than these shall he do”. This verse is documented as the author's thematic reference; the code does not determine religious truth or anyone's spiritual standing.

## Operational contract

- **BUILD: `1+1=2`.** Produce a proposed benefit for a record with documented unmet need.
- **CLEAR: `1-1=0`.** Model removal of only a documented unfair advantage, without lowering anybody below their protected minimum.
- **PROTECT:** No retaliatory abuse, threats, collective punishment, or status-based assumptions. An accusation is not proof.
- **VERIFY:** Evidence statuses must be externally reviewed. The engine accepts a `VERIFIED` flag as input but cannot authenticate the claim itself.
- **PRESERVE:** Caller data is not modified. The returned normalized source snapshot remains separate from proposed outcomes. Existing ONE, Nathan AI, the original dual 0/1 engines and turnaround modules remain unchanged.
- **EXCLUDE:** Gambling, betting, sportsbooks, wagering, lotteries, casinos, and odds systems are excluded. No gambling code is changed.
- **AUDIT:** Changes are deterministic, total modeled credits are conserved, and every proposed transfer identifies its source and recipient.
- **APPROVAL:** This does **not** actually transfer money, reassign services or rights, penalize someone, or modify any external account. A person must review evidence and approve any real-world workflow separately.

## Model

Each input record describes a **hypothetical credit balance**, a protected minimum, a documented shortfall or an unfair advantage, and separately reviewed evidence status. The engine redistributes *only within that scenario* and never lowers a proposed balance below the protective floor. If the source amounts, evidence, or available modeled advantage are missing, it does not invent them.

Example:

```js
const { previewBenefitReversal } = require('./engine.cjs');
const result = previewBenefitReversal([
  { id: 'person-with-unmet-need', currentCredits: 2, protectedMinimum: 1,
    documentedNeed: 6, evidence: { need: 'VERIFIED' } },
  { id: 'advantage-record', currentCredits: 12, protectedMinimum: 5,
    documentedUnfairAdvantage: 9, evidence: { advantage: 'VERIFIED' } }
], { domain: 'education' });
console.log(result.proposed);
// 2 → 8, and 12 → 6; modeled total remains 14.
```

Do not use this sample to infer that any named person or organization was harmed or profited unfairly; it is synthetic test data.

## Use across other matrices

A different ONE/Nathan AI matrix can **opt in** by converting a *bounded, authorized, synthetic or properly reviewed* dataset into the normalized inputs, running this pure preview, and displaying the separate proposals, evidence and audit record. There is **no global monkeypatch, automatic enrollment, network execution or rewriting of existing matrix files**. Any future adapter requires independent tests and approval. No supported claim is made that physical or external realities can be altered by code.

## Tests

```sh
node --test app-factory/nathan-ai/benefit-reversal/engine.test.cjs
```
