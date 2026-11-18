import { WorkflowEntrypoint } from "cloudflare:workers";
import { endpoint, json, readJson, RequestError } from "./shared.mjs";

export class TaborDigestWorkflow extends WorkflowEntrypoint {
  async run(event, step) {
    const normalized = await step.do("normalize text", () => event.payload.text.normalize("NFC").trim());
    return step.do("compute digest", async () => {
      const bytes = new TextEncoder().encode(normalized);
      const hash = new Uint8Array(await crypto.subtle.digest("SHA-256", bytes));
      return { bytes: bytes.length, sha256: Array.from(hash, byte => byte.toString(16).padStart(2, "0")).join("") };
    });
  }
}

export default endpoint(43, async (request, url, env) => {
  if (request.method === "POST" && url.pathname === "/runs") {
    const { text } = await readJson(request);
    if (typeof text !== "string" || !text.trim() || text.length > 4096) throw new RequestError("invalid_text");
    const run = await env.DIGEST.create({ params: { text } });
    return json({ id: run.id }, 202);
  }
  const match = /^\/runs\/([a-zA-Z0-9_-]{1,100})$/.exec(url.pathname);
  if (request.method !== "GET" || !match) return;
  const run = await env.DIGEST.get(match[1]);
  return json(await run.status());
});
