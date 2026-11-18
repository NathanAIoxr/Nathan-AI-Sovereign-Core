import { build } from "esbuild";
import { mkdir, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
const base=fileURLToPath(new URL("./",import.meta.url));
const workers=JSON.parse(await readFile(new URL("./workers.json",import.meta.url)));
await mkdir(new URL("./build/",import.meta.url),{recursive:true});
for (const worker of workers) {
  await build({
    absWorkingDir:base, entryPoints:[worker.entrypoint], outfile:"build/"+worker.name+".mjs",
    bundle:true, minify:true, format:"esm", platform:"browser", target:"es2022",
    external:["cloudflare:node","node:http"], legalComments:"inline",
  });
}
console.log(JSON.stringify(workers.map(w=>w.name)));
