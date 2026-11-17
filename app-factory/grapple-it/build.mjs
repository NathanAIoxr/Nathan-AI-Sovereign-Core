import {createHash} from 'node:crypto';
import {readdir,readFile,writeFile} from 'node:fs/promises';
const root=new URL('./public/',import.meta.url);
const assets=Object.fromEntries(await Promise.all((await readdir(root)).sort().map(async name=>[
 name,await readFile(new URL(name,root),'utf8'),
])));
const offlineRevision=createHash('sha256').update(JSON.stringify(assets)).digest('hex').slice(0,24);
assets['sw.js']=assets['sw.js'].replace('__OFFLINE_REVISION__',offlineRevision);
await writeFile(new URL('./asset-bundle.mjs',import.meta.url),'export default '+JSON.stringify(assets)+';\n');
