import { readdir, readFile, writeFile, mkdir } from "node:fs/promises";
import { resolve, extname } from "node:path";
import { build } from "esbuild";

const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".csv": "text/csv; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
};
const paths = await readdir("public", { recursive: true, withFileTypes: true });
const assets = {};
for (const file of paths) {
  if (!file.isFile()) continue;
  const parent = file.parentPath ?? file.path;
  const type = types[extname(file.name)];
  if (!type) throw new Error("Unexpected static asset " + file.name);
  const path = [parent.slice("public".length), file.name].join("/");
  assets[path] = [await readFile(resolve(parent, file.name), "utf8"), type];
}

const app = await build({ entryPoints: ["public/app.js"], bundle: true, write: false, format: "esm",
  platform: "browser", legalComments: "inline", minify: true });
assets["/app.js"] = [app.outputFiles[0].text, types[".js"]];
const html = assets["/index.html"][0];
const inlineData = assets["/exports/blueprints.json"][0].replaceAll("<", "\\u003c");
const offline = html.replace(/<link[^>]+(?:stylesheet|preconnect|manifest)[^>]*>/gi, "")
  .replace('<script src="/app.js" type="module"></script>', "")
  .replace("</head>", "<style>" + assets["/phase2.css"][0] + "</style></head>")
  .replace("</body>", "<script>globalThis.ACADEMY_OFFLINE=" + inlineData + "</script>" +
    '<script type="module">' + assets["/app.js"][0].replace(/<\/script/gi, "<\\/script") + "</script></body>");
assets["/tabor-academy-offline.html"] = [offline, types[".html"]];

const source = `import legacy from "./worker/index.js";
const assets = ${JSON.stringify(assets)};
const staticAssets = {
  fetch(request) {
    let p = new URL(request.url).pathname;
    if (p === "/curriculum") return Response.redirect(new URL("/curriculum/", request.url), 308);
    if (p.endsWith("/")) p += "index.html";
    if (!Object.hasOwn(assets,p)) return new Response("Not found", {status:404});
    if (request.method !== "GET" && request.method !== "HEAD") return new Response("Use GET", {status:405});
    const [body,type] = assets[p];
    return new Response(request.method==="HEAD"?null:body,{
      headers:{"Content-Type":type,"Cache-Control":"no-cache","X-Content-Type-Options":"nosniff"}
    });
  }
};
export default {
  fetch(request, env, ctx) {
    const bindings = Object.create(env);
    Object.defineProperty(bindings, "ASSETS", {value:staticAssets});
    return legacy.fetch(request,bindings,ctx);
  }
};`;
await mkdir(".build/direct", { recursive: true });
await build({ stdin: { contents: source, sourcefile: "direct-pages.mjs", resolveDir: process.cwd() },
  outfile: ".build/direct/_worker.js", format: "esm", bundle: true, platform: "browser", minify: true });
await writeFile(".build/direct/_routes.json", JSON.stringify({ version: 1, include: ["/*"], exclude: [] }));

await writeFile(".build/direct/tabor-academy-offline.html",offline);
