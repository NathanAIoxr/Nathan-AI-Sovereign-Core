import { cp, mkdir, writeFile } from "node:fs/promises";
import { magazineResponse } from "../../magazine-runtime.mjs";
import { MAGAZINE } from "../src/magazine.js";

const output = new URL("../build/site/",import.meta.url);
const lexical = new URL("magazine/",output);
await mkdir(new URL("issues/",lexical),{recursive:true});
await mkdir(new URL("api/",output),{recursive:true});
await cp(new URL("../covers/",import.meta.url),new URL("covers/",lexical),{recursive:true});

const routes = [
  ["/","index.html"],
  ["/magazine/","magazine/index.html"],
  ["/magazine/play","magazine/play.html"],
  ["/magazine/play","game.html"],
  ["/api/magazine","api/magazine.json"],
  ...["style.css","reader.js","game.js","sw.js","manifest.webmanifest","icon-192.png","icon-512.png"].map(name=>["/magazine/"+name,"magazine/"+name]),
  ...MAGAZINE.issues.map(issue=>["/magazine/issues/"+issue.id,"magazine/issues/"+issue.id+".html"]),
];
for (const [route,path] of routes) {
  const response = await magazineResponse(new Request("https://magazine.local"+route),{},MAGAZINE);
  if (response.status !== 200) throw Error("Unexpected build status at "+route);
  await writeFile(new URL(path,output),new Uint8Array(await response.arrayBuffer()));
}
