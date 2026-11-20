import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { build, original } from "./build.mjs";

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
  const canonical = await build(revision);
  const lesson = canonical.serve(new Request("https://academy.example/big-bang/"));
  entries.push(["source.txt", { type: "text/plain; charset=utf-8", body: original }]);
  entries.push(["lesson/", { type: types["index.html"], body: await lesson.text(),
    policy: lesson.headers.get("content-security-policy") }]);
  const runtime = (await read("worker.mjs")).replace("export function connectBigBang", "function connectBigBang");
  const workspaceModule = withWorkspace ? 'import privateWorkspace from "./academy-workspace-dispatch.mjs";\n' : '';
  return workspaceModule + runtime + "\nexport default academy => connectBigBang(academy, Object.assign(Object.create(null), " +
    JSON.stringify(Object.fromEntries(entries)) + "), " + JSON.stringify(revision) + ", " + JSON.stringify(canonical.home) + (withWorkspace ? ", privateWorkspace" : "") + ");\n";
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
