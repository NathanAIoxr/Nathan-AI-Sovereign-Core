import {readdir,readFile,writeFile} from "node:fs/promises";
import {catalog} from "./public/games.mjs";
const root=new URL("./public/",import.meta.url);
const files=Object.fromEntries(await Promise.all((await readdir(root)).sort().map(async name=>[name,await readFile(new URL(name,root),"utf8")])));
const catalogJSON=JSON.stringify(Object.values(catalog),null,2)+"\n";
if(files["catalog.json"]!==catalogJSON) throw new Error("Update public/catalog.json to match games.mjs");
for(const path of [
  "standalone-apps/tactilecore-sdk/src/engine.mjs",
  "standalone-apps/tactilecore-sdk/LICENSE.md",
  "standalone-apps/hook-and-ring/game/input.mjs",
  "standalone-apps/hook-and-ring/game/physics.mjs",
]){
  files[path]=await readFile(new URL("../../"+path,import.meta.url),"utf8");
}
await writeFile(new URL("./asset-bundle.mjs",import.meta.url),"export default "+JSON.stringify(files)+";\n");
