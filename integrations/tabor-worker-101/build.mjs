import { build } from "esbuild";
import { readdir } from "node:fs/promises";

const adapters = (await readdir("src"))
  .filter(file => /^\d{3}-.*\.mjs$/.test(file))
  .map(file => [file.slice(0, -4), "src/" + file]);
await build({
  entryPoints: Object.fromEntries([["registry-worker", "registry-worker.mjs"], ...adapters]),
  bundle: true,
  format: "esm",
  target: "es2024",
  platform: "browser",
  external: ["cloudflare:workers"],
  minify: true,
  legalComments: "inline",
  outdir: "dist",
  outExtension: { ".js": ".mjs" },
});
