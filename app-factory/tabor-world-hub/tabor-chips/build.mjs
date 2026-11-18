import { readFile, writeFile } from "node:fs/promises";
const read = name => readFile(new URL(name, import.meta.url), "utf8");
const [chip, continuation, css, client, ownerSource] = await Promise.all([
  read("tabor-chip-stack.json"), read("continuation-map.json"), read("style.css"), read("client.mjs"), read("TABOR_CHIPS_MASTER_ARCHITECTURE.md")
]);
const assets = { chip: JSON.parse(chip), continuation: JSON.parse(continuation), css, client, ownerSource };
await writeFile(new URL("assets.generated.mjs", import.meta.url), "export default " + JSON.stringify(assets) + ";\n");
