import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const destination = process.argv[2];
if (!destination) throw new Error("Pass an output directory for the native game assets.");

const output = resolve(destination);
const scratch = await mkdtemp(join(tmpdir(), "two-plate-assets-"));
const source = new URL("../build.mjs", import.meta.url);
const workerPath = join(scratch, "worker.mjs");
const pages = new Map([
  ["/", "index.html"],
  ["/book", "book.html"],
  ["/game.mjs", "game.mjs"],
  ["/memes.mjs", "memes.mjs"],
  ["/style.css", "style.css"],
  ["/icon-192.png", "icon-192.png"],
  ["/icon-512.png", "icon-512.png"],
  ["/manifest.webmanifest", "manifest.webmanifest"],
  ["/The-Two-Plate-Reckoning.pdf", "The-Two-Plate-Reckoning.pdf"],
]);

try {
  execFileSync(process.execPath, [fileURLToPath(source), workerPath, "--root"], { stdio: "inherit" });
  const { default: worker } = await import(pathToFileURL(workerPath).href);
  const routes = {};
  const assets = new Map();
  for (const [route, filename] of pages) {
    const response = worker.fetch(new Request(new URL(route, "https://two-plate.invalid")));
    if (!response.ok) throw new Error("Missing native asset " + route);
    const type = response.headers.get("content-type");
    const bytes = Buffer.from(await response.arrayBuffer());
    if (!bytes.length || !type) throw new Error("Invalid native asset " + route);
    routes[route] = { filename, type, sha256: createHash("sha256").update(bytes).digest("hex") };
    assets.set(filename, bytes);
  }
  await mkdir(output, { recursive: true });
  for (const [filename, bytes] of assets) await writeFile(join(output, filename), bytes);
  await writeFile(join(output, "native-routes.json"), JSON.stringify(routes, null, 2) + "\n");
  console.log("Prepared " + assets.size + " offline Two-Plate Reckoning assets.");
} finally {
  await rm(scratch, { recursive: true, force: true });
}
