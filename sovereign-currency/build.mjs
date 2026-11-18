import { readFile, writeFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { fileURLToPath, pathToFileURL } from "node:url";
import { resolve, sep } from "node:path";

const source = process.argv[2]
  ? pathToFileURL(resolve(process.argv[2]) + sep)
  : new URL("../app-factory/nathan-ai/sovereign-coins/", import.meta.url);
const publicSource = new URL("https://nathanaioxr.github.io/Nathan-AI-Sovereign-Core/app-factory/nathan-ai/sovereign-coins/");
const names = ["index.html", "style.css", "app.mjs", "engine.mjs", "registry.json"];
const assets = Object.fromEntries(await Promise.all(names.map(async name => [name, await readFile(new URL(name, source), "utf8")])));
for (const name of ["coin-families.json", "additional-coins.json", "conspectus.json", "catalog.css", "quantum-design.json"]) {
  assets[name] = await readFile(new URL(name, import.meta.url), "utf8");
}
assets["index.html"] = assets["index.html"]
  .replace(/<link[^>]+(?:data-nathan-shared-appearance|data-nathan-command-center)[^>]*>|<script\b[^>]*\bsrc="\.\.\/[^"]+"[^>]*><\/script>/g, "")
  .replace(/href="(\.\.?\/[^"]+)"/g, (attr, href) => href === "./style.css" ? attr : 'href="' + new URL(href, publicSource).href + '"')
  .replace("<body>", '<body><p><a href="https://tabor-world.nathantaboract.workers.dev/">Tabor World Hub</a> · <a href="/coins">All coin families</a> · <a href="/api/genesis">Run genesis verification</a> · <a href="/api/quantum/execute">Run Sovereign Core</a> · <a href="/switchboard">Sovereign Edge Switchboard</a> · <a href="/verifier">Cryptographic Ledger &amp; Block Verifier</a></p>');
const filename = "tabor-sovereign-agent.zip";
const archivePath = fileURLToPath(new URL(filename, import.meta.url));
execFileSync("python3", [fileURLToPath(new URL("package-agent.py", import.meta.url)), fileURLToPath(source), archivePath], { stdio: "inherit" });
const archive = await readFile(archivePath);
assets.agentArchive = archive.toString("base64");
assets.agentDownload = {
  filename, path: "/downloads/" + filename, bytes: archive.byteLength,
  sha256: createHash("sha256").update(archive).digest("hex")
};
const worker = await readFile(new URL("worker.mjs", import.meta.url), "utf8");
const catalog = await readFile(new URL("catalog.mjs", import.meta.url), "utf8");
const quantum = await readFile(new URL("quantum.mjs", import.meta.url), "utf8");
const switchboard = await readFile(new URL("switchboard.mjs", import.meta.url), "utf8");
const proof = await readFile(new URL("proof.mjs", import.meta.url), "utf8");
const ledger = (await readFile(new URL("proof-ledger.mjs", import.meta.url), "utf8")).split("\n").slice(1).join("\n");
const bundle = worker
  .replace('import { assets } from "./assets.mjs";', () => "const assets = " + JSON.stringify(assets) + ";")
  .replace('import { makeCatalog, catalogPage } from "./catalog.mjs";', () => catalog)
  .replace('import { runThreePhases } from "./quantum.mjs";', () => quantum)
  .replace('import { switchboardPage, switchboardReceipt } from "./switchboard.mjs";', () => switchboard)
  .replace('import { genesisPrefix, hashHeader, genesisReceipt, verifyHeader } from "./proof.mjs";', () => proof)
  .replace('import { listProofs, recordGenesis, proofInput, verifierPage } from "./proof-ledger.mjs";', () => ledger)
  .replace("export { genesisReceipt };", "");
await writeFile(new URL("dist.mjs", import.meta.url), bundle);
