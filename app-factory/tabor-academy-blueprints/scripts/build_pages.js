import { cpSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { build } from "esbuild";

const folder = ".build/pages";
rmSync(folder, { recursive: true, force: true });
mkdirSync(folder, { recursive: true });
cpSync("public", folder, { recursive: true });
await build({
  entryPoints: ["worker/index.js"], outfile: `${folder}/_worker.js`,
  bundle: true, format: "esm", platform: "browser", minify: true,
});
writeFileSync(`${folder}/_routes.json`, JSON.stringify({
  version: 1, include: ["/api", "/api/*"], exclude: [],
}));
