# Tabor Academy
Independent Tabor Academy staging project. The author’s supplied design lives in SPECIFICATION.md. The original email reference is kept in the source conversation.

## Run locally
Use Node.js 24 or later. Run `npm test` and `npm run dev`, then open http://127.0.0.1:8272. The server uses SQLite and a local private recording directory. Browser live speech recognition depends on the browser and system settings. Device dictation and text are also supported. The deployed Worker can transcribe a saved recording when browser live recognition is unavailable and automatic transcription is enabled.

## Cloudflare
Run `npm run build` to produce the three Worker modules in dist/. Use worker.mjs as the ESM entry. Apply migrations/0001_library.sql to an independent D1 database. Set the bindings DB (D1), AUDIO (private R2), AI (Workers AI), VECTORS (Vectorize cosine index with 384 dimensions), and ENVIRONMENT (staging). Pending catalog, phonetic, evidence, and vector indexes are retried when that workspace opens. A standalone Worker can also run the scheduled handler. Only approved published entries go into the semantic index. Recordings and transcripts stay in the browser workspace. Review the recordings before treating generated text as verbatim.

## Source entries and Phonetics
Enter one annotation per line in the form `word — IPA or source-backed root`. The word index preserves the transcript and associates entries when pronunciation and origin are supplied. Classification codes are assigned by the workspace user and the app groups by those codes. Source references are added by the user. No corpus copies or third-party credentials are required.

## Publication
The learner-facing catalog contains entries that passed both binary checks and received explicit sharing approval in the workspace. Use Withdraw from archive to remove an entry from that catalog. The deployed dispatch entry uses dispatch.mjs to retain the holding page and protect /workspace/ with a Cloudflare Access assertion. Set ACCESS_ISSUER and ACCESS_AUDIENCE for the scoped staging application. Editing a published item saves its revised draft and withdraws the old version until it passes publication again.
