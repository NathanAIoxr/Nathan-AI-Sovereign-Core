import { readFile, writeFile } from "node:fs/promises";

const source = ["style.css", "app.mjs", "model.mjs", "history.css", "history-client.mjs", "history-lab.mjs"];
const assets = Object.fromEntries(await Promise.all(source.map(async file =>
  [file, await readFile(new URL(file, import.meta.url), "utf8")])));
await writeFile(new URL("assets.generated.mjs", import.meta.url), "export default " + JSON.stringify(assets) + ";\n");
