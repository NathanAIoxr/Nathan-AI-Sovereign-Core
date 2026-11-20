# Project readers

Eleven read-only readers are deployed in Cloudflare Workers for Platforms. Each reader binds one existing project D1 database. The Pumpkin Patch reader uses the existing sandbox namespace with its own D1 binding. The Worker reads the allowlisted public GitHub manifest at an exact commit and selects project identity, stage, alias and fixture count where available. GitHub pins can be refreshed by updating the project's READER_CONFIG deployment binding.

`GET /health` identifies the component. `GET /integration-candidates` requires the operator credential in READER_KEY and a configured dispatch entry point. The route returns evidence and recommendations. It makes no application changes. No polling schedule or automatic integration is configured.

[first-pass.json](first-pass.json) is the first live data comparison, run directly through GitHub and D1. Nine project identities can be linked to the zone catalog. TAP THAT Arcade and TAP THAT Command Center each have a HOLDING app row and a REHEARSAL catalog row. Identify which table owns each stage before mapping either to a single release state. The report includes the GitHub revision and D1 table for each finding. Catalog candidates are identity links and do not establish code-level compatibility or production readiness.
