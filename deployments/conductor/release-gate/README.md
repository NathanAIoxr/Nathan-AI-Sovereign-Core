# Nathan AI Conductor · Lasso of Truth Release Gate

[Live gate health](https://unified-operations-cockpit.nathantaboract.workers.dev/tabor-sites/conductor/api/release-gate/health) · [Sovereign MIND evidence](../sovereign-minds/) · [Existing Lasso prompts](../sovereign-minds/PROMPTS.md)

**1 releases one exact candidate. 0 discards the staged candidate and returns a reason.** Route binary, algorithm, LLM, human and import output through the same policy before indexing, publishing, or delivery. The Worker evaluates bounded input in memory and writes no source documents or rejected payloads. The local adapter creates a new file only on a successful decision. Independent originals and historical evidence remain in their source stores.

## One request contract

A candidate is a JSON object with seven fields.

| Field | Value |
| --- | --- |
| `id` | Stable ID for this candidate |
| `producer` | `binary`, `algorithm`, `llm`, `human` or `import` |
| `kind` | `artifact`, `fact`, `quotation`, `authored`, `interpretation`, `unknown`, `counterfactual` or `absence` |
| `action` | `index`, `publish` or `deliver` |
| `destination` | Logical ID of the intended destination |
| `encoding`, `payload` | Canonical `base64` or `utf8` with a payload. For unknowns, counterfactuals and absence use `none` and `null`. |

A null-payload marker records the stated evidence status for its ID. It grants no authority to convert missing information into fact. Facts, quotations, and claims of absence require reviewed source digests. Exact quotation verification and evidence classifications are provided by the [Sovereign MIND Lasso](../sovereign-minds/).

## Conductor flow

Routes are relative to `/tabor-sites/conductor`.

1. An authenticated operator uses `POST /cheironomer/operator/release-gate/attest` with a JSON body of `{candidate, review}`. Use the Cheironomer Cloudflare Access session. The operator confirms `protectsInnocence`, `honest`, and `authorized` as booleans and lists up to eight SHA-256 source digests in `sources`. Review the real material and destination, ensure consent and scope, and use the cited evidence to confirm factual claims. A producer cannot attest its own output through the evaluation route.
2. The operator receives a signed permit bound to the exact bytes, semantic kind, producer, action and destination for 15 minutes. Changes to any of these require fresh review. Permits are reusable within that scope and time for retries.
3. The producer calls `POST /api/release-gate/evaluate` using JSON `{candidate, permit}`. Continue only on HTTP 200 and `bit: 1`. A missing permit, mismatch, expiry, or failed check is a `0`; stop that release and discard the staged copy. For local file output use the gated adapter:

```sh
node deployments/conductor/release-gate/release-local.mjs result.bin intended-destination < staged-request.json
```

A signed permit records the authenticated review and binds its receipt to bytes. Reviewers supply the judgment that a thing protects innocence or is honest. Callers implement delivery with their own authorized sinks. Connect each producer at its release boundary for enforcement.

## 12-Line protection for local releases

The local adapter applies Nathan Tabor's 12-Line structure to the decision to write approved data. It uses the existing Lasso review and permit. A failed line blocks the write. Each check appears in order in the JSON receipt, with its result recorded as pass, block, or skipped.

| Lines | Checks |
| --- | --- |
| 1–4 | Bound the request, validate the envelope, reconstruct canonical bytes, and match the intended destination. |
| 5–6 | Allow a single `.txt`, `.json`, or `.bin` extension. Check text/JSON or screen binary input for common executable and archive signatures. |
| 7–10 | Require a successful decision from the HTTPS gate, check receipt scope and digest, and require an unexpired permit immediately before creating the file. |
| 11–12 | Stage mode-`0600` bytes in the trusted owner's POSIX directory and atomically create a new file. A competing writer or an existing path wins over the staged file. |

Use a destination directory owned by the release operator, without group or other write access. The operator selects the local path and passes the intended logical destination. Treat released binary files as data. These checks cover this file-write path. Device-wide malware detection and other application writes require their own protection.

Run `node --test deployments/conductor/release-gate/*.test.mjs deployments/conductor/sovereign-minds/sovereign-minds.test.mjs`.

Set `LASSO_GATE_SIGNING_KEY` via the Conductor's encrypted Worker secrets. A content-only Cloudflare deploy sets the gate build ID for the readiness check. Deployment through Wrangler can set `LASSO_GATE_RELEASE` as a plain variable. Keep the signing key in Cloudflare, and keep permits out of logs and public files.
