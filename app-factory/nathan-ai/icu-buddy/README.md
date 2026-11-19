# BUDDY AI 🌀 — THE iCU ❤️ APP

Public preview: https://icu-buddy.nathantaboract.workers.dev/

This browser companion reconstructs the reflective drafting portion of the relationship advisor proposed for Taters & Daters. It uses editable templates and processes notes locally. The earlier Swift project source and a native build were not recovered.

## Independent Cloudflare build

This app is deployed to the `icu-buddy` Worker. Run `node --test check.test.mjs` and `node build.mjs OUTPUT_DIRECTORY` from the app directory. The [app workflow](../../../.github/workflows/icu-buddy-build.yml) publishes its own Worker artifact. The build reads assets from this application directory. The Worker upload settings are in `worker-metadata.json`.
