import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";

export function installEntry(source) {
  const line = 'import withApprenticeshipZone from "./academy-apprenticeship-zone.mjs";';
  const matches = [...source.matchAll(/^export default (.+);$/gm)];
  if (!source.includes('from "./worker.mjs"') || matches.length !== 1) throw Error("Unexpected Academy entry layout");
  const [statement,expression] = matches[0];
  if (source.includes(line)) {
    if (!expression.startsWith("withApprenticeshipZone(")) throw Error("Unexpected zone wrapper layout");
    return source;
  }
  return line+"\n"+source.replace(statement,()=>"export default withApprenticeshipZone("+expression+");");
}
export async function workerModule() {
  const module = await readFile(new URL("runtime.mjs",import.meta.url),"utf8");
  return {
    name:"academy-apprenticeship-zone.mjs",module,
    release:createHash("sha256").update(installEntry.toString()).update(module).digest("hex").slice(0,16),
  };
}
if (process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href) {
  console.log(JSON.stringify({ ...(await workerModule()),installer:installEntry.toString() }));
}
