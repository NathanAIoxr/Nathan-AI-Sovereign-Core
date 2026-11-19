import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";

const publicDir = new URL("../public/", import.meta.url);
const dist = new URL("../dist/", import.meta.url);
const html = "text/html; charset=utf-8";
const js = "application/javascript; charset=utf-8";
const routes = {
  "/": ["index.html", html],
  "/app": ["app.html", html],
  "/game": ["game.html", html],
  "/book": ["book.html", html],
  "/book.pdf": ["book.pdf", "application/pdf"],
  "/app.mjs": ["app.mjs", js],
  "/engine.mjs": ["engine.mjs", js],
  "/sw.js": ["sw.js", js],
  "/style.css": ["style.css", "text/css; charset=utf-8"],
  "/manifest.webmanifest": ["manifest.webmanifest", "application/manifest+json"],
  "/icon-192.png": ["icon-192.png", "image/png"],
  "/icon-512.png": ["icon-512.png", "image/png"]
};
const assets = Object.fromEntries(await Promise.all(Object.entries(routes).map(async ([route, [file, type]]) => {
  const contents = await readFile(new URL(file, publicDir));
  const digest = createHash("sha256").update(contents).digest("hex");
  return [route, { type, content: contents.toString("base64"), digest }];
})));
const source = await readFile(new URL("../worker.mjs", import.meta.url), "utf-8");
await mkdir(dist, { recursive: true });
await writeFile(new URL("worker.mjs", dist), "const assets = " + JSON.stringify(assets) + ";\n" + source);
