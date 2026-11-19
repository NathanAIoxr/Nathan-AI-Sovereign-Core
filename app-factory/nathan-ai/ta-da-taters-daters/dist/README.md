# TA🪭DA🎉 — Taters & Daters

Public preview: https://ta-da-taters-daters.nathantaboract.workers.dev/

These assets preserve the original [Taters & Daters](https://ta-da-taters-daters.nathantabor.chatgpt.site/) public MIT export. [Original documentation](../README.md) · [MIT license](../LICENSE) · [Original export](source.zip).

Original export SHA-256: `dbeec297a86dce6c92eb864cf62155b5cec935c9b43ea344dfb100ca61e31c05`

## Independent Cloudflare build

This app is deployed to the `ta-da-taters-daters` Worker. Run `node --test check.test.mjs` and `node build.mjs OUTPUT_DIRECTORY` from the app directory. The [app workflow](../../../../.github/workflows/ta-da-taters-daters-build.yml) publishes its own Worker artifact. The build reads assets from this application directory. The Worker upload settings are in `worker-metadata.json`.
