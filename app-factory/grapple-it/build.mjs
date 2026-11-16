import {readdir,readFile,writeFile} from 'node:fs/promises';
const root=new URL('./public/',import.meta.url);
const files=await Promise.all((await readdir(root)).sort().map(async name=>[name,await readFile(new URL(name,root),'utf8')]));
await writeFile(new URL('./asset-bundle.mjs',import.meta.url),'export default '+JSON.stringify(Object.fromEntries(files))+';\n');
