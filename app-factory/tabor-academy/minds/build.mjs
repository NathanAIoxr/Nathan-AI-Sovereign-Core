import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { gzipSync } from "node:zlib";

const here = new URL("./", import.meta.url);
const from = path => readFile(new URL(path, here), "utf8");
const nathan = "../../nathan-ai/";
const shared = nathan + "minds-chat/";
const htmlType = "text/html; charset=utf-8";
const jsType = "text/javascript; charset=utf-8";
const jsonType = "application/json; charset=utf-8";
const assets = {
  "/minds/": [htmlType, (await from("index.html"))
    .replaceAll(shared, "./")
    .replace(nathan + "omni-god/engine.js", "./omni-engine.js")
    .replace('data-assets="./"', 'data-assets="./" data-catalog="catalog.json" data-mirrors="mirror.json"')],
  "/minds/style.css": ["text/css; charset=utf-8", await from(shared + "style.css")],
  "/minds/engine.js": [jsType, await from(shared + "engine.js")],
  "/minds/app.js": [jsType, await from(shared + "app.js")],
  "/minds/sources.json": [jsonType, await from(shared + "sources.json")],
  "/minds/omni-engine.js": [jsType, await from(nathan + "omni-god/engine.js")],
  "/minds/catalog.json": [jsonType, await from(nathan + "personal-intelligence/minds/mind-of-minds/catalog.json")],
  "/minds/mirror.json": [jsonType, await from(nathan + "agents-of-innocence/release-manifest.json")]
};

function createMindsRoutes(assets, release) {
  return function serveAcademyMinds(request, pathname) {
    if (request.method !== "GET" && request.method !== "HEAD") {
      return new Response("Method not allowed", { status: 405, headers: { allow: "GET, HEAD" } });
    }
    if (pathname === "/minds") return new Response(null, { status: 308, headers: { location: "./minds/" } });
    const asset = Object.hasOwn(assets, pathname) && assets[pathname];
    if (!asset) return new Response("Minds page not found", { status: 404 });
    const [type, base64] = asset;
    const headers = {
      "content-type": type,
      "cache-control": "no-cache",
      "content-security-policy": "default-src 'none'; script-src 'self'; style-src 'self'; connect-src 'self'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'",
      "x-content-type-options": "nosniff",
      "x-tabor-minds-release": release
    };
    if (request.method === "HEAD") return new Response(null, { headers });
    const compressed = Uint8Array.from(atob(base64), character => character.charCodeAt(0));
    const body = new Blob([compressed]).stream().pipeThrough(new DecompressionStream("gzip"));
    return new Response(body, { headers });
  };
}

function patchWorker(source, block) {
  const start = "/* BEGIN TABOR ACADEMY MINDS */";
  const end = "/* END TABOR ACADEMY MINDS */";
  const wrappedHandler = "const academyApp = {";
  const originalHandler = "export default {";
  const route = "    const { pathname } = new URL(request.url);";
  const dispatch = '    if (pathname === "/minds" || pathname.startsWith("/minds/")) return serveAcademyMinds(request, pathname);';
  const home = /^const page = (.+);$/m;
  const homeLink = '<p><a href="/tabor-academy/minds/" style="color:#e6cf87">Minds · Nathan AI</a></p>';
  const previousStart = source.indexOf(start);
  const previousEnd = source.indexOf(end);
  if (previousStart !== -1 || previousEnd !== -1) {
    if (previousStart < 0 || previousEnd < previousStart || !source.includes(dispatch) || !source.includes('/tabor-academy/minds/')) {
      throw new Error("Existing Academy Minds release markers are inconsistent");
    }
    return source.slice(0, previousStart) + block + source.slice(previousEnd + end.length);
  }

  const homepage = source.match(home);
  const handler = Math.max(source.lastIndexOf(wrappedHandler), source.lastIndexOf(originalHandler));
  if (!homepage || handler === -1 || !source.slice(handler).includes(route)) {
    throw new Error("Academy homepage or route insertion point was not found");
  }
  const page = JSON.parse(homepage[1]);
  if (!page.includes("</main>")) throw new Error("Academy homepage is missing its main element");
  const amended = source.slice(0, handler).replace(home, () =>
    "const page = " + JSON.stringify(page.replace("</main>", homeLink + "\n</main>")) + ";"
  );
  return amended + block + "\n" + source.slice(handler).replace(route, () => route + "\n" + dispatch);
}

export const release = createHash("sha256").update(createMindsRoutes.toString())
  .update(patchWorker.toString()).update(JSON.stringify(assets)).digest("hex").slice(0, 16);
const encoded = Object.fromEntries(Object.entries(assets).map(([url, [type, text]]) =>
  [url, [type, gzipSync(text).toString("base64")]]
));
const block = [
  "/* BEGIN TABOR ACADEMY MINDS */",
  "const serveAcademyMinds = (" + createMindsRoutes.toString() + ")(" + JSON.stringify(encoded) + ", " + JSON.stringify(release) + ");",
  "/* END TABOR ACADEMY MINDS */"
].join("\n");
export const buildWorker = source => patchWorker(source, block);

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (process.argv[2] === "--patcher") {
    process.stdout.write("(source => (" + patchWorker.toString() + ")(source, " + JSON.stringify(block) + "))");
  } else {
    if (!process.argv[2]) throw new Error("Provide the current Academy Worker source");
    process.stdout.write(buildWorker(await readFile(process.argv[2], "utf8")));
  }
}
