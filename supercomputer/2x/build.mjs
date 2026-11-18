import { readFile, writeFile } from "node:fs/promises";
const read = path => readFile(new URL(path, import.meta.url), "utf8");
const design = JSON.parse(await read("design.json"));
const worker = await read("worker.mjs");
await writeFile(new URL("dist.mjs", import.meta.url),
  worker.replace('import { design } from "./design.mjs";', () => "const design = " + JSON.stringify(design) + ";"));
