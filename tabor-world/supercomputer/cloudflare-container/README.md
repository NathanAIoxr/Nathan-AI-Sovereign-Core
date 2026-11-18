# Tabor Linux Server — Cloudflare Containers

This is a genuine Linux HTTP server process (Python) packaged as a Docker image, hosted on Cloudflare Containers. It does not require DigitalOcean, AWS, or another origin host.

- `GET /edge-health` checks the Worker entrypoint.
- `GET /health` routes through a Durable Object into the actual Linux container.
- `POST /compute/sha256` performs bounded CPU work after authorization.
- Maximum configured container instances: 1, to avoid unapproved scale-out.
- No dedicated physical machine ownership, no exaflop performance claim.

## Deployment
Cloudflare Containers requires account eligibility and paid Workers plan. In this project folder, run `npm install`, set a secure `TABOR_SERVER_TOKEN` Worker secret, then `npx wrangler deploy` with Docker available or through Workers Builds. Verify `GET /health` and container instance state, not just Worker deployment. Cloudflare's container platform may bill for running instances.

GitHub source and Cloudflare runtime are intentionally separate from earlier `nathan-tabor-cloud-server` Worker so existing services are not overwritten.
