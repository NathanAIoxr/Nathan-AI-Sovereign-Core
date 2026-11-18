import { endpoint, json, readBytes } from "./shared.mjs";

export default endpoint(38, async (request, url, env) => {
  const match = /^\/items\/([A-Za-z0-9][A-Za-z0-9._:-]{0,159})$/.exec(url.pathname);
  if (!match) return;
  const key = match[1];
  if (request.method === "GET") {
    const value = await env.ITEMS.get(key, "arrayBuffer");
    if (value === null) return json({ error: "not_found" }, 404);
    return new Response(value, { headers: { "content-type": "application/octet-stream", "cache-control": "no-store", "x-content-type-options": "nosniff" } });
  }
  if (request.method === "PUT") {
    await env.ITEMS.put(key, await readBytes(request, 64 * 1024));
    return new Response(null, { status: 204 });
  }
  if (request.method === "DELETE") {
    await env.ITEMS.delete(key);
    return new Response(null, { status: 204 });
  }
  return json({ error: "method_not_allowed" }, 405);
});
