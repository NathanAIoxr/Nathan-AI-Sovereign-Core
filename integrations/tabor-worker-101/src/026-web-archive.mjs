import { endpoint, json, readBytes, RequestError } from "./shared.mjs";

export default endpoint(26, async (request, url, env) => {
  if (!["GET", "POST"].includes(request.method)) return;
  if (request.method === "POST" && url.pathname === "/snapshots") {
    let source;
    try { source = new URL(request.headers.get("x-source-url")); } catch { throw new RequestError("source_url_required"); }
    if (source.protocol !== "https:" || source.username || source.password) throw new RequestError("invalid_source_url");
    source.hash = "";
    const data = await readBytes(request, 1024 * 1024);
    if (!data.length) throw new RequestError("empty_snapshot");
    const { searchParams } = source;
    if (searchParams.size) throw new RequestError("source_url_query_not_allowed");
    const key = "snapshots/" + crypto.randomUUID();
    const digest = Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", data)), byte => byte.toString(16).padStart(2, "0")).join("");
    await env.ARCHIVE.put(key, data, { customMetadata: { source: source.href.slice(0, 1024), sha256: digest } });
    return json({ id: key.split("/")[1], bytes: data.length, sha256: digest }, 201);
  }
  const match = /^\/snapshots\/([a-f0-9-]{36})$/.exec(url.pathname);
  if (request.method !== "GET" || !match) return;
  const entry = await env.ARCHIVE.get("snapshots/" + match[1]);
  if (!entry) return json({ error: "not_found" }, 404);
  return new Response(entry.body, { headers: {
    "content-type": "application/octet-stream", "content-disposition": "attachment",
    "cache-control": "no-store", "x-content-type-options": "nosniff",
    "x-sha256": entry.customMetadata.sha256,
  } });
});
