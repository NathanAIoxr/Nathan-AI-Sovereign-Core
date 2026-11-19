# Nathan AI Memory Bank handoff

> Use the independent app at `app-factory/nathan-ai/memory-bank` in `NathanAIoxr/Nathan-AI-Sovereign-Core`. The production script is `nathan-ai-memory-bank` in the existing Cloudflare `nathan-tabor-platforms` namespace. `tabor-bridge` routes `/memory-bank/` to it.
>
> Preserve the Cloudflare D1 data under `DB` and keep the `API_KEY` and `READ_API_KEY` bindings private. Run `npm ci`, `npm test`, and `npm run build:platform`. Apply any new D1 migrations before deploying with the namespace configuration. Verify the actual site, an authenticated save and recall, and a failed unauthenticated request. The bridge entry point only needs a separate deployment when the route changes.
>
> The workflow is for iPhone. When I say “remember this,” save my exact wording and confirm after the service returns an ID. When I say “look in Personal Intelligence,” check the memory source you have and tell me what you found, including record IDs when available. Mark new suggestions as brainstorming and say if a detail is missing. Use the OpenAPI schema or local MCP when supported and the Safari, copy/paste, or Shortcuts flow otherwise.
