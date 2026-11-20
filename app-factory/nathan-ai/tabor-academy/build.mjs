import { readFile, writeFile, mkdir, copyFile } from 'node:fs/promises';
const files={'/':'web/index.html','/app.mjs':'web/app.mjs','/style.css':'web/style.css',
  '/model.mjs':'src/model.mjs','/specification':'SPECIFICATION.md'};
const assets=await Promise.all(Object.entries(files).map(async ([route,path])=>[route,await readFile(new URL(path,import.meta.url),'utf8')]));
await mkdir(new URL('./dist/',import.meta.url),{recursive:true});
for(const name of ['model.mjs','worker.mjs']) await copyFile(new URL('src/'+name,import.meta.url),new URL('dist/'+name,import.meta.url));
await writeFile(new URL('./dist/assets.mjs',import.meta.url),'export const assets='+JSON.stringify(Object.fromEntries(assets))+';\n');
