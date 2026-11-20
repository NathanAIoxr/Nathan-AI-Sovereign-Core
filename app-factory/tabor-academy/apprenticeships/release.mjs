import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";

const files = {
  "runtime.mjs": "academy-apprenticeships.mjs",
  "pathways.mjs": "academy-apprenticeships-pathways.mjs",
  "registered.snapshot.mjs": "academy-apprenticeships-registered.mjs",
  "sources.mjs": "academy-apprenticeships-sources.mjs",
};

export function installEntry(source) {
  const importLine = 'import withApprenticeships from "./academy-apprenticeships.mjs";';
  const entryLine = /^export default (.+);$/gm;
  const exports = [...source.matchAll(entryLine)];
  if (!source.includes('from "./worker.mjs"') || exports.length !== 1) {
    throw Error("Academy entry layout changed");
  }
  const [statement, expression] = exports[0];
  if (source.includes(importLine)) {
    if (!expression.startsWith("withApprenticeships(")) throw Error("Apprenticeship wrapper layout changed");
    return source;
  }
  return importLine + "\n" + source.replace(statement, () => "export default withApprenticeships(" + expression + ");");
}

export async function buildModules() {
  const modules = {};
  for (const [filename, target] of Object.entries(files)) {
    const code = await readFile(new URL(filename, import.meta.url), "utf8");
    modules[target] = code.replace(/from "\.\/([^"]+)";/g, (original, name) =>
      Object.hasOwn(files, name) ? 'from "./' + files[name] + '";' : original);
  }
  const release = createHash("sha256").update(installEntry.toString()).update(JSON.stringify(modules)).digest("hex").slice(0, 16);
  return { release, modules };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.stdout.write(JSON.stringify(await buildModules()));
}
