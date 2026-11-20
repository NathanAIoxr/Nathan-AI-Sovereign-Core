import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const names = ["dispatch.mjs","holding.mjs","model.mjs","worker.mjs","assets.mjs"];

export async function bundleWorkspace(dist) {
  const modules=await Promise.all(names.map(async name=>{
    const code=await readFile(resolve(dist,name),"utf8");
    const renamed=code.replace(/(from ['"]\.\/)([a-z]+\.mjs)(['"])/g, (match,start,file,end)=>
      names.includes(file)?start+"academy-workspace-"+file+end:match);
    return ["academy-workspace-"+name,renamed];
  }));
  return Object.fromEntries(modules);
}

if(process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href) {
  console.log(JSON.stringify(await bundleWorkspace(process.argv[2])));
}
