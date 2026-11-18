import { endpoint, json, readBytes, RequestError } from "./shared.mjs";

export default endpoint(39, async (request, url) => {
  if (request.method !== "GET" || url.pathname !== "/raw") return;
  const repo = url.searchParams.get("repo") ?? "";
  const ref = url.searchParams.get("ref") ?? "";
  const path = url.searchParams.get("path") ?? "";
  if (!/^[a-z0-9][a-z0-9-]{0,38}\/[a-z0-9_.-]{1,100}$/i.test(repo) ||
      !/^[a-f0-9]{40}$/i.test(ref) || !path || path.length > 512) throw new RequestError("repo_commit_and_path_required");
  const segments = path.split("/");
  if (segments.some(part => !part || part === "." || part === ".." || /[\\\x00-\x1f]/.test(part))) throw new RequestError("invalid_path");
  const upstream = new URL(`https://raw.githubusercontent.com/${repo}/${ref}/${segments.map(encodeURIComponent).join("/")}`);
  const result = await fetch(upstream, { redirect: "manual", signal: AbortSignal.timeout(6000) });
  if (result.status === 404) return json({ error: "github_file_not_found" }, 404);
  if (!result.ok) return json({ error: "github_unavailable" }, 502);
  return new Response(await readBytes(result, 512 * 1024), { headers: {
    "content-type": "application/octet-stream", "content-disposition": "attachment",
    "cache-control": "public, max-age=3600", "x-content-type-options": "nosniff",
    "content-security-policy": "default-src 'none'; sandbox",
  } });
});
