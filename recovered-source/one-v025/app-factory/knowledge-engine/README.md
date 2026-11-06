# 𓋹 TABOR ROOT — Universal Knowledge & Creation Engine

**Creator:** Nathan Tabor · **Module ID:** `T123-KNOWLEDGE-001` · **Root:** TABOR 1-2-3 FACTORY™  
**Status:** executable **LOCAL-ONLY Python application** supplied in this conversation as **`TABOR_ROOT_KNOWLEDGE_CREATION_ENGINE_V1_WORK_BUILD.zip`**. **Not** a publicly hosted app or production Microsoft/AI integration.

## What actually works

The tested ZIP (33 files) contains an original mobile-responsive HTML/JS application and a Python/FastAPI backend with SQLite and FTS5. **44 automated tests passed** at handoff, plus real Office file export/import and separate simulated-browser component checks.

- Eight distinct record types: document, sheet, slides, note, project, research, game and AI configuration.
- Nine safe sample records spread across project namespaces. Originals and legacy IDs remain independent.
- Full-text query; typed, explained provenance graph; optimistic version conflict checks and durable revision snapshots.
- Import DOCX, XLSX, PPTX, TXT, MD (with explicit fidelity limits); independently generate portable DOCX/XLSX/PPTX, JSON and Markdown.
- SHA-256-addressed original binary files **in addition to** parsed records. Backup ZIP includes originals, links and versions; restore checks SHA-256 and refuses to overwrite non-empty data.
- Model/AI execution capability planner: parameters vs Transformers/attention vs compiler adapters vs CPU/GPU/NPU/cloud, *not* a trained model or an executing ONNX engine.
- High-impact payment and publishing endpoints refused by design.
- Mobile layout component QA passed with mocked API. Headless Chromium could not directly navigate to localhost due to environment browser policy. The real API passed separate Python integration tests.

## Full code, not just documentation

Open the **private chat attachment ZIP** in ChatGPT Work; read `WORK_START_HERE.md`, `README.md`, `docs/ARCHITECTURE.md`, `docs/BUILD_STATUS.md`, `docs/API_CONTRACT.md`, and `BUILD_INTEGRITY_MANIFEST.json`.

Run:

```bash
python -m pip install -r requirements.txt
python -m pytest -q
python -m uvicorn server.main:app --host 127.0.0.1 --port 8000
```

Open http://127.0.0.1:8000 **from the same computer**. This is not a stand-alone static GitHub Pages application. Docker Compose binds the exposed port to host loopback only.

**DO NOT DEPLOY THIS LOCAL BUILD PUBLICLY**: no real login or tenant isolation has been built. Public GitHub may carry documentation/contracts only, not private customer data or unreleased source ZIPs.

## Canon: a shared root, not a forced merger

Use independent, stable project IDs and separate original sources for ONE, Nathan AI LET/TET/PPL, TABOR WORLD (including Healers & Protectors), TaborTales, TABOR GPS, TABOR INFINITUM, REMOVE JC, 1420, Project Innocence, ChristmasToyDrive.com, Universal Commerce/Shopify/Kickstarter and any new project. **TW-001 and TW001 are different IDs; ONE technical 101–901 and Factory creative 101–901 are different namespaces.**

Humanity operating engines: EMPATHY (recognize need), SYMPATHY (respect and understand), COMPASSION (perform authorized action and verify). These are ethical design principles, not proof of historical truth.

## Original standards, not unauthorized cloning

- Office compatibility through published Office Open XML, not Microsoft's proprietary application/layout/tenant internals.
- Microsoft Graph drive delta and delegated OAuth are the preferred *future* connector interfaces; **not connected**. Exchange Online EWS is in phased retirement, so no new EWS connector should be built.
- Optional native/on-device AI through properly licensed models and supported adapters such as ONNX Runtime and Core ML; **not running** in this ZIP.
- No claims that FlashAttention reduces attention arithmetic asymptotically to linear time, or that all edge NPUs are INT8-only.

Official docs:
- [Office Open XML formats](https://learn.microsoft.com/office/compatibility/office-file-format-reference)
- [Microsoft Graph driveItem delta](https://learn.microsoft.com/graph/api/driveitem-delta)
- [Exchange Online EWS retirement](https://learn.microsoft.com/en-gb/exchange/clients-and-mobile-in-exchange-online/deprecation-of-ews-exchange-online)
- [ONNX Runtime Execution Providers](https://onnxruntime.ai/docs/reference/high-level-design.html)

## Next build gates

1. Import source ZIP into owner-approved private versioned repository, run all tests and do manual real-device QA.
2. Create authenticated, private, encrypted multi-tenant backend, background sync and tested recovery.
3. Secure all binary imports; source references, editorial review, claim-level evidence, and indexed private data per owner.
4. Implement legitimate provider OAuth, conflict/version and delta-sync handlers behind explicit permission and action confirmation.
5. Expand Office document layout and spreadsheet formula execution **without promising Word/Excel/PowerPoint exact parity**; respect rights and interoperability standards.
6. Implement AI model adapters only on actual hardware with authorized trained weights, verified benchmarks, injection handling and source review.
7. Add end-to-end deployment tests and update `WORK_STATUS.md` based on evidence.

**This README is the public handoff. The full running code is in the conversation ZIP, not in this GitHub folder.**
