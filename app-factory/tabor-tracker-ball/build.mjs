import {readdir,readFile,writeFile} from "node:fs/promises";
import {catalog} from "./public/games.mjs";
const root=new URL("./public/",import.meta.url);
const files=Object.fromEntries(await Promise.all((await readdir(root)).sort().map(async name=>[name,await readFile(new URL(name,root),"utf8")])));
const catalogJSON=JSON.stringify(Object.values(catalog),null,2)+"\n";
if(files["catalog.json"]!==catalogJSON) throw new Error("Update public/catalog.json to match games.mjs");
await writeFile(new URL("./asset-bundle.mjs",import.meta.url),"export default "+JSON.stringify(files)+";\n");
