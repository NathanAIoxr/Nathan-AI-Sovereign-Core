# Nathan Tabor Super Computer

Cloudflare Worker control plane for Build, Clear, Integrate and Verify. The project links point to existing systems. This deployment runs classical computation and does not depend on a home computer.

## Deploy

Use `worker.mjs` as the module entry point. Bind the `tabor-autonomous-builds` D1 database as `DB`, apply `schema.sql`, and configure the `*/2 * * * *` UTC Cron Trigger. Set `MCP_TOKEN` as a Worker secret and supply it as an Authorization bearer header from a compatible MCP client. ChatGPT custom connector registration requires a supported authentication setup. This bridge does not implement OAuth discovery.

The stateless HTTPS endpoint is `/mcp`. Send JSON-RPC 2.0 requests with `Content-Type: application/json` and `Accept: application/json, text/event-stream`. Initialize, then call `tools/list`. The queue tools are `add_build_task`, `check_queue_status` and `read_d1_logs`. Keep the same `request_id` and arguments when retrying a submission. Use non-sensitive inputs.

The scheduled handler leases one job per invocation. Matrix jobs accept a JSON string containing keys `a` and `b`, each holding two rows of two integers. Digest jobs hash the input and its reversal by Unicode code point. Use an empty input string for the four arithmetic operations.

## Generated modules

`build_module` takes a short project brief. OpenAI generates a title and summary. The Worker serializes those values as a static JavaScript data export and publishes it under `supercomputer/generated/` on the dedicated `generated/supercomputer-cards` branch. The Worker never evaluates model output. The branch is for review and is not a production deployment source.

Set `GITHUB_BRANCH` to `generated/supercomputer-cards` and configure Worker secrets `OPENAI_API_KEY` and `GITHUB_TOKEN` to enable it. The GitHub credential needs contents write access to NathanAIoxr/Nathan-AI-Sovereign-Core. Optional variable `OPENAI_MODEL` overrides the default model. Configure the credentials and submit a test job before relying on publication.
