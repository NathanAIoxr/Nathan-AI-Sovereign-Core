# Relationship Intent Clarifier · Act AI

Public preview: https://relationship-intent-clarifier.nathantaboract.workers.dev/

This browser implementation reconstructs the July 22, 2025 Relationship Intent Clarifier and selected Act AI boundary behavior. The historical work included `life_intent_clarifier.py` and an in-memory FastAPI prototype. The original source bytes were not recovered. This implementation compares two sample intents and models a participant block and an expired conversation window.

## Independent Cloudflare build

This app is deployed to the `relationship-intent-clarifier` Worker. Run `node --test check.test.mjs` and `node build.mjs OUTPUT_DIRECTORY` from the app directory. The [app workflow](../../../.github/workflows/relationship-intent-clarifier-build.yml) publishes its own Worker artifact. The build reads assets from this application directory. The Worker upload settings are in `worker-metadata.json`.
