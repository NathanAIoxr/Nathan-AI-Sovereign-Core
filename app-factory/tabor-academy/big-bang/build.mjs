import { motto, original } from "./fieldwork-build.mjs";
import { renderFieldwork } from "./page.mjs";
import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";

const types = {
  "index.html": "text/html; charset=utf-8",
  "style.css": "text/css; charset=utf-8",
  "app.js": "text/javascript; charset=utf-8"
};

export async function buildModule(revision) {
  if (!/^[0-9a-f]{40}$/.test(revision ?? "")) throw new Error("Expected a Git commit SHA");
  const read = name => readFile(new URL(name, import.meta.url), "utf8");
  const entries = await Promise.all(Object.entries(types).map(async ([name, type]) =>
    [name === "index.html" ? "" : name, { type, body: await read(name) }]));
  entries.push(["fieldwork/", { type: "text/html; charset=utf-8", body: renderFieldwork(motto) }],
    ["source.txt", { type: "text/plain; charset=utf-8", body: original }]);
  const runtime = (await read("worker.mjs")).replace("export function connectBigBang", "function connectBigBang");
  return runtime + "\nexport default academy => connectBigBang(academy, Object.assign(Object.create(null), " +
    JSON.stringify(Object.fromEntries(entries)) + "), " + JSON.stringify(revision) + ");\n";
}

export function patchAcademyEntry(entry) {
  const line = 'import withBigBang from "./academy-big-bang.mjs";';
  if (entry.includes(line)) {
    if (!entry.includes("export default withBigBang({") || !/\}\);\s*$/.test(entry)) {
      throw new Error("Incomplete Big Bang entry");
    }
    return entry;
  }
  if ((entry.match(/\bexport default\b/g) ?? []).length !== 1 ||
      !entry.includes("export default {") || !/\};\s*$/.test(entry)) {
    throw new Error("Unrecognized Academy entry");
  }
  return line + "\n" + entry.replace("export default {", "export default withBigBang({")
    .replace(/\};(\s*)$/, "});$1");
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.stdout.write(await buildModule(process.argv[2]));
}
