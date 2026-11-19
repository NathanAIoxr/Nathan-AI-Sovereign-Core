import { readFile, writeFile } from "node:fs/promises";
const [id, manifestPath, outputPath] = process.argv.slice(2);
if (!/^[a-z]+$/.test(id || "") || !manifestPath || !outputPath) {
  throw new Error("Usage: node bundle.mjs <edition-id> <private-manifest.json> <output.mjs>");
}
const app = JSON.parse(await readFile(new URL("./" + id + "/app.json", import.meta.url), "utf8"));
const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
if (app.id !== id || !Array.isArray(manifest.sources) || !manifest.sources.length || !manifest.indexUrl) {
  throw new Error("Edition manifest is incomplete.");
}
const allowedGroups = id === "hindu" || id === "buddhist" ? [id, "shared"] : [id];
for (const source of manifest.sources) {
  if (!allowedGroups.includes(source.group) || source.key !== "release-v1/" + source.group + "/" + source.name) {
    throw new Error("Unexpected original path for this edition.");
  }
}
const runtime = await readFile(new URL("./runtime.mjs", import.meta.url), "utf8");
await writeFile(outputPath, runtime + "\nexport default createWorker(" + JSON.stringify(app) + "," + JSON.stringify(manifest) + ");\n", { mode: 0o600 });
