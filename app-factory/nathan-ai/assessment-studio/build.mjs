import { createHash } from "node:crypto";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { extname, resolve } from "node:path";

const read = path => readFile(new URL(path, import.meta.url));
const { id, worker } = JSON.parse(await read("./app.json"));
const types = { ".html": "text/html", ".css": "text/css", ".mjs": "text/javascript" };
const code = await read("./worker.mjs");
const assets = {};
for (const name of (await readdir(new URL("./public/", import.meta.url))).sort()) {
  const type = types[extname(name)];
  if (!type) continue;
  let bytes = await read("./public/" + name);
  if (name === "index.html") {
    const html = bytes.toString("utf8")
      .replace(/  <!-- github-pages-shell:start -->[\s\S]*?  <!-- github-pages-shell:end -->\n/, "")
      .replace(/<aside id="nathan-record-notice"[\s\S]*?<\/aside>/, notice => notice.replace(/ style="[^"]*"/g, ""))
      .replace('href="../../../../docs/record/index.html"', 'href="https://nathanaioxr.github.io/Nathan-AI-Sovereign-Core/docs/record/"');
    bytes = Buffer.from(html);
  }
  assets["/" + name] = {
    type: type + "; charset=utf-8",
    etag: JSON.stringify(createHash("sha256").update(bytes).digest("hex")),
    body: bytes.toString("base64"),
  };
}
const release = createHash("sha256").update(code).update(JSON.stringify(assets)).digest("hex").slice(0, 16);
const output = resolve(process.argv[2] ?? "./build-output");
await mkdir(output, { recursive: true });
await writeFile(resolve(output, worker + ".mjs"), code + "\nconst site = " + JSON.stringify({ id, release, assets }) +
  ";\nexport default { fetch: request => serve(request, site) };\n");
console.log(release);
