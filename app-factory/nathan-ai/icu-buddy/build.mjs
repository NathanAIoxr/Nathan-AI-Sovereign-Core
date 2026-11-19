import { createHash } from "node:crypto";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { basename, dirname, extname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const directory = dirname(fileURLToPath(import.meta.url));
const { entry, id, worker } = JSON.parse(await readFile(resolve(directory, "app.json"), "utf8"));
const code = await readFile(resolve(directory, "worker.mjs"), "utf8");
const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".zip": "application/zip",
};
const output = resolve(process.argv[2] ?? "./build-output");
await mkdir(output, { recursive: true });

const source = resolve(directory, dirname(entry));
const paths = (await readdir(source)).filter(name => Object.hasOwn(types, extname(name)))
  .map(name => resolve(source, name));
if (!paths.includes(resolve(directory, entry))) throw new Error(`Missing entry for ${id}`);

const assets = {};
for (const path of paths.sort()) {
  const bytes = await readFile(path);
  assets[`/${basename(path)}`] = {
    type: types[extname(path)],
    etag: `"${createHash("sha256").update(bytes).digest("hex")}"`,
    body: bytes.toString("base64"),
  };
}
const release = createHash("sha256").update(code).update(JSON.stringify(assets)).digest("hex").slice(0, 16);
const site = { id, worker, release, assets };
const module = `${code}\nconst site = ${JSON.stringify(site)};\nexport default { fetch: request => serve(request, site) };\n`;
await writeFile(resolve(output, `${worker}.mjs`), module);
console.log(`${worker}: ${release} (${Object.keys(assets).length} files)`);
