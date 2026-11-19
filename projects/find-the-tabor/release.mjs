import {mkdirSync,readFileSync,readdirSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';

const here = fileURLToPath(new URL('.',import.meta.url));
const root = process.argv[2] ?? join(here,'public');
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const paths = readdirSync(root,{recursive:true,withFileTypes:true})
  .filter(file => file.isFile() && file.name !== 'release.json')
  .map(file => join(file.parentPath,file.name).slice(root.length+1)).sort();
const files = paths.map(path => {
  const bytes = readFileSync(join(root,path));
  return {path,size:bytes.length,sha256:hash(bytes)};
});
mkdirSync(root,{recursive:true});
writeFileSync(join(root,'release.json'),JSON.stringify({schema:1,release:hash(JSON.stringify(files)),files},null,2)+'\n');
