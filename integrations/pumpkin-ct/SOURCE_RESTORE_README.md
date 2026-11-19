# Lossless source recovery and Collyn handoff
The original user wording is the source of truth. Never reconstruct missing messages and call them verbatim.
- `brainstorm_registry.py` stores immutable exact text, SHA-256 and provenance in local SQLite; repeat imports are idempotent.
- Ideas link back to exact source messages and default to UNDECIDED.
- `schema/002_brainstorm_source_registry.sql` is an **unapplied** Cloudflare D1 migration draft.
- Test: `python -m unittest discover -s integrations/pumpkin-ct/tests -v` from repo root.
- Import: `python integrations/pumpkin-ct/brainstorm_registry.py --db scratch.sqlite --import-file original.txt --source-id conversation-001`.
- Export: `python integrations/pumpkin-ct/brainstorm_registry.py --db scratch.sqlite --export archive.json`.
- This code does not imply the original conversation has been fully recovered or that a production database was changed.
