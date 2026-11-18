# NATHAN AI — Outside Box

Nathan Tabor's Outside Box is a local case workspace for evidence review, an owner’s response decision, and a verification receipt. It extends the Sovereign Defender toolbox and reuses its Incident Ledger and SHA-256 fingerprint validation.

## Run

Serve the repository locally with `python3 -m http.server 8000`. Open `http://localhost:8000/app-factory/nathan-ai/sovereign-defender/toolbox/outside-box/`. Choose **Load example case** for a synthetic OAuth incident. The case stays in the current tab until you export or clear it. A case export contains normalized observations, assessments, decisions, and outcome references. Source fingerprints identify the selected input bytes, which have a separate exact-original download. Use **Save portable case ZIP** to bundle every original plus the decision journal. Reopening checks the source hashes and rebuilds the timeline before replacing the current case. The ZIP is not encrypted. Treat case exports, ZIPs, and originals as private incident data.

## Evidence inputs

- The existing Toolbox Incident Ledger JSON export. Its timestamps lack a time zone and stay in their original sequence in a separate timeline group.
- Cloudflare Logpush HTTP Requests as UTC RFC 3339 JSONL, a JSON array, or one JSON object. Include `RayID`, `EdgeStartTimestamp`, and `ClientRequestHost`. Optional fields are `ClientIP`, `ClientRequestMethod`, `EdgeResponseStatus`, and `SecurityAction`. A response status alone does not establish a security block. Headers, cookies, query strings, and raw request bodies are omitted from the normalized case.
- Normalized JSON with schema `nathan-ai.outside-box.telemetry.v1` and an `events` array. Events use `observedAt` in UTC, `asset`, `observation`, and optional `principal`, `ingress`, `sourceRef`, `family` (A–Z), and `stage` (observed, targeted, accessed, changed, transferred, or blocked). Source labels and stages are imported assertions.

Each source is limited to 2 MiB and 1,000 rows. Each case holds up to 10 sources. The case groups identical bytes by SHA-256. A digest checks integrity against an expected copy. It does not authenticate a producer or verify the truth of a statement.

## Architecture and source history

| Nathan AI source | Outside Box behavior |
|---|---|
| Sovereign Defender and Incident Ledger | Direct code reuse for the legacy export and fingerprint validation. |
| CoreOrder and ConsentFlow | The new scope and confirmation flow binds a recorded decision to an existing event and an owned or authorized asset. These names trace to Guardian V2.0. |
| ICU_Buddy and RAPTURE_Protocol | The new tab-local case and recorded containment choices carry forward the casekeeping and containment concepts. |
| LET/TET, Semantics Antivirus, DATA ATAD | The input file and the interpretation stay separate. The historical Semantics Antivirus text transformations remain a distinct project. |
| Quantum Leap, Bewitched, and Jeannie | Chronological replay, a reviewable reversal, and quarantine of untrusted input inform the workflow. |
| Universal Creator Vault | Direct reuse of original-byte ZIP creation, safe archive reading, SHA-256 comparison, and format bounds. |
| Hall of Mirrors | Direct reuse of the recovered inert pattern matcher on one selected observation. The case shows named heuristic matches and does not interpret them as a finding of compromise. |
| Shadow Code and Insecurity family | Recovered design vocabulary for the untrusted side of the boundary. Observed identity, relay, affected asset, possible intent, and verified outcome stay distinct. |
| Five Equal Guardians, Forever Guardian, and Protect Innocence | The design keeps the affected owner in control of scope, the action chosen, and what is disclosed in a handoff. |
| The THINKER Anti-Ransomware Patch, Sovereign Defender, Dehack/Deliver | Use recorded indicators, a trusted baseline, an independently verified recovery result, and evidence-first action selection. The R family links this method to the A–Z playbook. |
| Sovereign Boxes and True Cloud Computing | Box 0 maps to bounded intake and scope review. Box 1 maps to case derivation and verification receipts. The separate compute Workers and D1 job ledger are referenced as related infrastructure. |

**1 − 1 = 0** plans containment. **1 + 1 = 2** adds evidence. **1 × 1 = 1** joins sources. **1 ÷ 1 = 1** records verification.

The browser records choices and owner-reported results. Live enforcement and telemetry collection require separate authorized adapters. The workspace uses the shared appearance preferences and keeps the network-enabled command center outside the incident page. It does not fetch imported URLs or use imported text as markup or commands. Human attribution stays unknown. The owner can record a possible tactical goal with supporting evidence and confidence.

## Verify

```sh
node --test app-factory/nathan-ai/sovereign-defender/toolbox/outside-box/*.test.cjs
```

- [Sovereign Defender toolbox integration](https://github.com/NathanAIoxr/Nathan-AI-Sovereign-Core/pull/111)
- [Cloudflare HTTP Requests fields](https://developers.cloudflare.com/logs/logpush/logpush-job/datasets/account/http_requests/)

- [Hall of Mirrors recovered engine and source notes](../../../../one/hall-of-mirrors/README.md)
- [Universal Creator Vault](../../../../UNIVERSAL-CREATOR-VAULT.md)
- [Five Equal Guardians](../../../five-guardians/README.md)
- [Forever Guardian](../../../atomic-equator-forever-guardian/README.md)
- [True Cloud Computing receipt work](https://github.com/NathanAIoxr/Nathan-AI-Sovereign-Core/pull/319)
