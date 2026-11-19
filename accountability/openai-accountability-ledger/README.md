# OpenAI accountability ledger

The first case records the handling of Nathan Tabor’s *Root of 0 and 1* material. It retains the original user messages in sequence, selected verbatim assistant responses, documented findings, an open source-recovery issue, and the user’s own account of the harm. Each finding points to applicable messages or sources. GitHub stores the versioned source, schema, and restore script. Cloudflare D1 stores the queryable records under `openai-accountability-ledger`.

The case begins with the Anubis versus Karma request and ends with the request for this database and the assistant’s acknowledgment. Sequence numbers reflect the available conversation order. The case timestamp records compilation. The evidence links identify what was checked at the time. Earlier public accountability records are linked as related sources. The privately archived game and the underlying private source files stay in their owner-held archives.

Statuses are `documented` for findings supported by the attached record, `open` for items whose source or coverage is still unverified, and `user_account` for the user's characterization of events.

## Open a local database

Requires Python 3 and its standard-library SQLite module.

```sh
python3 ledger.py --database openai-accountability.sqlite3
```

Running `python3 ledger.py` creates a temporary in-memory database and verifies all seeded rows and evidence links. Running it again with the same database path verifies the same case without duplicating records. `python3 ledger.py --d1-payload` outputs the parameterized batch for the D1 query API.

## Query the ledger

```sql
SELECT sequence, speaker, quote_kind, body
FROM timeline
WHERE case_id = 'root-0-1-source-accountability'
ORDER BY sequence;

SELECT finding_id, status, finding, evidence_type, attribution, evidence_text, source_url
FROM finding_evidence
WHERE case_id = 'root-0-1-source-accountability'
ORDER BY finding_id, evidence_type, evidence_id;
```
