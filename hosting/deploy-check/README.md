# Nathan AI deployment check

The static starter lives in `site/` and requires no dependencies or build command. Set the publishing directory to `hosting/deploy-check/site` when connecting this branch to a static host.

The Cloudflare Worker serves the same page at `/` and returns JSON at `/api/health`. It has no environment variables or data bindings.

## Local check

```sh
node --input-type=module -e "import worker from './worker.mjs'; const r=await worker.fetch(new Request('https://test.invalid/api/health')); if (!r.ok || !(await r.json()).ok) process.exit(1)"
```
