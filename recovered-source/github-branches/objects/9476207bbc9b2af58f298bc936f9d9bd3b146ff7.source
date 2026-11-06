# SIX DOGS — Nathan AI / ONE Resolution Engine

**Original names, preserved:** KNICK → KNACK → PADDY → WHACK → DOG → BONE.

Source: owner-supplied nursery-rhyme framework and the November 5 revised front-facing five-plane mapping. This module is additive. Existing original code and legacy author-owned archives are not replaced.

- [Launch browser workbench](index.html)
- [Engine source](engine.js)
- [Machine-readable architecture](architecture.json)
- [Arduino hardware and wiring guide](hardware/README.md)
- [Arduino firmware source](hardware/six_dogs_uno/six_dogs_uno.ino)
- [Node regression suite](engine.test.cjs)

## Six stage mapping to software, hardware and humanity

| # | Name | Emotional prompt (analogy) | User action | Software subsystem | LED |
|---|---|---|---|---|---|
| 1 | KNICK | Denial / Shock | Acknowledge facts | Event input and provenance | D3 |
| 2 | KNACK | Pain / Guilt | Explore options | Planning/constraint review | D4 |
| 3 | PADDY | Anger / Frustration | Pace and regulate | Scheduler/feedback loop | D5 |
| 4 | WHACK | Bargaining / Rumination | Decide constructively | Consent-gated action routing | D6 |
| 5 | DOG | Sadness / Isolation | Follow through and seek support | Progress tracking | D7 |
| 6 | BONE | Distress / Resolution | Reflect and restore connection | Checkpoint/export | D8 |

This mapping is a **creative decision aid** and is not a clinical grief scale, mental health treatment, or proof that feelings can be avoided. Revisiting earlier stages is supported. WHACK refers only to a **nonviolent** decision. BONE is a metaphor for comfort, care, resolution and possibly relief; it is never guaranteed that stress disappears. In slang, “boning” can refer to adult sexual intimacy, which sometimes promotes relaxation when consensual, but is not measured or prescribed by this application.

## Corrected five-plane matrix — all tracks move forward visually

| Plane | 1 | 2 | 3 | 4 | 5 | 6 |
|---|---|---|---|---|---|---|
| MIND | Dalet / Door Gate | Pe | Kaph | Waw | Nun | Bet |
| BODY | Knick | Knack | Paddy | Whack | Dog | Bone |
| SHADOW | Bet | Nun | Waw | Kaph | Pe | Dalet |
| SOUL | — | — | — | — | — | — |
| SPIRIT | — | — | — | — | — | — |

This preserves the user's corrected rule that the **mind starts at Dalet, the Door/Mind Gate**, rather than Kaph/Palm. Mind, Body and Shadow are source-defined. Soul and Spirit were named but their six positions were not fixed in the latest source. The workbench therefore keeps them empty, and lets the user assign optional labels without rewriting the canonical tracks. The alphabet/letter connections are symbolic author interpretations, not verified ancient etymology, neurological mechanisms or physical dimensions.

## Architecture and working features

The local-first data flow is:
USER → explicit input → deterministic Six Dogs state engine → in-memory session → optional user-authorized localStorage → versioned JSON export/import/deletion.
A separate **optional, user-initiated** path is:
selected stage → command preview → Web Serial browser permission → low-voltage Arduino LED controller.

Functions exposed in engine.js: createSession, advance, revisit, setPlane, validateSession, parallelAt, serialCommand, serialReset, sessionSummary, exportPackage, importPackage. The export schema is nathan-six-dogs.export version 1. Stage history is retained on explicit revisit; users can clear it locally. Inputs are rendered as plain text, not executable HTML.

Browser data stays **in page memory by default**. Browser localStorage, if opted into, is not encrypted, and JSON exports are also not encrypted. No remote API calls, login, emotion detection, telemetry, microphone or camera functions exist. Do not enter medical records, passwords, private keys or child information in this prototype.

The physical design uses six LEDs, individual 220–330 ohm resistors, one push button, an Arduino Uno-compatible board and USB power. A short press advances, a long press resets, and SD1 STEP n / SD1 RESET / SD1 QUERY control the device at 115200 baud. See hardware README for exact wiring. The sketch is supplied as source; real board compilation, wiring, device testing and safety certification have **not** been performed. The browser can send a command in supported secure contexts with user permission, but does not independently verify physical device response.

## Links to the wider Nathan AI ecosystem

- **Sovereign Acro-Matrix / DATA–ATAD:** Compare self-authored text forward/reverse without making automatic truth or lie claims. A deeper runtime integration is not yet built.
- **MIDA:** Keep a claim, its supporting sources, its interpretation and its human-review state separate. A runtime cross-module adapter is planned.
- **EI / Empathy / Sympathy / Compassion:** Prompt understanding, concern and constructive action; do not assert a machine experiences feelings.
- **UI / IUI:** Current accessible six-stage interface; adaptive UI remains a proposed extension.
- **II / BI / CI / DI / HI:** Future industry, analytics, collaboration and digital-skills analogies; no industrial equipment or group surveillance integration.
- **ONE:** This module is linked from the existing ONE shell, and from Nathan AI main hub. It does not replace those products.
- **17 mythological nodes / spirituality / psychology:** May be linked as optional creative-story layers, separately from historical and empirical claims.

## Further expansion — specified, not implemented

Native iOS and Android adapters, encrypted local backups, authenticated device acknowledgements, accessibility and haptic testing, game/story versions of the six dogs, multilingual LTR/RTL support, consent-based usability research and optional human support handoffs.

Do not assume that the six-stage rhyme is scientifically established, that recurring depression can always be bypassed, or that an optional controller performs any medical or emotional function.

## Validation

Regression: node --test app-factory/nathan-ai/six-dogs/engine.test.cjs
Browser smoke: launch the console, inspect all six cards, record/revisit stages, add an optional Soul or Spirit label, test JSON export/import, storage opt-in, wipe, copy a serial command and exercise Web Serial only with a compatible selected device.

**Status:** Functional self-guided browser prototype, data contract, and hardware firmware source. A complete native device product or clinically validated psychological method is not claimed.

## Macro-Topology and Micro-Engine layer (additive)

The requested two-layer design is divided into a working offline core and future infrastructure options.

| Requested architecture | Present implementation | Remaining scope |
|---|---|---|
| High Command / Sovereign Governance | Explicit user-operated controls and local graph node | No identity provider or jurisdiction exemption |
| Distributed Storage Lakes | In-memory key/value port, typed asset registry, manual JSON export | No distributed vector repository or encrypted vault |
| Event-Driven Pub/Sub | Local in-process event bus and bounded event ledger | No Kafka cluster, durable broker or external writes |
| Lean Monolithic Runtime | Pure dependency-free JavaScript core and Python unit | No installed LLM, vLLM, DeepSpeed, GPU serving or model weights |
| Ontological Registry | Typed assets, graph nodes and deterministic revisions | No automatic synchronization with other applications |
| DATA–ATAD Gateway | Unicode-aware browser reversal/roundtrip; codepoint Python reversal | No deception detection or factual-truth oracle |
| Binary Sentinel Rules | 1 means specified check passed; 0 means withhold for review | Neither outcome proves innocence, and neither deletes data |
| Ports & Adapters | Isolated memory store, pub/sub and explicit optional serial adapter | Future authenticated and encrypted adapters |

The browser includes topology.js and topology-ui.js embedded in the Six Dogs console. Selecting a stage updates an in-memory macro graph and event ledger. Registering an asset and inspecting a packet are separate user actions. The graph can be manually exported.

The standalone Python implementation is sovereign_unit.py. It accepts attributes and text, provides structural reversal and reviewer-state outputs, and requires exact CLEAR_LOCAL_ATTRIBUTES confirmation to create an empty copy; the source data is not mutated.

Exact arithmetic anchors: 1+1=2 BUILD and 1-1=0 CLEAR. Browser arithmetic is limited to JavaScript safe integers; Python supports arbitrary-size integers. A source citation, a reversible string and a user-entered supported-review label are not independent proof that a factual claim is correct.

vLLM, DeepSpeed, Apache Kafka, vector databases and on-premise model serving are possible future adapter targets, not packages that have been installed or configured in this release. Offline execution does not make a system immune to device failure, local data loss, compromise or applicable law.

Validation:

    node --test app-factory/nathan-ai/six-dogs/engine.test.cjs app-factory/nathan-ai/six-dogs/topology.test.cjs
    python3 -m unittest discover -s app-factory/nathan-ai/six-dogs -p 'test_*.py' -v

An unreviewed claim never automatically triggers a purge. Deletion of the Six Dogs session remains an explicit user action.

## Micro Edge + Macro Fabric (new runnable Python extension)

[Open the edge-mesh source and installation guide](edge-mesh/README.md) · [MicroEdgeEngine](edge-mesh/micro_edge.py) · [MacroNetworkFabric](edge-mesh/macro_fabric.py) · [encrypted local vector store](edge-mesh/encrypted_store.py) · [offline Docker Compose](edge-mesh/compose.yaml).

The author-supplied KNICK/KNACK/PADDY/WHACK/DOG/BONE processing layout is implemented as an **optional standalone Python demonstration**. It provides bounded local token staging, actual packed signed INT4/INT8 numeric arrays, software pacing, deterministic planning across explicitly registered simulated peers, local SHA-256 context digests and honest output integrity checking. It includes an **opt-in AES-256-GCM local filesystem vector adapter** with an externally provided key, plus a no-network runtime Docker Compose example. A full LLM quantizer, distributed execution framework, actual peer network, hardware encryption and zero-knowledge proof are **not implemented**. The established Six Dogs source sequences and all original UI modules remain unchanged.

Run regression: python3 -m unittest discover -s app-factory/nathan-ai/six-dogs/edge-mesh -p 'test_*.py' -v (with the separately declared cryptography dependency installed for encryption tests).
