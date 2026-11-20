import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { academyWords, launch, motto } from "./canon.mjs";

const types = {
  "index.html": "text/html; charset=utf-8",
  "style.css": "text/css; charset=utf-8",
  "app.js": "text/javascript; charset=utf-8"
};

export async function buildModule(revision, { withWorkspace = false } = {}) {
  if (!/^[0-9a-f]{40}$/.test(revision ?? "")) throw new Error("Expected a Git commit SHA");
  const read = name => readFile(new URL(name, import.meta.url), "utf8");
  const entries = await Promise.all(Object.entries(types).map(async ([name, type]) =>
    [name === "index.html" ? "" : name, { type, body: await read(name) }]));
  const canon = { academyWords, launch, motto };
  const assets = Object.fromEntries(entries);
  for (const line of [...motto, academyWords]) {
    if (!assets[""].body.includes(line)) throw new Error("The page is missing an exact authored line");
  }
  assets["canon.json"] = { type: "application/json; charset=utf-8", body: JSON.stringify(canon) };
  const runtime = (await read("worker.mjs")).replace("export function connectBigBang", "function connectBigBang");
  const dependency = withWorkspace ? 'import privateWorkspace from "./academy-workspace-dispatch.mjs";\n' : '';
  return dependency + runtime + "\nexport default academy => connectBigBang(academy, Object.assign(Object.create(null), " +
    JSON.stringify(assets) + "), " + JSON.stringify(revision) + ", " + JSON.stringify(canon) +
    (withWorkspace ? ", privateWorkspace" : "") + ");\n";
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
  process.stdout.write(await buildModule(process.argv[2], { withWorkspace: process.argv.includes("--with-workspace") }));
}
