import { DurableObject } from "cloudflare:workers";
import { endpoint, json, readJson, RequestError } from "./shared.mjs";

const CAPACITY = 30;
const WINDOW_MS = 60_000;

export class RateBucket extends DurableObject {
  async consume() {
    return this.ctx.storage.transaction(async txn => {
      const now = Date.now();
      const record = await txn.get("bucket");
      const tokens = record ? Math.min(CAPACITY, record.tokens + Math.max(0, now - record.time) * CAPACITY / WINDOW_MS) : CAPACITY;
      const allowed = tokens >= 1;
      const remaining = allowed ? tokens - 1 : tokens;
      await txn.put("bucket", { tokens: remaining, time: now });
      return { allowed, remaining: Math.floor(remaining), retryAfter: allowed ? 0 : Math.max(1, Math.ceil((1 - tokens) * WINDOW_MS / CAPACITY / 1000)) };
    });
  }
}

export default endpoint(68, async (request, url, env) => {
  if (request.method !== "POST" || url.pathname !== "/consume") return;
  const { key } = await readJson(request, 1024);
  if (typeof key !== "string" || !/^[a-zA-Z0-9_.:-]{1,120}$/.test(key)) throw new RequestError("invalid_key");
  const result = await env.RATE_BUCKETS.getByName(key).consume();
  const response = json(result, result.allowed ? 200 : 429);
  if (!result.allowed) response.headers.set("retry-after", String(result.retryAfter));
  return response;
});
