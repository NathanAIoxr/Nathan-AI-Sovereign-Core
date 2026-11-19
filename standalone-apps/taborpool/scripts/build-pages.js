import { cp, mkdir, readFile, writeFile } from "node:fs/promises";

const read = relative => readFile(new URL(relative,import.meta.url),"utf8");
const [runtime,edition,web,worker,bot] = await Promise.all([
  read("../../magazine-runtime.mjs"),read("../src/magazine.js"),read("../src/web.js"),read("../src/index.js"),read("../src/bot.js")
]);
const main = worker.replace(/^import [^\n]+\n/gm,"");
const output = new URL("../build/pages/",import.meta.url);
await mkdir(new URL("magazine/",output),{recursive:true});
await cp(new URL("../covers/",import.meta.url),new URL("magazine/covers/",output),{recursive:true});
const bundle = [
  runtime.replace("export async function magazineResponse(","async function magazineResponse("),
  edition.replace("export const MAGAZINE","const MAGAZINE"),
  web.replace("export function webResponse(","function webResponse("),
  main
].join("\n");
await writeFile(new URL("_worker.js",output),bundle);
const botBody = bot.replace(/^import [^\n]+\n/gm,"");
await writeFile(new URL("../worker-bot.js",output),bundle.replace("export default {","const appWorker = {")+"\n"+botBody);
