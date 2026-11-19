import { mkdir, readFile, writeFile } from "node:fs/promises";

const web = await readFile(new URL("../src/web.js",import.meta.url),"utf8");
const worker = await readFile(new URL("../src/index.js",import.meta.url),"utf8");
const entry = 'import { webResponse } from "./web.js";\n';
if (!worker.startsWith(entry) || !web.includes("export function webResponse(")) {
  throw new Error("The Pages bundler requires the app's exact local webResponse import.");
}
const output = new URL("../build/pages/",import.meta.url);
await mkdir(output,{recursive:true});
const bundle = web.replace("export function webResponse(","function webResponse(") + "\n" + worker.slice(entry.length);
await writeFile(new URL("_worker.js",output),bundle);
const bot = await readFile(new URL("../src/bot.js",import.meta.url),"utf8");
const botImport = 'import appWorker from "./index.js";\n';
if (!bot.startsWith(botImport) || !bundle.includes("export default {")) {
  throw new Error("The Worker bot requires the app module.");
}
await writeFile(new URL("../worker-bot.js",output),bundle.replace("export default {","const appWorker = {") + "\n" + bot.slice(botImport.length));

