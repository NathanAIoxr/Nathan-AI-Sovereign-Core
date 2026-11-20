import { createHash } from "node:crypto";
import { cp, mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const routes = [
  ["/", "index.html", "text/html; charset=utf-8"],
  ["/retribution.css", "retribution.css", "text/css; charset=utf-8"],
  ["/retribution.js", "retribution.js", "text/javascript; charset=utf-8"],
];

export async function buildWorker() {
  const assets = {};
  for (const [route, filename, type] of routes) {
    const body = await readFile(new URL("public/" + filename, import.meta.url), "utf8");
    assets[route] = { type, body };
  }

  const release = createHash("sha256").update(JSON.stringify(assets)).digest("hex");
  const source = `const assets = ${JSON.stringify(assets)};
const release = ${JSON.stringify(release)};

export default {
  fetch(request) {
    const headers = {
      "cache-control": "no-cache",
      "content-security-policy": "default-src 'self'; base-uri 'none'; object-src 'none'",
      "x-content-type-options": "nosniff",
      "x-app-release": release,
    };

    if (request.method !== "GET" && request.method !== "HEAD") {
      return new Response("Method not allowed", {
        status: 405,
        headers: { ...headers, allow: "GET, HEAD" },
      });
    }

    const path = new URL(request.url).pathname;
    if (path === "/health") {
      const health = JSON.stringify({ ok: true, app: "smack-that-ass", release });
      return new Response(request.method === "HEAD" ? null : health, {
        headers: { ...headers, "cache-control": "no-store", "content-type": "application/json" },
      });
    }

    const route = path === "/index.html" ? "/" : path;
    if (!Object.hasOwn(assets, route)) {
      return new Response(request.method === "HEAD" ? null : "Not found", { status: 404, headers });
    }

    const asset = assets[route];
    return new Response(request.method === "HEAD" ? null : asset.body, {
      headers: { ...headers, "content-type": asset.type },
    });
  },
};
`;
  return { release, source };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const output = new URL("dist/", import.meta.url);
  const { release, source } = await buildWorker();
  await mkdir(output, { recursive: true });
  await writeFile(new URL("worker.mjs", output), source);
  const site = new URL("site/", output);
  await cp(new URL("public/", import.meta.url), site, { recursive: true });
  const health = JSON.stringify({ ok: true, app: "smack-that-ass", release });
  await writeFile(new URL("health.json", site), health + "\n");
  console.log(release);
}
