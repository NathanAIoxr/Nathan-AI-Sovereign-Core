export function json(value, status = 200) {
  return Response.json(value, { status, headers: { "cache-control": "no-store", "x-content-type-options": "nosniff" } });
}

export function endpoint(id, handler) {
  return {
    async fetch(request, env, ctx) {
      const url = new URL(request.url);
      if (request.method === "GET" && url.pathname === "/health") return json({ id, ready: true });
      try {
        return await handler(request, url, env, ctx) ?? json({ error: "not_found" }, 404);
      } catch (error) {
        if (error instanceof RequestError) return json({ error: error.message }, error.status);
        return json({ error: "operation_failed" }, 502);
      }
    },
  };
}

export class RequestError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

export async function readBytes(request, limit) {
  if (!request.body) return new Uint8Array();
  if (Number(request.headers.get("content-length")) > limit) throw new RequestError("body_too_large", 413);
  const reader = request.body.getReader();
  const buffer = new Uint8Array(limit);
  let offset = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value.byteLength > limit - offset) {
      await reader.cancel();
      throw new RequestError("body_too_large", 413);
    }
    buffer.set(value, offset);
    offset += value.byteLength;
  }
  return buffer.subarray(0, offset);
}

export async function readJson(request, limit = 8192) {
  const bytes = await readBytes(request, limit);
  try {
    const value = JSON.parse(new TextDecoder().decode(bytes));
    if (value === null || Array.isArray(value) || typeof value !== "object") throw new Error();
    return value;
  } catch {
    throw new RequestError("invalid_json_object");
  }
}
