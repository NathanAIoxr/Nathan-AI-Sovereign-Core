# PD-005 — Accessible, text-first graph explorer

Open `index.html` through an HTTP static server at the repository root (e.g. `python3 -m http.server 8000`, then `/creative-archive/persona-duality/explorer/`). Browser ES modules cannot reliably load from `file://`.

The explorer imports the **existing** `../registry.mjs` directly; it does not copy or revise original canon. Search, category filtering, keyboard-accessible selection, explicit edge types/directions, and a local JSON export are supported. All source text is inserted with `textContent` to prevent HTML injection. No third-party assets, tracking, network calls, secrets, images, or face depictions are included.

The original Worker and cron remain unchanged. Publishing this directory on a public web hostname is a **separate deployment decision** and must not be confused with the existing Persona Worker. All records in the export are the same already-public graph fields. Authorship, scripture, folklore, and creative analogy are not asserted to be interchangeable.

Test: `node --test creative-archive/persona-duality/explorer/model.test.mjs`.
