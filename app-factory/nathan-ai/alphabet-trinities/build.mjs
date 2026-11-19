import { createHash } from "node:crypto";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { extname, resolve } from "node:path";
import { namespace, units } from "./units.mjs";
import { queryEntries, records } from "./public/common/tools.mjs";

const types = {
  ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8", ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json", ".webmanifest": "application/manifest+json",
  ".md": "text/markdown; charset=utf-8", ".txt": "text/plain; charset=utf-8",
  ".sv": "text/plain; charset=utf-8", ".png": "image/png", ".epub": "application/epub+zip",
};
const digest = bytes => createHash("sha256").update(bytes).digest("hex");
const here = new URL("./", import.meta.url);
const source = await readFile(new URL("worker.mjs", here), "utf8");
const output = resolve(process.argv[2] || "build-output");
await mkdir(output, { recursive: true });

async function assetsAt(dir, prefix = "") {
  const from = new URL("public/" + dir + "/", here);
  const entries = await readdir(from, { withFileTypes: true });
  const assets = {};
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name, "en"))) {
    if (!entry.isFile()) continue;
    const ext = extname(entry.name);
    const type = types[ext];
    if (!type) continue;
    let bytes = await readFile(new URL(entry.name, from));
    if (!prefix && (ext === ".html" || ext === ".mjs")) {
      bytes = Buffer.from(bytes.toString("utf8")
        .replace(/<!-- github-pages-shell:start -->[\s\S]*?<!-- github-pages-shell:end -->\n/, "")
        .replaceAll("../common/", "./common/"));
    }
    assets["/" + prefix + entry.name] = { type, etag: JSON.stringify(digest(bytes)), body: bytes.toString("base64") };
  }
  return assets;
}

const common = await assetsAt("common", "common/");
const outcomes = [];
for (const unit of units) {
  const assets = { ...common, ...await assetsAt(unit.id) };
  const corpus = unit.id === "alphabet-sdk" ? records : [];
  const metadata = {
    main_module: "worker.mjs",
    compatibility_date: "2026-11-19",
    observability: { enabled: true, traces: { enabled: true, head_sampling_rate: 0.1 } },
    tags: ["nathan-ai", "alphabet-trinities", unit.id],
  };
  const release = digest(JSON.stringify({ metadata, source, search: queryEntries.toString(), assets, corpus })).slice(0, 16);
  const site = { id: unit.id, release, assets, records: corpus };
  await writeFile(resolve(output, unit.id + ".mjs"), source + "\n" + queryEntries.toString() +
    "\nconst site = " + JSON.stringify(site) + ";\nexport default { fetch: request => serve(request, site) };\n");
  await writeFile(resolve(output, unit.id + ".json"), JSON.stringify(metadata, null, 2) + "\n");
  outcomes.push({ ...unit, release, namespace });
}
await writeFile(resolve(output, "manifest.json"), JSON.stringify(outcomes, null, 2) + "\n");
console.log("Built " + outcomes.length + " independent Workers.");
