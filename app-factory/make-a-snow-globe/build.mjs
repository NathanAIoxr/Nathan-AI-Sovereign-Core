import {mkdir,readFile,readdir,writeFile} from 'node:fs/promises';
const folder = new URL('./public/',import.meta.url);
const files = Object.fromEntries(await Promise.all((await readdir(folder)).map(async file=>[file,await readFile(new URL(file,folder),'utf8')])));
const template = await readFile(new URL('./worker.mjs',import.meta.url),'utf8');
await mkdir(new URL('./.release/',import.meta.url),{recursive:true});
await writeFile(new URL('./.release/worker.mjs',import.meta.url),template.replace('/*__ASSETS__*/ {}',()=>JSON.stringify(files)));
