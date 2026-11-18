import { readdir, readFile, writeFile } from "node:fs/promises";
import { extname, join } from "node:path";
import { gzipSync } from "node:zlib";

const [dist, output] = process.argv.slice(2);
if (!dist || !output) throw new Error("Pass the built upstream dist directory and output filename.");
const client = join(dist, "client");
const worker = await readFile(join(dist, "vite_react_template", "index.js"), "utf8");
const contentTypes = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8", ".svg": "image/svg+xml",
};
const assets = {};
for (const file of await readdir(client, { recursive: true })) {
  const type = contentTypes[extname(file)];
  if (!type) continue;
  assets["/" + file] = { type, gzip: gzipSync(await readFile(join(client, file)), { level: 9 }).toString("base64") };
}
if (!assets["/index.html"]) throw new Error("Upstream build has no index.html.");
const main = worker.trimEnd().replace(/export\s*\{[\s\S]*?as default\s*\};?\s*$/, match => {
  const found = /export\s*\{\s*([\w$]+)\s+as default\s*\}/.exec(match);
  if (!found) throw new Error("Unexpected default export in upstream bundle.");
  return "const upstreamWorker = " + found[1] + ";";
});
if (main === worker.trimEnd()) throw new Error("No upstream default export found.");
await writeFile(output, main + `
const assets = ${JSON.stringify(assets)};
export default {
  async fetch(request, env, ctx) {
    const { pathname } = new URL(request.url);
    if (pathname === "/health" && request.method === "GET") return Response.json({ id: 91, ready: true });
    if (pathname.startsWith("/api/")) return upstreamWorker.fetch(request, env, ctx);
    if (!["GET", "HEAD"].includes(request.method)) return new Response(null, { status: 405, headers: { allow: "GET, HEAD" } });
    const asset = assets[pathname] ?? (!pathname.includes(".") ? assets["/index.html"] : null);
    if (!asset) return new Response(null, { status: 404 });
    const headers = {
      "content-type": asset.type, "x-content-type-options": "nosniff",
      "cache-control": pathname.startsWith("/assets/") ? "public, max-age=31536000, immutable" : "no-cache",
    };
    const body = request.method === "HEAD" ? null :
      new Blob([Uint8Array.from(atob(asset.gzip), character => character.charCodeAt(0))]).stream().pipeThrough(new DecompressionStream("gzip"));
    return new Response(body, { headers });
  },
};
`);
