# Sovereign Conductor — secure bootstrap

This is a bounded, authenticated Custom GPT Action endpoint and D1 job ledger using the **existing** tabor-fleet-registry. It does not take arbitrary shell commands, URLs, GitHub file contents, or SQL from a model. No full-account Cloudflare token is needed; use narrowly scoped, revocable tokens. GitHub Apps with repository-scoped permissions are preferred to long-lived PATs.

## Current state
Source and validation workflow committed on integration branch. NOT deployed to Cloudflare. The account already had 500 deployed Worker scripts when checked, so provision no new script without confirming capacity or selecting an existing Worker to update. Existing deployed applications must not be overwritten.

## Setup
1. Deploy only after reviewing an existing script integration or available capacity.
2. Configure `DISPATCH_TOKEN` as a Worker secret and `GITHUB_TOKEN` only when GitHub integration is implemented. Never place tokens in code, URLs, or logs.
3. Replace the placeholder OpenAPI server URL with a verified deployed endpoint.
4. Dispatch creates an unapproved D1 job. Explicit approval, project-specific workflow, build, smoke test, and receipt callback must be added before production release.

## Correctness
- A queued job is not deployed.
- A GitHub commit is not a successful build.
- A successful build is not a verified Cloudflare release.
- Mark DONE only after deployment and endpoint verification.
