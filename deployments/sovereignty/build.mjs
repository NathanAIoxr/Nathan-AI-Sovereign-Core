import { mkdir, readFile, writeFile } from "node:fs/promises";

const src = new URL("./src/", import.meta.url);
const files = {
  "/": ["index.html", "text/html; charset=utf-8"],
  "/style.css": ["style.css", "text/css; charset=utf-8"],
  "/app.mjs": ["app.mjs", "text/javascript; charset=utf-8"],
  "/engine.mjs": ["engine.mjs", "text/javascript; charset=utf-8"],
};
const assets = Object.fromEntries(await Promise.all(
  Object.entries(files).map(async ([path, [filename, type]]) => [
    path, { type, body: await readFile(new URL(filename, src), "utf8") },
  ]),
));
const worker = await readFile(new URL("worker.mjs", src), "utf8");
const dest = new URL("./dist/", import.meta.url);
await mkdir(dest, { recursive: true });
await writeFile(new URL("worker.mjs", dest), "const assets = " + JSON.stringify(assets) + ";\n" + worker);
