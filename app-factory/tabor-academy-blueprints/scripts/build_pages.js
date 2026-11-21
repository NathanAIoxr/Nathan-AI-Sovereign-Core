import { execFileSync } from "node:child_process";
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { build } from "esbuild";

const folder = ".build/pages";
rmSync(folder, { recursive: true, force: true });
mkdirSync(folder, { recursive: true });
cpSync("public", folder, { recursive: true });
execFileSync("python3", ["scripts/academy_icons.py", folder]);

const config = { bundle: true, format: "esm", platform: "browser", minify: true };
await Promise.all([
  build({ ...config, entryPoints: ["worker/index.js"], outfile: `${folder}/_worker.js` }),
  build({ ...config, entryPoints: ["public/field.js"], outfile: `${folder}/field.js`, external: ["./sync.js"] }),
]);
writeFileSync(`${folder}/_routes.json`, JSON.stringify({
  version: 1, include: ["/api", "/api/*"], exclude: [],
}));

const js = await build({ ...config, entryPoints: ["public/app.js"], write: false, format: "iife" });
const inline = js.outputFiles[0].text.replace(/<\/script/gi, "<\\/script");
const json = readFileSync("public/exports/blueprints.json", "utf8");
const csv = readFileSync("public/exports/blueprints.csv", "utf8");
const text = app => app.replace(/</g, "\\u003c");
const dataLink = (content, type) => `data:${type};base64,${Buffer.from(content).toString("base64")}`;
const css = readFileSync("public/phase2.css", "utf8");
const html = readFileSync("public/index.html", "utf8")
  .replaceAll(/^.*(?:fonts\.google|academy\.webmanifest|src="\/app\.js").*\n/gm, "")
  .replace('<link href="/phase2.css" rel="stylesheet">', `<style>${css}</style>`)
  .replace('href="/exports/blueprints.csv"', `href="${dataLink(csv, "text/csv")}"`)
  .replace('href="/exports/blueprints.json"', `href="${dataLink(json, "application/json")}"`)
  .replace(/.*href="\/exports\/tabor-academy-offline\.html".*\n/, "")
  .replace("</body>", () => `<script>globalThis.ACADEMY_OFFLINE=${text(json)};\n${inline}</script>\n</body>`);
writeFileSync(`${folder}/exports/tabor-academy-offline.html`, html);
