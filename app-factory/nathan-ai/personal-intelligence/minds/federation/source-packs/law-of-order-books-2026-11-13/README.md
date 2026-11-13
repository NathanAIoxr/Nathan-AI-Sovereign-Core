# The Law of Order / Books / Renatus — original-source restoration (2026-11-13)

## Source evidence

- [Complete uploaded transcript](./Pasted%20text.txt), **13,361 bytes**, SHA-256 `33e891ded9ceae019cff66d053cc353c6a59d7fe22926805823608276f55314b`.
- [Author-only verbatim statements](./CREATOR_ORIGINALS.txt): three exact creator messages extracted from the uploaded transcript plus the current 2026-11-13 instruction. Spelling, case, punctuation and line contents unchanged.
- The original transcript contains mixed authorship: historical user messages and earlier assistant responses. The entire transcript is preserved without presenting prior assistant responses as Nathan Tabor's original words.
- The earlier assistant's four-step Law of Order summary and attributed wisdom quotation remain classified as *assistant-reported* rather than authenticated original book text.
- The eight catalog identifiers are **publication/edition records**, not a claim of eight distinct manuscripts. Exclude the other Nathan Tabor's children's book.

## ONE Federation v074 data

[Importable additive knowledge pack](../../data/law-of-order-books-2026-11-13.json): 18 records; `4` author-exact; `4` prior-assistant framework summaries; `8` bibliographic variants; `1` mixed transcript record; `1` assistant-attributed quotation. No existing sources are overwritten.

To ingest into the owner's existing **private** ONE Federation SQLite database:

```sh
python3 federation.py --db /path/to/owner-private/ONE_Federation_Master.sqlite3 ingest data/law-of-order-books-2026-11-13.json
python3 federation.py --db /path/to/owner-private/ONE_Federation_Master.sqlite3 run
```

The public GitHub commit does not execute those owner-private database commands. The current connected Airtable **NATHAN AI — ONE MASTER INDEX** receives separately confirmed record writes.
