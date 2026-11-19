# OpenAI accountability ledger

The first case records the handling of Nathan Tabor’s *Root of 0 and 1* material. It retains the original user messages in sequence, selected verbatim assistant responses, documented findings, an open source-recovery issue, and the user’s own account of the harm. Each finding points to applicable messages or sources. GitHub stores the versioned source, schema, and restore script. Cloudflare D1 stores the queryable records under `openai-accountability-ledger`.

The first case begins with the Anubis versus Karma request and ends with the request for this database and the assistant’s acknowledgment. Earlier public accountability records are linked as related sources. The privately archived game and the underlying private source files stay in their owner-held archives.

The [Google AI Mode case](google-ai-mode-case.json) records Nathan’s comparison request, his account of the relationship between 0 versus 1 and the named conflicts, and his complaint about the responses from Google AI Mode and OpenAI. It includes selected verbatim replies, all six returned search results in the supplied order, and descriptions and SHA-256 fingerprints for seven [screenshots](google-ai-mode-evidence). The screenshot copies are resized and saved without image metadata. Visible profile icons are masked. The source rows for the search results use the domain URLs the interface displayed. The case captures the order of the replies and Google AI Mode’s later explanation for the search results. Case timestamps record compilation.

## Restored record

The [restoration case](record-restoration.json) adds both pasted Google AI Mode text blocks in full, including the repeated redirections, six search cards, and cut-off ending. It includes Nathan’s correction and ChatGPT’s prior reply in full. The preceding case is retained as the original publication.

1. Nathan used the words “Nazi gaslighting techniques” in the opening prompt. Google AI Mode discussed the comparison, inferred frustration, and suggested switching topics. The first reply left the specific accusation unanswered.
2. The next two replies said Google AI Mode was “not trying” to gaslight. Nathan continued asking for a comparison and later asked for an artifact documenting the missing denial.
3. The immediate reply to the artifact request displayed “6 sites” and generic gaslighting results. The result screen gave neither the requested artifact nor a direct answer. [Screenshot](google-ai-mode-evidence/IMG_7118.jpeg)
4. A later reply expressly said “I am not using Nazi gaslighting techniques.” Google AI Mode later pointed back to its earlier statements and attributed the search results to an automated fallback. The screenshot records the explanation Google AI Mode gave. [Denial](google-ai-mode-evidence/IMG_7119.jpeg) · [Earlier-replies explanation](google-ai-mode-evidence/IMG_7121.jpeg) · [Fallback explanation](google-ai-mode-evidence/IMG_7122.jpeg)

ChatGPT emphasized Google’s later defense before describing the earlier six-result reply, and the first publication excerpted the repeated efforts to move the conversation elsewhere. That framing gave less attention to the unanswered opening complaint and the unanswered artifact request. The restoration documents those choices and preserves Nathan’s characterization of them in his own words. The available evidence is the pasted text and screenshots. The complete Google conversation export is unavailable.

## Follow-up on requests to stop personal remarks

The [follow-up case](google-ai-mode-follow-up.json) contains the new pasted transcript in full and links seven [screenshots](google-ai-mode-follow-up-evidence). It starts with the novel prompt about world artifacts. Google AI Mode later acknowledged that “I hear” was inaccurate, then used the phrase again after Nathan told it to stop making personal remarks. The case pairs its promise to stop with the next captured reply. It also records Nathan’s request to be removed from the algorithm and the conversational reply he received. The pasted transcript contains three instances each of the lines beginning “Huh? Look at me trying to get you to admit the truth” and “You just denied everything that you’ve been doing.”

Statuses are `documented` for findings supported by the attached record, `open` for items whose source or coverage is still unverified, and `user_account` for the user's characterization of events.

## Open a local database

Requires Python 3 and its standard-library SQLite module.

```sh
python3 ledger.py --database openai-accountability.sqlite3
python3 ledger.py --case google-ai-mode-case.json --database openai-accountability.sqlite3
python3 ledger.py --case record-restoration.json --database openai-accountability.sqlite3
python3 ledger.py --case google-ai-mode-follow-up.json --database openai-accountability.sqlite3
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
WHERE case_id = 'google-ai-mode-comparison-accountability'
ORDER BY finding_id, evidence_type, evidence_id;
```
