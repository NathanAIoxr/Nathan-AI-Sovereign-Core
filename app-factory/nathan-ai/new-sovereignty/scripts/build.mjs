import { readFile } from "node:fs/promises";

const modules = ["canon.mjs", "proof.mjs", "worker.mjs"];
const code = await Promise.all(modules.map(async name => {
  const content = await readFile(new URL("../src/" + name, import.meta.url), "utf8");
  return content.replace(/^import \{[^\n]+\} from "\.\/[^"\n]+";\n/gm, "");
}));
process.stdout.write(code.join("\n"));
