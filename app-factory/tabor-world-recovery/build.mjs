import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import { createHash } from "node:crypto";
import { collections, sourceRows, repoUrl, snapshot, assembleAtlas } from "./collections.mjs";

const root = fileURLToPath(new URL("../../", import.meta.url));
const here = fileURLToPath(new URL("./", import.meta.url));
const { values } = parseArgs({ options: { out: { type: "string" }, private: { type: "string" } } });
const out = resolve(values.out ?? resolve(here, "dist/index.html"));
const entries = await Promise.all(collections.map(async ([name, path, selector]) => {
  const file = await readFile(resolve(root, path));
  const rows = sourceRows(JSON.parse(file), selector);
  return { name, source: path.endsWith("/federation.json") ? "https://tabor-world-recovery.nathantaboract.workers.dev/federation.json" :
    repoUrl + "/blob/" + snapshot + "/" + path, rows, sha256: createHash("sha256").update(file).digest("hex") };
}));
const open = async name => JSON.parse(await readFile(resolve(root, name), "utf8"));
entries.push(await assembleAtlas(open, name => import(new URL("../../" + name, import.meta.url))));
const privateGroups = values.private ? JSON.parse(await readFile(values.private, "utf8")) : [];
const html = await readFile(resolve(here, "index.html"), "utf8");
const viewer = await readFile(resolve(here, "viewer.mjs"), "utf8");
const functions = (await readFile(resolve(here, "collections.mjs"), "utf8")).replaceAll("export ", "");
const inline = functions + "\n" + viewer.replace(/^import[^\n]*\n/, "");
const payload = JSON.stringify([...entries, ...privateGroups]).replaceAll("<", "\\u003c");
const result = html.replace("<!-- RECOVERY_BOOTSTRAP -->", () =>
  '<script type="application/json" id="recovered-records">' + payload + "</script>")
  .replace('<script type="module" src="./viewer.mjs"></script>', () =>
    '<script type="module">\n' + inline + "\n</script>");
await mkdir(dirname(out), { recursive: true });
await writeFile(out, result);
console.log(JSON.stringify({ collections: entries.length, publicRows: entries.reduce((sum, e) => sum + e.rows.length, 0),
  privateCollections: privateGroups.length, privateRows: privateGroups.reduce((sum, e) => sum + e.rows.length, 0) }));
