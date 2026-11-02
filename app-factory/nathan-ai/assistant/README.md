# Nathan AI · Source-grounded assistant

Open **Assistant** from Nathan AI's main navigation or **Ask Nathan AI** from the hub. This is a new source-first app component; it does not replace or reconstruct the owner-held Thinker/LET/TET/PPL package or its canonical grammar.

## What works without a model

Load the existing public catalogs, ask a specific question, and inspect ranked original passages with source IDs and stages. The current nine JSON catalogs yield 10,630 records. Source mode quotes retrieved passages; it does not synthesize an answer with an LLM. A second response mode adds a clearly separated next-step checklist. If nothing matches, the assistant reports that rather than inventing an answer.

The coin/life graph and saved research are searched only after **Include my local…** is selected. Namespaced records retain their source stages and local/private flag. Coin symbols are searchable. The local checkbox resets on page load, while deliberately saved conversation excerpts remain visible in that saved conversation.

Conversation history stays in memory until **Save conversation on this device**. Save detects stale tabs; import validates a complete backup before replacing the in-memory conversation and never overwrites saved storage until Save is chosen. Export/restore preserve literal questions, answers and source excerpts. Clear requires confirmation. Local browser storage is not encrypted or multi-user account storage; keep exports private.

## Optional model adapter

Run from the repository root:

```
python3 -B app-factory/nathan-ai/assistant/server.py --port 8002
```

The server binds only to loopback and serves the existing static app plus `/api/nathan/status` and `/api/nathan/draft`. It is a single-owner development adapter, not a publicly deployable authenticated multi-tenant service. Host/origin/content-type checks, body limits, static-file boundaries and restricted operations are enforced. Hidden files, Python source and paths outside the repository are not served. No directory listings are exposed.

The adapter expects these server-side environment bindings, configured securely outside source files:

- `NATHAN_MODEL_URL`: full HTTPS OpenAI-compatible chat-completions endpoint, without embedded credentials/query parameters.
- `NATHAN_MODEL_NAME`: provider model identifier.
- `NATHAN_MODEL_KEY`: provider credential, available only to the server process.

No values are supplied or saved by this task. All three bindings are absent in the inspected environment, so live inference remains unconfigured. Status says configured, not connected; a successful draft is needed to demonstrate access. Existing process proxy/TLS configuration is preserved through urllib. Redirects are refused so an authorization header is not forwarded to a different destination. Provider errors are sanitized and requests/source text are not logged.

For a configured adapter, the browser still requires a model checkbox and a reviewed-context second click. Only the current question and up to five displayed excerpts are sent—not the entire graph, archive or conversation. Changing the question or local-context selection resets review. A request may incur provider charges. Cancellation stops waiting in the browser but cannot guarantee a provider has not processed an already-sent request.

The provider receives source passages as untrusted data and has no tools. It must return JSON with a plain-text answer and source IDs from the provided set. Unknown citations or malformed responses fail without adding a conversation turn. Text is rendered literally; no HTML execution occurs. Prompt framing and citation validation do not prove factual correctness or eliminate prompt-injection risks. Inspect cited originals before acting.

Recognizable credential payloads (private-key blocks, common token shapes and explicit credential assignments) are rejected before source retrieval, persistence and model submission. This is best-effort detection, not a complete secret scanner; never enter credentials into questions or source notes. Server credentials are never sent to the browser. The adapter cannot execute transactions, trades, scripts, deployments or external writes.

## Tests

```
node --test app-factory/nathan-ai/assistant/engine.test.cjs
python3 -B -m unittest discover -s app-factory/nathan-ai/assistant -p 'test_*.py'
```

Tests cover retrieval/provenance, local context, literal conversation round trips, credential-pattern rejection, stale saves, local API boundaries, no-model behavior, redirect refusal and invalid provider citations. Provider requests are mocked in tests. Chromium checks cover real catalog retrieval, private-context opt-in, coin questions, save/reload/export/restore, reviewed-context consent reset, mocked model response/error handling and a 390px layout. No live provider inference was performed.
