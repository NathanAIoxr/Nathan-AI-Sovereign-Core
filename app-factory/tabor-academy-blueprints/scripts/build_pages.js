import { cpSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { build } from "esbuild";
import "./bundle-direct.mjs";

const folder = ".build/pages";
rmSync(folder, { recursive: true, force: true });
mkdirSync(folder, { recursive: true });
cpSync("public", folder, { recursive: true });
cpSync(".build/direct/tabor-academy-offline.html", `${folder}/tabor-academy-offline.html`);
cpSync(".build/direct/tabor-academy-offline.html", `${folder}/exports/tabor-academy-offline.html`);
await build({ entryPoints: ["public/app.js"], outfile: `${folder}/app.js`,
  bundle: true, format: "esm", platform: "browser", minify: true, legalComments: "inline" });
await build({
  entryPoints: ["worker/index.js"], outfile: `${folder}/_worker.js`,
  bundle: true, format: "esm", platform: "browser", minify: true,
});
writeFileSync(`${folder}/_routes.json`, JSON.stringify({
  version: 1, include: ["/api", "/api/*"], exclude: [],
}));
